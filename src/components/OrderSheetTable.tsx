'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { Dish, OrderRow } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Check, 
  Trash2, 
  Edit, 
  Search, 
  Plus, 
  Minus,
  X,
  Lock,
  Sun,
  Moon,
  UtensilsCrossed
} from 'lucide-react';

interface Props {
  onEditRow: (row: OrderRow) => void;
  onAddNew: () => void;
}

export default function OrderSheetTable({ onEditRow }: Props) {
  const { 
    dailySheet, 
    activeDishes, 
    sessionOrders,
    morningOrders,
    afternoonOrders,
    selectedSession,
    setSelectedSession,
    quickChangeCell, 
    toggleRowDelivered,
    deleteOrderRow 
  } = useOrder();

  const { isLoggedIn, isAdmin, openLoginModal } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (!dailySheet) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs font-bold text-slate-600">Đang tải dữ liệu Sheet Order...</p>
      </div>
    );
  }

  // Lọc danh sách đơn thuộc ca hiện tại
  const filteredOrders = sessionOrders.filter(order => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (order.roomOrAddress || '').toLowerCase().includes(term) ||
      (order.customerName || '').toLowerCase().includes(term) ||
      (order.extraNote || '').toLowerCase().includes(term) ||
      String(order.stt).includes(term)
    );
  });

  // Tính tổng số lượng từng cột cho ca hiện tại
  const columnTotals: Record<string, number> = {};
  activeDishes.forEach(d => {
    columnTotals[d.id] = 0;
  });

  sessionOrders.forEach(order => {
    Object.entries(order.items).forEach(([dishId, qty]) => {
      if (qty > 0 && columnTotals[dishId] !== undefined) {
        columnTotals[dishId] += qty;
      }
    });
  });

  const isMorning = selectedSession === 'morning';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
      {/* Top Bar: Session Switcher (Ca Sáng / Ca Chiều) & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        {/* Session Switcher Tabs (Ca Sáng / Ca Chiều) */}
        <div className="flex items-center bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-xs">
          <button
            type="button"
            onClick={() => setSelectedSession('morning')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 p-1 rounded-xl text-xs sm:text-sm font-black transition-all ${
              isMorning
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sun className={`w-4 h-4 ${isMorning ? 'text-amber-100 animate-spin-slow' : 'text-amber-500'}`} />
            <span>Sáng</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              isMorning 
                ? 'bg-white/25 text-white' 
                : 'bg-slate-300 text-slate-700'
            }`}>
              {morningOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSession('afternoon')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 p-1 rounded-xl text-xs sm:text-sm font-black transition-all ${
              !isMorning
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Moon className={`w-4 h-4 ${!isMorning ? 'text-indigo-200' : 'text-indigo-500'}`} />
            <span>Chiều</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              !isMorning 
                ? 'bg-white/25 text-white' 
                : 'bg-slate-300 text-slate-700'
            }`}>
              {afternoonOrders.length}
            </span>
          </button>
        </div>

        {/* Search Bar & Quick Menu Config Link */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm trong ${isMorning ? 'Ca Sáng' : 'Ca Chiều'} (địa chỉ, tên)...`}
              className="w-full text-xs sm:text-sm font-medium bg-transparent outline-none placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link
            href="/menu"
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
            title={`Cài đặt món xuất hiện trong Menu ${isMorning ? 'Sáng' : 'Chiều'}`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">Món {isMorning ? 'Sáng' : 'Chiều'}</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 font-black px-1.5 py-0.5 rounded-full">
              {activeDishes.length}
            </span>
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div 
        className="relative flex-1 min-h-0 overflow-auto rounded-2xl border border-slate-300 bg-white shadow-sm"
        style={{
          height: 'calc(100dvh - 54px - 50px - 40px)',
          maxHeight: 'calc(100dvh - 54px - 50px - 40px)'
        }}
      >
        <table className="w-full text-left border-collapse select-none text-xs">
          {/* Sticky Header: Cố định head khi cuộn */}
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 shadow-xs">
              <th className="py-2.5 px-2 text-center w-10 border-r border-slate-300 font-black text-xs bg-slate-100">
                STT
              </th>

              {/* Address First, Customer Name Below */}
              <th className="py-2.5 px-2.5 min-w-[140px] sm:min-w-[160px] border-r border-slate-300 bg-slate-100">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-800 leading-tight">
                  ĐỊA CHỈ
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Tên khách hàng</span>
              </th>

              {/* Dynamic Food Columns matching current session menu */}
              {activeDishes.map((dish) => (
                <th 
                  key={dish.id} 
                  className="py-2 px-1 text-center min-w-[56px] sm:min-w-[62px] border-r border-slate-300 bg-slate-100"
                  title={`${dish.name} - ${formatCurrency(dish.price || 0)}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base sm:text-lg font-black text-red-700 leading-none">
                      {dish.shortName}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap mt-0.5">
                      {formatCurrency(dish.price || 0)}
                    </span>
                  </div>
                </th>
              ))}

              {/* NOTE column header */}
              <th className="py-2.5 px-2.5 min-w-[120px] border-r border-slate-300 text-xs font-black uppercase text-slate-800 bg-slate-100">
                NOTE
              </th>

              <th className="py-2.5 px-1 text-center w-14 border-r border-slate-300 text-xs font-black uppercase text-slate-800 bg-slate-100">
                Giao
              </th>

              <th className="py-2.5 px-1 text-center w-18 text-xs font-black uppercase text-slate-800 bg-slate-100">
                Sửa/Xóa
              </th>
            </tr>
          </thead>

          {/* Table Body - Row Odd Xám Nhạt (Zebra striping) */}
          <tbody className="divide-y divide-slate-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={activeDishes.length + 4} style={{height: 'calc(100dvh - 240px)'}} className="py-12 text-center text-slate-400 font-medium text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">{isMorning ? '☀️' : '🌙'}</span>
                    <p className="font-semibold text-slate-600">
                      Chưa có đơn hàng nào trong {isMorning ? 'Ca Sáng' : 'Ca Chiều'} ngày này.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Bấm nút (+) ở góc dưới bên phải để tạo đơn cho {isMorning ? 'Ca Sáng' : 'Ca Chiều'}!
                    </p>
                    {activeDishes.length === 0 && (
                      <Link
                        href="/menu"
                        className="mt-2 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-800 font-bold text-xs hover:bg-orange-200 transition"
                      >
                        Chọn món cho Menu {isMorning ? 'Sáng' : 'Chiều'} ngay &rarr;
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => {
                const isDelivered = !!order.isDelivered;
                const primaryAddress = order.roomOrAddress || order.customerName || '—';
                const secondaryCustomer = order.roomOrAddress ? order.customerName : '';
                const isOddRow = idx % 2 === 1;

                return (
                  <tr 
                    key={order.id} 
                    className={`transition-colors ${
                      isDelivered 
                        ? 'bg-emerald-50/60' 
                        : isOddRow 
                          ? 'bg-slate-50/90 hover:bg-amber-50/40' 
                          : 'bg-white hover:bg-amber-50/40'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-1.5 px-1.5 text-center font-bold text-slate-600 border-r border-slate-200 text-xs">
                      {order.stt || idx + 1}
                    </td>

                    {/* Address First, Customer Name Below */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200">
                      <div className="flex flex-col justify-center">
                        <span className="font-black text-sm text-slate-900 leading-tight">
                          {primaryAddress}
                        </span>
                        {secondaryCustomer && (
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {secondaryCustomer}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Food Quantity Cells: Hover hiển thị con số nhỏ ở trên + hai nút - và + */}
                    {activeDishes.map((dish) => {
                      const qty = order.items[dish.id] || 0;

                      return (
                        <td 
                          key={dish.id} 
                          className="py-1 px-0.5 text-center border-r border-slate-200 relative group/cell select-none"
                        >
                          {/* Trạng thái bình thường: hiển thị số to hoặc dấu chấm (ẨN ĐI KHI HOVER) */}
                          <div className="relative py-1 flex items-center justify-center min-h-[34px] group-hover/cell:hidden">
                            {qty > 0 ? (
                              <span className="text-base sm:text-lg font-black text-red-700">
                                {qty}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">•</span>
                            )}
                          </div>

                          {/* Trạng thái khi Rê chuột / Hover: CHỈ KÍCH HOẠT KHI LÀ ADMIN */}
                          {isAdmin ? (
                            <div className="absolute inset-0 bg-white rounded hidden group-hover/cell:flex flex-col items-center justify-center p-0.5 shadow-xs border border-orange-200 z-10 animate-fadeIn">
                              {/* Con số nhỏ ở trên để người dùng dễ dàng nhìn thấy thay đổi */}
                              <span className="text-[12px] font-black text-red-700 leading-tight">
                                {qty}
                              </span>

                              {/* Hai nút trừ và cộng */}
                              <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => quickChangeCell(order.id, dish.id, Math.max(0, qty - 1))}
                                  disabled={qty === 0}
                                  className={`w-5 h-5 rounded flex items-center justify-center font-black text-xs transition active:scale-90 ${
                                    qty > 0 
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' 
                                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                  }`}
                                  title="Giảm 1"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => quickChangeCell(order.id, dish.id, qty + 1)}
                                  className="w-5 h-5 rounded bg-orange-500 hover:bg-orange-600 active:scale-90 text-white font-black text-xs flex items-center justify-center transition shadow-xs"
                                  title="Tăng 1"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={openLoginModal}
                              className="absolute inset-0 bg-slate-50/95 rounded hidden group-hover/cell:flex items-center justify-center p-0.5 shadow-xs border border-slate-200 z-10 cursor-pointer"
                              title={!isLoggedIn ? 'Bấm để đăng nhập Admin' : 'Chỉ tài khoản Admin mới có quyền cộng/trừ món'}
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* NOTE Column */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200">
                      {order.extraNote ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                          {order.extraNote}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Delivered Checkmark (Chỉ Admin mới có quyền tích) */}
                    <td className="py-1.5 px-1 text-center border-r border-slate-200">
                      <button
                        onClick={isAdmin ? () => toggleRowDelivered(order.id) : openLoginModal}
                        disabled={!isAdmin}
                        className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition ${
                          !isAdmin
                            ? 'opacity-30 cursor-not-allowed bg-slate-100 border border-slate-200 text-slate-300'
                            : isDelivered 
                              ? 'bg-emerald-500 text-white shadow-xs active:scale-90' 
                              : 'border-2 border-slate-300 hover:border-emerald-500 text-slate-300 hover:text-emerald-500 bg-white active:scale-90'
                        }`}
                        title={!isAdmin ? 'Chỉ tài khoản Admin mới có quyền đánh dấu đã giao' : isDelivered ? 'Đã giao' : 'Chưa giao (bấm để tích)'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Actions (Edit / Delete) - Chỉ Admin mới có quyền */}
                    <td className="py-1.5 px-1 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={isAdmin ? () => onEditRow(order) : openLoginModal}
                          disabled={!isAdmin}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                            !isAdmin
                              ? 'opacity-25 cursor-not-allowed text-slate-300'
                              : 'text-slate-500 hover:text-orange-600 hover:bg-orange-100/70 active:scale-90'
                          }`}
                          title={!isAdmin ? 'Chỉ tài khoản Admin mới có quyền sửa đơn' : 'Sửa đơn'}
                        >
                          <Edit className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          onClick={isAdmin ? () => {
                            if (confirm(`Xóa đơn "${primaryAddress}"?`)) {
                              deleteOrderRow(order.id);
                            }
                          } : openLoginModal}
                          disabled={!isAdmin}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                            !isAdmin
                              ? 'opacity-25 cursor-not-allowed text-slate-300'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-90'
                          }`}
                          title={!isAdmin ? 'Chỉ tài khoản Admin mới có quyền xóa đơn' : 'Xóa đơn'}
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Bottom: Cố định Footer Tổng Bếp Làm khi cuộn */}
          <tbody className="sticky bottom-0 z-20">
            <tr className="border-t-2 border-slate-300 bg-slate-100 text-slate-900 shadow-xs">
              <td colSpan={2} className="py-2.5 px-2.5 font-black text-xs uppercase tracking-wider border-r border-slate-300 bg-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {isMorning ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>Tổng:</span>
                  </span>
                  <span className={`text-xs font-black ${isMorning ? 'text-orange-700' : 'text-indigo-700'}`}>
                    {sessionOrders.length} đơn
                  </span>
                </div>
              </td>

              {/* Column Totals for each dish */}
              {activeDishes.map((dish) => {
                const total = columnTotals[dish.id] || 0;
                return (
                  <td 
                    key={dish.id} 
                    className="py-2.5 px-0.5 text-center border-r border-slate-300 bg-slate-100"
                  >
                    <span className={`inline-block px-1.5 py-0.5 rounded-md text-sm font-black ${
                      total > 0 
                        ? (isMorning ? 'bg-orange-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs')
                        : 'text-slate-400'
                    }`}>
                      {total}
                    </span>
                  </td>
                );
              })}

              <td colSpan={3} className="py-2.5 px-2 text-right bg-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold">
                  {isMorning ? '☀️ Ca Sáng' : '🌙 Ca Chiều'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
