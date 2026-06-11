# English Flashcard App

Ứng dụng web học từ vựng tiếng Anh bằng flashcard với thuật toán lặp lại ngắt quãng (SRS), dành cho tối đa 5 người dùng.

## Tính năng

- Đăng nhập JWT, đổi mật khẩu
- Admin quản lý tài khoản (tối đa 5 người học)
- CRUD bộ từ và flashcard
- Chia sẻ bộ từ (private/shared)
- Học flashcard với 4 mức đánh giá: Quên / Khó / Tốt / Dễ
- Thuật toán SRS V1 tự tính lịch ôn
- Tiến độ học riêng cho từng người
- Import CSV, phát âm Web Speech API
- Dashboard, thống kê, chuỗi ngày học
- Dark mode, responsive

## Công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI + SQLAlchemy |
| Database | SQLite |
| Auth | JWT + bcrypt |

## Khởi chạy

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173

### Tài khoản mặc định

- **Username:** `admin`
- **Password:** `admin1234`

## API

Swagger UI: http://localhost:8080/docs

> **Lưu ý:** Nếu port 8080 bị chiếm, đổi sang port khác (ví dụ `8000`) và cập nhật `target` trong `frontend/vite.config.js` cho khớp.

## Import CSV

File mẫu (`front,back` bắt buộc):

```csv
front,back,phonetic,part_of_speech,example,example_translation,tags
achievement,thành tựu,/əˈtʃiːvmənt/,noun,This is a great achievement.,Đây là một thành tựu lớn.,"IELTS,Education"
maintain,duy trì,/meɪnˈteɪn/,verb,We need to maintain quality.,Chúng ta cần duy trì chất lượng.,"IELTS,Work"
```

## Kiểm thử

```bash
cd backend
source venv/bin/activate
pytest
```

## Cấu trúc thư mục

```
├── backend/          # FastAPI API
│   ├── app/
│   │   ├── api/      # Routes
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic + SRS
│   └── tests/
└── frontend/         # React SPA
    └── src/
        ├── api/
        ├── components/
        └── pages/
```

## Deploy

- **Frontend:** Vercel (`npm run build`)
- **Backend:** Render / Railway (đổi `DATABASE_URL` sang PostgreSQL nếu cần)
