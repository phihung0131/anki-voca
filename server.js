// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const json2csv = require('json2csv').parse;
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// ============ MONGODB CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vocabulary';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('error', err => console.error('❌ MongoDB error:', err));

// ============ SCHEMA & MODEL ============
const collocationSchema = new mongoose.Schema({
    collocation: { type: String, required: true, unique: true },
    ipa: String,
    meaning: String,
    synonyms: String,
    createdAt: { type: Date, default: Date.now }
});

const Collocation = mongoose.model('Collocation', collocationSchema);

// ============ API ROUTES ============

// 1. Thêm 1 hoặc nhiều từ
app.post('/api/add-collocations', async (req, res) => {
    try {
        const { collocations } = req.body;

        if (!Array.isArray(collocations) || collocations.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Cần gửi array collocations' });
        }

        // Thêm vào DB
        const result = await Collocation.insertMany(collocations, { ordered: false }).catch(err => {
            // Nếu có duplicate, vẫn insert những cái khác
            if (err.code === 11000) {
                return err.insertedDocs || [];
            }
            throw err;
        });

        return res.json({
            status: 'success',
            insertedCount: Array.isArray(result) ? result.length : 1,
            message: `Đã thêm ${Array.isArray(result) ? result.length : 1} collocation`
        });
    } catch (error) {
        console.error('❌ Error adding collocations:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 2. Check từ tồn tại
app.post('/api/check-word', async (req, res) => {
    try {
        const { word } = req.body;

        if (!word) {
            return res.status(400).json({ status: 'error', message: 'Cần gửi word' });
        }

        const exists = await Collocation.findOne({ collocation: new RegExp(word, 'i') });

        return res.json({
            status: 'success',
            exists: !!exists
        });
    } catch (error) {
        console.error('❌ Error checking word:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 3. Xuất CSV
app.get('/api/export-csv', async (req, res) => {
    try {
        const data = await Collocation.find({}).lean();

        if (data.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Không có dữ liệu' });
        }

        // Chọn fields để export
        const fields = ['collocation', 'ipa', 'meaning', 'synonyms']    ;
        const csv = json2csv(data, { fields });

        // Tạo response với CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="vocabulary.csv"');
        res.send(csv);
    } catch (error) {
        console.error('❌ Error exporting CSV:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 4. Xóa toàn bộ
app.post('/api/delete-all', async (req, res) => {
    try {
        const result = await Collocation.deleteMany({});

        return res.json({
            status: 'success',
            deletedCount: result.deletedCount,
            message: `Đã xóa ${result.deletedCount} collocations`
        });
    } catch (error) {
        console.error('❌ Error deleting all:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 5. Lấy danh sách tất cả (tùy chọn)
app.get('/api/collocations', async (req, res) => {
    try {
        const data = await Collocation.find({}).limit(1000);
        res.json({ status: 'success', count: data.length, data });
    } catch (error) {
        console.error('❌ Error fetching:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 6. Generate collocations (gọi AI API)
app.post('/api/generate', async (req, res) => {
    try {
        const { words } = req.body;
        if (!Array.isArray(words) || words.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Cần gửi array words' });
        }

        // Đọc API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ status: 'error', message: 'API key chưa được cấu hình' });
        }

        // Tạo prompt
        const prompt = `
Tạo collocations cho danh sách từ sau: ${words.map(w => `"${w}"`).join(", ")}

Yêu cầu:
1. Với mỗi từ, tạo 1-5 collocations phổ biến nhất
2. Trả về JSON:
{
    "results": [
        {
            "collocation": "strong coffee",
            "ipa": "/strɒŋ ˈkɒfi/",
            "meaning": "cà phê đậm đà",
            "synonyms": "intense coffee"
        }, ...
    ]
}
`;

        // Gọi Gemini API
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const aiData = await aiResponse.json();
        const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({ status: 'error', message: 'Không nhận được phản hồi từ AI' });
        }

        // Parse JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(500).json({ status: 'error', message: 'Không tìm thấy JSON trong response' });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const collocations = parsed.results || [];

        // Lưu vào database
        if (collocations.length > 0) {
            await Collocation.insertMany(collocations, { ordered: false }).catch(err => {
                if (err.code !== 11000) throw err; // Ignore duplicates
            });
        }

        res.json({ status: 'success', count: collocations.length, message: `Đã tạo ${collocations.length} collocations` });
    } catch (error) {
        console.error('❌ Error generating:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 7. Lưu API key
app.post('/api/save-apikey', async (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey) {
            return res.status(400).json({ status: 'error', message: 'Cần gửi apiKey' });
        }

        // Lưu vào .env file
        let envContent = '';
        if (fs.existsSync('.env')) {
            envContent = fs.readFileSync('.env', 'utf8');
        }

        // Update hoặc thêm GEMINI_API_KEY
        const lines = envContent.split('\n');
        let found = false;
        const newLines = lines.map(line => {
            if (line.startsWith('GEMINI_API_KEY=')) {
                found = true;
                return `GEMINI_API_KEY=${apiKey}`;
            }
            return line;
        });

        if (!found) {
            newLines.push(`GEMINI_API_KEY=${apiKey}`);
        }

        fs.writeFileSync('.env', newLines.join('\n'));
        process.env.GEMINI_API_KEY = apiKey; // Update runtime

        res.json({ status: 'success', message: 'Đã lưu API key' });
    } catch (error) {
        console.error('❌ Error saving API key:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============ VOCABULARY MANAGEMENT APIs ============

// 8. Lấy danh sách với phân trang và tìm kiếm
app.get('/api/vocabulary', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Tạo query filter
        const filter = search ? {
            $or: [
                { collocation: new RegExp(search, 'i') },
                { meaning: new RegExp(search, 'i') },
                { synonyms: new RegExp(search, 'i') }
            ]
        } : {};

        // Đếm tổng số
        const total = await Collocation.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        // Lấy dữ liệu
        const data = await Collocation.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            status: 'success',
            data,
            page,
            limit,
            total,
            totalPages
        });
    } catch (error) {
        console.error('❌ Error fetching vocabulary:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 9. Thêm collocation mới
app.post('/api/vocabulary', async (req, res) => {
    try {
        const { collocation, ipa, meaning, synonyms } = req.body;

        if (!collocation) {
            return res.status(400).json({ status: 'error', message: 'Cần có collocation' });
        }

        const newItem = new Collocation({
            collocation,
            ipa,
            meaning,
            synonyms
        });

        await newItem.save();

        res.json({
            status: 'success',
            message: 'Đã thêm collocation',
            data: newItem
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', message: 'Collocation đã tồn tại' });
        }
        console.error('❌ Error adding vocabulary:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 10. Sửa collocation
app.put('/api/vocabulary/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { collocation, ipa, meaning, synonyms } = req.body;

        const updated = await Collocation.findByIdAndUpdate(
            id,
            { collocation, ipa, meaning, synonyms },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy' });
        }

        res.json({
            status: 'success',
            message: 'Đã cập nhật',
            data: updated
        });
    } catch (error) {
        console.error('❌ Error updating vocabulary:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 11. Xóa collocation
app.delete('/api/vocabulary/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Collocation.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy' });
        }

        res.json({
            status: 'success',
            message: 'Đã xóa',
            data: deleted
        });
    } catch (error) {
        console.error('❌ Error deleting vocabulary:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});