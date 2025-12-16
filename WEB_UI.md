# 📱 Web UI - Vocabulary Manager

Web interface đơn giản, mobile-first để quản lý từ vựng.

## 🚀 Cách dùng

1. **Start server**:
   ```bash
   npm start
   ```

2. **Mở browser**:
   ```
   http://localhost:3000
   ```

## ✨ Tính năng

### 1️⃣ Thêm từ
- Nhập từ tiếng Anh
- Tự động check trùng lặp
- Thêm vào queue local (trên browser)

### 2️⃣ Generate Collocations
- Click "Generate Collocations"
- Tự động gọi Google Gemini AI
- Lưu vào MongoDB

### 3️⃣ Export CSV
- Xuất tất cả từ vựng ra file CSV
- Dùng để import vào Anki

### 4️⃣ Xóa tất cả
- Xóa toàn bộ database
- Có confirm trước khi xóa

### 5️⃣ Cài đặt API Key
- Nhập Google AI API Key
- Lưu vào file `.env`
- Không cần restart server

## 📝 API Endpoints mới

### POST `/api/generate`
Generate collocations từ danh sách từ.

**Request:**
```json
{
  "words": ["coffee", "strong", "make"]
}
```

**Response:**
```json
{
  "status": "success",
  "count": 15,
  "message": "Đã tạo 15 collocations"
}
```

### POST `/api/save-apikey`
Lưu API key vào `.env`.

**Request:**
```json
{
  "apiKey": "AIza..."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Đã lưu API key"
}
```

## 📱 Mobile-First Design

- Responsive layout (max-width: 448px)
- Touch-friendly buttons
- Simple, clean interface
- Tailwind CSS (CDN)

## 🔧 Tech Stack

- HTML5
- Vanilla JavaScript
- Tailwind CSS (CDN)
- Fetch API

## 🎨 Screenshots

- Header gradient: Blue to Purple
- Cards: White background với shadow
- Buttons: Color-coded (Add=Blue, Generate=Green, Delete=Red)

## ⚠️ Lưu ý

- API key lưu trong `.env` file (plaintext)
- Queue lưu local trên browser (mất khi refresh)
- Cần Google AI API key để generate
- Server phải chạy trên Node v18+
