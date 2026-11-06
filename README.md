# Cloud Order - Daily Food Order Sheet (Mô phỏng Sổ Tay Ô Ly)

Hệ thống ghi nhận và quản lý đơn đặt món ăn hàng ngày được thiết kế chuyên biệt dựa trên mẫu sổ tay thực tế, tích hợp Next.js, Tailwind CSS và Firebase Firestore.

## 🌟 Tính Năng Nổi Bật

1. **Giao diện Sheet Order mô phỏng Sổ tay ô ly:**
   - Hàng ngang: Tên khách / Phòng / Địa chỉ (ví dụ: *Oanh, 9.10.15, Gò Luôn 1.19.2, C Vĩ Pan 12.5, Hạ Thuỷ, Cô Nhân...*).
   - Cột dọc: Tên viết tắt các món trong ngày (*Bò, Quế, Cúc, Dẻo, Pate, Tart, Sò, C5, Bắp...*).
   - Rê chuột / Bấm trực tiếp vào ô để sửa nhanh số lượng (+/-).
   - **Tô màu dạ quang cam (🖍️)** và **Đánh dấu tích v đỏ (✓)** y như trong hình ảnh sổ tay thật.
   - Hàng tổng cộng tự động đếm tổng số phần cho từng món để bộ phận bếp tiện chế biến.
   - Hỗ trợ đổi chế độ xem linh hoạt giữa **Sổ Ô Ly** (Notebook Grid) và **Hiện Đại** (Modern SaaS).

2. **Trang Quản lý Menu (`/menu`):**
   - Chọn các món phục vụ trong ngày đó để bật/tắt cột trên Sheet Order.
   - Thêm món mới vào danh mục với Đơn giá và Tên viết tắt.
   - Chỉnh sửa hoặc xoá món ăn.

3. **Modal Đăng nhập & Phân quyền theo Số điện thoại:**
   - Chỉ hiển thị 1 ô nhập **Số điện thoại**.
   - Với các số điện thoại thông thường: Đăng nhập ngay với vai trò Khách hàng / Nhân viên ghi đơn (không cần mật khẩu).
   - Với **2 số đặc biệt**: `0344846865` và `0916320245` -> Hệ thống tự động kích hoạt ô nhập **Mật khẩu Quản trị viên** (Admin) để cấp quyền quản lý menu và cấu hình.
   - *Mật khẩu admin mặc định:* `admin` (hoặc `admin123`).

4. **Đồng bộ Firebase Firestore:**
   - Hỗ trợ kết nối trực tiếp với Firebase Firestore để lưu trữ đơn và menu theo thời gian thực (Realtime).
   - Đi kèm chế độ Offline/Local Resilient: Nếu chưa cấu hình Firebase, ứng dụng vẫn hoạt động 100% mượt mà trên trình duyệt.
   - Có modal cấu hình Firebase trực quan ngay trên giao diện để dán cấu hình từ Firebase Console.

5. **Tổng hợp Bếp & Gửi Zalo:**
   - Nút **Tổng Hợp Bếp** tính toán số lượng từng món, tạm tính doanh thu, tổng hợp ghi chú thêm (+ Pizza, 6 cái dẻo...).
   - Sao chép 1 chạm định dạng chuẩn để gửi qua Zalo / SMS cho bếp.

## 🚀 Hướng Dẫn Chạy Ứng Dụng

```bash
# 1. Cài đặt thư viện (nếu cần)
npm install

# 2. Khởi chạy môi trường phát triển (Dev)
npm run dev

# 3. Mở trình duyệt tại:
http://localhost:3000
```
