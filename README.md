# Quản Lý Bán Hàng - Backend

Dự án Node.js backend cho hệ thống quản lý bán hàng, sử dụng Express và MongoDB.

## 🛠️ Thư viện sử dụng

### Dependencies

| Thư viện          | Phiên bản | Mô tả ngắn                                                             |
| ----------------- | --------- | ---------------------------------------------------------------------- |
| **express**       | ^5.1.0    | Framework web cho Node.js, xử lý routing, middleware, và server logic. |
| **mongoose**      | ^8.14.2   | ODM cho MongoDB, giúp quản lý schema và truy vấn dữ liệu dễ dàng hơn.  |
| **dotenv**        | ^16.5.0   | Quản lý biến môi trường từ file `.env`.                                |
| **bcryptjs**      | ^3.0.2    | Mã hóa mật khẩu người dùng bằng thuật toán bcrypt.                     |
| **jsonwebtoken**  | ^9.0.2    | Tạo và xác thực JWT (JSON Web Token) cho cơ chế xác thực.              |
| **cookie-parser** | ^1.4.7    | Đọc và phân tích cookies từ request.                                   |
| **cors**          | ^2.8.5    | Cho phép chia sẻ tài nguyên giữa các nguồn khác nhau (Cross-Origin).   |
| **nodemailer**    | ^7.0.3    | Gửi email từ Node.js (ví dụ: xác thực, khôi phục mật khẩu).            |
| **ioredis**       | ^5.6.1    | Tương tác với Redis với tính năng mạnh mẽ hơn `redis` thông thường.    |
| **redis**         | ^5.0.1    | Giao tiếp với Redis để lưu cache, session,...                          |
| **ms**            | ^2.1.3    | Chuyển đổi thời gian dễ dàng (ví dụ: '2 days' thành milliseconds).     |
| **crypto**        | ^1.0.1    | Mã hóa và tạo hash, thường dùng cho bảo mật.                           |

#### Kiểm tra dữ liệu lưu trong redis

```bash
docker exec -it <tên container> redis-cli  (bỏ <>)
keys *
```

### DevDependencies

| Thư viện    | Phiên bản | Mô tả ngắn                                                       |
| ----------- | --------- | ---------------------------------------------------------------- |
| **nodemon** | ^3.1.10   | Tự động restart server khi có thay đổi file trong quá trình dev. |

## 🚀 Cách chạy dự án

```bash
npm install
npm start
```
