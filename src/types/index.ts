export type UserRole = 'admin' | 'user';
export type MenuSession = 'morning' | 'afternoon';

export interface UserProfile {
  phone: string;
  role: UserRole;
  name?: string;
  loginAt: string;
}

export interface Dish {
  id: string;
  name: string;             // Tên đầy đủ (ví dụ: Bánh Mì Bò, Bánh Hoa Cúc, Bánh Tart Trứng)
  shortName: string;        // Tên viết tắt hiển thị trên cột (ví dụ: Bò, Quế, Cúc, Dẻo, Pate, Tart, Sò, C5, Bắp)
  price: number;            // Đơn giá VND
  description?: string;
  category?: string;
  isAvailable?: boolean;    // Có đang kinh doanh
  orderIndex?: number;      // Thứ tự sắp xếp cột
}

export interface OrderRow {
  id: string;
  stt: number;
  session?: MenuSession;    // 'morning' (ca sáng) hoặc 'afternoon' (ca chiều), mặc định 'morning'
  customerName: string;     // Tên khách hàng (ví dụ: Oanh, Hoài An, Hương Ly, Nga, Cô Nhân...)
  roomOrAddress: string;    // Phòng / Tầng / Địa chỉ (ví dụ: 9.10.15, 1.19.2, lla 8, CTQ, 12.5...)
  phone?: string;
  items: Record<string, number>; // dishId -> số lượng
  cellNotes?: Record<string, string>; // Ghi chú riêng từng ô
  cellHighlights?: Record<string, boolean>; // Đánh dấu bút dạ cam (như hình gốc)
  cellChecked?: Record<string, boolean>; // Dấu tích v (như hình gốc)
  extraNote?: string;       // Ghi chú ngoài lề (ví dụ: + Pizza, 6 cái dẻo...)
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
  isPaid?: boolean;
  isDelivered?: boolean;
  hasCheckmark?: boolean;
  totalPrice?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DailySheet {
  date: string;             // YYYY-MM-DD
  dishIds: string[];        // Danh sách ID món chung / fallback
  morningDishIds?: string[];   // Danh sách ID món cho Ca Sáng
  afternoonDishIds?: string[]; // Danh sách ID món cho Ca Chiều
  orders: OrderRow[];
  notes?: string;
  updatedAt: string;
}
