
# Sử dụng phiên bản Node.js LTS gọn nhẹ
FROM node:22-alpine

# Thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file khai báo thư viện trước
COPY package*.json ./

# Cài đặt các thư viện cần thiết
RUN npm ci --omit=dev

# Sao chép mã nguồn Backend
COPY server.js ./

# Backend sử dụng cổng 5000
EXPOSE 5000

# Khởi động ứng dụng
CMD ["node", "server.js"]
