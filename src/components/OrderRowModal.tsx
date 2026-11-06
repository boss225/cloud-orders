"use client";

import React, { useState, useEffect } from "react";
import { useOrder } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { Dish, OrderRow, MenuSession } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  Plus,
  Minus,
  Save,
  User,
  MapPin,
  StickyNote,
  Building2,
  Sun,
  Moon,
} from "lucide-react";
import ApartmentPickerModal from "./ApartmentPickerModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingRow?: OrderRow | null;
}

export default function OrderRowModal({ isOpen, onClose, editingRow }: Props) {
  const {
    dailySheet,
    dishes,
    activeDishes,
    selectedSession,
    addOrderRow,
    updateOrderRow,
  } = useOrder();
  const { isAdmin } = useAuth();

  const [session, setSession] = useState<MenuSession>(
    editingRow?.session || selectedSession,
  );
  const [roomOrAddress, setRoomOrAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [items, setItems] = useState<Record<string, number>>({});
  const [isDelivered, setIsDelivered] = useState(false);
  const [isApartmentPickerOpen, setIsApartmentPickerOpen] = useState(false);

  useEffect(() => {
    if (editingRow) {
      setSession(editingRow.session || "morning");
      setRoomOrAddress(editingRow.roomOrAddress || "");
      setCustomerName(editingRow.customerName || "");
      setExtraNote(editingRow.extraNote || "");
      setItems(editingRow.items || {});
      setIsDelivered(!!editingRow.isDelivered);
    } else {
      setSession(selectedSession);
      setRoomOrAddress("");
      setCustomerName("");
      setExtraNote("");
      setItems({});
      setIsDelivered(false);
    }
  }, [editingRow, isOpen, selectedSession]);

  // Danh sách món ăn tương ứng với ca được chọn trong modal
  const modalDishes = React.useMemo(() => {
    if (!dailySheet || !dishes || dishes.length === 0) return activeDishes;
    const dishMap = new Map(dishes.map((d) => [d.id, d]));
    const ids =
      session === "afternoon"
        ? (dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [])
        : (dailySheet.morningDishIds ?? dailySheet.dishIds ?? []);
    return ids
      .map((id) => dishMap.get(id))
      .filter((d): d is Dish => Boolean(d));
  }, [dailySheet, dishes, session, activeDishes]);

  if (!isOpen) return null;

  const handleQtyChange = (dishId: string, delta: number) => {
    const current = items[dishId] || 0;
    const next = Math.max(0, current + delta);
    setItems((prev) => {
      const copy = { ...prev };
      if (next === 0) {
        delete copy[dishId];
      } else {
        copy[dishId] = next;
      }
      return copy;
    });
  };

  const handleQuickAdd = (dishId: string) => {
    handleQtyChange(dishId, 1);
  };

  const totalItemsSelected = Object.values(items).reduce(
    (sum, val) => sum + (val || 0),
    0,
  );
  const dishPriceMap = new Map((dishes || []).map((d) => [d.id, d.price || 0]));
  const totalPriceSelected = Object.entries(items).reduce(
    (sum, [dishId, qty]) => {
      const p = dishPriceMap.get(dishId) || 0;
      return sum + p * (qty || 0);
    },
    0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Chỉ tài khoản Admin mới có quyền tạo hoặc chỉnh sửa đơn hàng!");
      return;
    }

    if (!roomOrAddress.trim()) {
      alert("Vui lòng nhập số phòng / địa chỉ giao hàng!");
      return;
    }

    const payload: Partial<OrderRow> = {
      session,
      roomOrAddress: roomOrAddress.trim(),
      customerName: customerName.trim(),
      extraNote: extraNote.trim(),
      items,
      status: isDelivered ? "delivered" : "pending",
      isDelivered,
    };

    if (editingRow) {
      updateOrderRow(editingRow.id, payload);
    } else {
      addOrderRow(payload);
    }

    onClose();
  };

  const isMorning = session === "morning";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
        <div
          className="relative w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Cố Định */}
          <div
            className={`px-5 py-4 text-white flex items-center justify-between shadow-sm shrink-0 transition-colors ${
              isMorning
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-gradient-to-r from-indigo-600 to-violet-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
                {isMorning ? "☀️" : "🌙"}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingRow
                    ? `Sửa Đơn #${editingRow.stt} (${isMorning ? "Sáng" : "Chiều"})`
                    : `Tạo Đơn ${isMorning ? "Sáng" : "Chiều"}`}
                </h3>
                <p className="text-xs text-white/80 font-medium">
                  Menu {isMorning ? "Sáng" : "Chiều"} &bull; Đã chọn:{" "}
                  <span className="font-bold underline text-white">
                    {totalItemsSelected} phần
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Form bao bọc gồm: Phần thân cuộn + Nút Tạo Đơn cố định */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* Scrollable Body */}
            <div className="p-3 overflow-y-auto space-y-4 text-sm flex-1">
              {/* Shift Session Selector: Cho phép chọn đơn này thuộc Sáng hay Chiều */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSession("morning")}
                  className={`p-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                    isMorning
                      ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Sun
                    className={`w-4 h-4 ${isMorning ? "text-amber-100" : "text-amber-500"}`}
                  />
                  <span>Ca Sáng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSession("afternoon")}
                  className={`p-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                    !isMorning
                      ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Moon
                    className={`w-4 h-4 ${!isMorning ? "text-indigo-200" : "text-indigo-500"}`}
                  />
                  <span>Ca Chiều</span>
                </button>
              </div>

              {/* Address (REQUIRED) & Customer Name (OPTIONAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Address / Room Number (PRIORITIZED & REQUIRED) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>

                    {/* Button nhỏ chọn nhanh căn hộ */}
                    <button
                      type="button"
                      onClick={() => setIsApartmentPickerOpen(true)}
                      className="px-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 active:scale-95 text-orange-800 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      title="Mở bảng chọn nhanh 10 tòa, 22 tầng, 20 căn"
                    >
                      <span>Chọn căn</span>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={roomOrAddress}
                      onChange={(e) => setRoomOrAddress(e.target.value)}
                      placeholder="Ví dụ: 9.10.15, 1.19.2, CTQ..."
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-orange-400/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-base font-bold outline-none bg-orange-50/20"
                    />
                  </div>
                </div>

                {/* Customer Name (OPTIONAL) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tên khách hàng
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ví dụ: Oanh, Hoài An, Cô Nhân..."
                      className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-base font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dish Grid Selector (Only Plus & Minus, Tap to +1) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>
                      CHỌN MÓN ĂN {isMorning ? "CA SÁNG" : "CA CHIỀU"}:
                    </span>
                  </label>
                  <span className="text-[11px] text-orange-700 font-bold bg-orange-100/70 px-2.5 py-0.5 rounded-lg border border-orange-300">
                    Chạm thẻ để +1 phần
                  </span>
                </div>

                {modalDishes.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs">
                    Chưa có món nào được bật cho Menu{" "}
                    {isMorning ? "Sáng" : "Chiều"} ngày này. Bạn có thể vào
                    trang Menu để bật món.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {modalDishes.map((dish) => {
                      const qty = items[dish.id] || 0;
                      const isSelected = qty > 0;

                      return (
                        <div
                          key={dish.id}
                          onClick={() => handleQuickAdd(dish.id)}
                          className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
                            isSelected
                              ? isMorning
                                ? "bg-amber-50/90 border-orange-500 shadow-sm ring-1 ring-orange-400"
                                : "bg-indigo-50/90 border-indigo-500 shadow-sm ring-1 ring-indigo-400"
                              : "bg-white border-slate-200 hover:border-orange-300"
                          }`}
                        >
                          {/* Top: Short Name & Count Badge */}
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div>
                              <span
                                className={`text-xl font-black block tracking-tight ${
                                  isSelected
                                    ? isMorning
                                      ? "text-red-700"
                                      : "text-indigo-900"
                                    : "text-slate-800"
                                }`}
                              >
                                {dish.shortName}
                              </span>
                              <span className="text-xs text-slate-500 font-medium line-clamp-1">
                                {dish.name}
                              </span>
                            </div>

                            {/* Quantity Badge */}
                            {isSelected && (
                              <span
                                className={`w-8 h-8 rounded-xl text-white font-black text-base flex items-center justify-center shadow-md animate-scaleIn ${
                                  isMorning ? "bg-orange-600" : "bg-indigo-600"
                                }`}
                              >
                                {qty}
                              </span>
                            )}
                          </div>

                          {/* Bottom: Only +/- buttons */}
                          <div
                            className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-bold text-orange-700">
                              {formatCurrency(dish.price || 0)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(dish.id, -1)}
                                disabled={qty === 0}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition ${
                                  qty > 0
                                    ? "bg-slate-200 hover:bg-slate-300 text-slate-800 active:scale-95"
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                }`}
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQtyChange(dish.id, 1)}
                                className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-black shadow-xs transition active:scale-95 ${
                                  isMorning
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Note / Món thêm - Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-slate-500" />
                  <span>NOTE</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setExtraNote((prev) => {
                        const trimmed = prev.trim();
                        if (!trimmed) return val;
                        if (trimmed.endsWith(",") || trimmed.endsWith(";")) {
                          return `${trimmed} ${val}`;
                        }
                        return `${trimmed}, ${val}`;
                      });
                    }}
                    className="ml-5 px-2 py-0.5 bg-white rounded-2xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm font-medium outline-none cursor-pointer"
                  >
                    <option value="">--nhanh--</option>
                    <option value="ko chun">ko chun</option>
                    <option value="ko cà">ko cà</option>
                    <option value="ko rau">ko rau</option>
                    <option value="thêm trứng">thêm trứng</option>
                    <option value="bắp cay">bắp cay</option>
                    <option value="bắp mắm">bắp mắm</option>
                    <option value="giao 8h">giao 8h</option>
                    <option value="giao 10h">giao 10h</option>
                    <option value="giao 4h">giao 4h</option>
                    <option value="giao 5h">giao 5h</option>
                    <option value="giao 6h">giao 6h</option>
                  </select>
                </label>
                <textarea
                  rows={2}
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc món thêm (Ví dụ: + Pizza, 6 cái dẻo, mang lên phòng...)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm font-medium outline-none resize-none"
                />
              </div>

              {/* Delivered status toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDelivered}
                    onChange={(e) => setIsDelivered(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded-lg border-slate-300 focus:ring-orange-500"
                  />
                  <span className="text-sm font-bold text-slate-800">
                    Đánh dấu đã giao hàng ({isMorning ? "Ca Sáng" : "Ca Chiều"})
                  </span>
                </label>
              </div>
            </div>

            {/* BUTTON TẠO ĐƠN CỐ ĐỊNH Ở ĐÁY MODAL */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200/90 shrink-0 shadow-lg">
              <button
                type="submit"
                disabled={!isAdmin}
                className={`w-full py-4 px-6 rounded-2xl text-white font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !isAdmin
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60 shadow-none"
                    : isMorning
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 active:scale-[0.99] shadow-orange-500/30"
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] shadow-indigo-600/30"
                }`}
              >
                <Save className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {editingRow
                    ? `LƯU THAY ĐỔI (${isMorning ? "CA SÁNG" : "CA CHIỀU"})`
                    : `TẠO ĐƠN ${isMorning ? "CA SÁNG" : "CA CHIỀU"} NGAY`}
                  {totalItemsSelected > 0
                    ? ` (${totalItemsSelected} món • ${formatCurrency(totalPriceSelected)})`
                    : ""}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Popup chọn nhanh căn hộ */}
      <ApartmentPickerModal
        isOpen={isApartmentPickerOpen}
        onClose={() => setIsApartmentPickerOpen(false)}
        onSelect={(code) => setRoomOrAddress(code)}
        currentValue={roomOrAddress}
      />
    </>
  );
}
