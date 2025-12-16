# 📖 Trang Quản lý Từ vựng

Trang quản lý CRUD đầy đủ với phân trang và tìm kiếm.

## 🚀 Truy cập

```
http://localhost:3000/manage.html
```

Hoặc từ trang chủ → Click "📖 Quản lý từ"

## ✨ Tính năng

### 1️⃣ **Thêm Collocation**
- Form ở đầu trang
- Nhập đầy đủ: Collocation, IPA, Nghĩa, Từ đồng nghĩa
- Click "💾 Lưu"
- Tự động check trùng lặp

### 2️⃣ **Sửa Collocation**
- Click icon ✏️ trên mỗi item
- Form tự động fill dữ liệu
- Chỉnh sửa và click "💾 Lưu"
- Có nút "✕ Hủy" để cancel

### 3️⃣ **Xóa Collocation**
- Click icon 🗑️
- Có confirm trước khi xóa
- Xóa vĩnh viễn khỏi database

### 4️⃣ **Tìm kiếm**
- Search bar tìm trong: collocation, meaning, synonyms
- Gõ và nhấn Enter hoặc click "Tìm kiếm"
- Hỗ trợ tiếng Việt và tiếng Anh
- Không phân biệt hoa thường

### 5️⃣ **Phân trang**
- Mỗi trang: 10 items
- Nút "← Trước" và "Sau →"
- Hiển thị: Trang X / Y
- Disable button khi ở trang đầu/cuối

### 6️⃣ **Thống kê**
- Hiển thị tổng số collocations
- Real-time update khi thêm/xóa

## 📱 Responsive Design

- Desktop: max-width 1024px (4xl)
- Mobile: Full width với padding
- Touch-friendly buttons
- Cards với hover effects

## 🎨 UI Features

- **Gradient header**: Green → Blue
- **Card layout**: Mỗi collocation là 1 card
- **Color-coded info**:
  - 🔵 Collocation (blue heading)
  - 🇻🇳 Nghĩa tiếng Việt
  - ↔️ Từ đồng nghĩa
  - 📅 Ngày thêm
- **Actions**: Edit (blue) / Delete (red)

## 🔧 API Endpoints

### GET `/api/vocabulary`
Lấy danh sách với phân trang.

**Query params:**
- `page`: Số trang (default: 1)
- `limit`: Số items/trang (default: 10)
- `search`: Từ khóa tìm kiếm (optional)

**Response:**
```json
{
  "status": "success",
  "data": [...],
  "page": 1,
  "limit": 10,
  "total": 100,
  "totalPages": 10
}
```

### POST `/api/vocabulary`
Thêm collocation mới.

**Request:**
```json
{
  "collocation": "strong coffee",
  "ipa": "/strɒŋ ˈkɒfi/",
  "meaning": "cà phê đậm đà",
  "synonyms": "intense coffee"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Đã thêm collocation",
  "data": {...}
}
```

### PUT `/api/vocabulary/:id`
Sửa collocation theo ID.

**Request:** Giống POST

**Response:**
```json
{
  "status": "success",
  "message": "Đã cập nhật",
  "data": {...}
}
```

### DELETE `/api/vocabulary/:id`
Xóa collocation theo ID.

**Response:**
```json
{
  "status": "success",
  "message": "Đã xóa",
  "data": {...}
}
```

## 💡 Use Cases

### Thêm từ thủ công
1. Mở trang quản lý
2. Nhập đầy đủ thông tin
3. Click "Lưu"

### Sửa lỗi chính tả
1. Tìm từ cần sửa
2. Click ✏️
3. Sửa và lưu

### Xóa từ trùng lặp
1. Tìm kiếm từ
2. Xem các kết quả trùng
3. Xóa các item không cần

### Browse toàn bộ từ vựng
1. Mở trang quản lý
2. Lướt qua các trang
3. Xem thông tin chi tiết

## 📊 Database

- Model: `Collocation`
- Collection: `collocations`
- Unique constraint: `collocation` field

## 🔗 Navigation

- **Trang chủ** (`/`) → Click "📖 Quản lý từ"
- **Trang quản lý** (`/manage.html`) → Click "← Trang chủ"

## ⚡ Performance

- **Lazy loading**: Chỉ load 10 items/lần
- **Index MongoDB**: Tối ưu query tìm kiếm
- **Client-side render**: Không reload trang khi CRUD

## 🎯 Tips

- **Nhấn Enter trong search** để tìm nhanh
- **Scroll to top** tự động khi edit
- **Confirm dialog** trước khi xóa
- **Auto-refresh** sau mỗi thao tác
