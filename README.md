# Food Management System

## 1. Giới thiệu
Xây dựng hệ thống quản lý món ăn, hỗ trợ xem, tìm kiếm, thêm, sửa và xóa món ăn.

## 2. Công nghệ sử dụng
- Frontend: React
- Backend: Node.js, Express
- Database: MongoDB Atlas
- Quản lý mã nguồn: Git, GitHub
- Đóng gói: Docker
- Lưu trữ image: Docker Hub
- Triển khai: Render

## 3. Cấu trúc dự án
- backend/: mã nguồn xử lý API
- frontend/: mã nguồn giao diện người dùng
- docs/: tài liệu dự án
- README.md: hướng dẫn dự án
- .gitignore: danh sách tệp Git bỏ qua

## 4. Cài đặt và chạy
Các bước cài đặt, cấu hình môi trường và chạy frontend/backend sẽ được cập nhật khi hoàn thiện mã nguồn.

## 5. Bảo mật
Không đưa tệp .env, mật khẩu, access token hoặc thông tin kết nối bí mật lên GitHub.



## Câu 5. Đóng gói Backend bằng Docker

### Docker Image

- Image: `hoainam213/235991-tranhoainam-backend:1.0`
- Docker Hub: https://hub.docker.com/r/hoainam213/235991-tranhoainam-backend

### Yêu cầu

- Đã cài đặt Docker Desktop.
- Có file `backend/.env` chứa các biến môi trường cần thiết để kết nối MongoDB Atlas.

### Build image từ mã nguồn

Chạy tại thư mục gốc dự án:

```bash
docker build -t hoainam213/235991-tranhoainam-backend:1.0 ./backend
```

### Chạy Backend bằng Docker

```bash
docker run -d \
  --name food-backend \
  -p 5000:5000 \
  --env-file backend/.env \
  hoainam213/235991-tranhoainam-backend:1.0
```

### Kiểm tra hoạt động

```bash
docker ps
docker logs food-backend
```

- Health check: http://localhost:5000/health
- Danh sách món ăn: http://localhost:5000/api/foods

### Dừng và xóa container

```bash
docker stop food-backend
docker rm food-backend
```

### Lưu ý bảo mật

File `.env` chứa thông tin cấu hình riêng tư, không được đưa vào Docker image hoặc commit lên GitHub.
