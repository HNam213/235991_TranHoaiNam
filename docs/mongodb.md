# MongoDB Atlas

## Database
- Cluster: mern-demo
- Database: 235991_TranHoaiNam
- Collection: foods

## Food document schema
- foodId: String - mã món ăn
- name: String - tên món ăn
- category: String - loại món ăn
- cuisine: String - ẩm thực hoặc vùng miền
- ingredients: Array of String - danh sách nguyên liệu
- price: Number - giá bán
- quantity: Number - số lượng hiện có
- description: String - mô tả món ăn
- imageUrl: String - đường dẫn hình ảnh

## Sample data
Collection foods contains at least 3 sample documents:
- FOOD001: Phở bò
- FOOD002: Cơm tấm sườn
- FOOD003: Sushi cá hồi

## Security
Database credentials and MongoDB connection strings must be stored in environment variables. Do not commit the .env file to GitHub.
