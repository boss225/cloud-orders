"use client";

import React, { useState } from "react";
import { useOrder } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { Dish } from "@/types";
import { formatCurrency, formatDateVN } from "@/lib/utils";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  ShieldCheck,
  Lock,
  Save,
  X,
  Search,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export default function MenuManagementPage() {
  const {
    dishes,
    dailySheet,
    selectedDate,
    addOrUpdateDish,
    deleteDish,
    toggleDishInDailyMenu,
    setDailyMenuColumns,
  } = useOrder();
  const { isAdmin, isLoggedIn, openLoginModal } = useAuth();

  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [price, setPrice] = useState<number>(20000);
  const [description, setDescription] = useState("");

  const activeDishIds = dailySheet?.dishIds || [];

  // Filter dishes by search term (name & shortName, accent-insensitive)
  const filteredDishes = dishes.filter((dish) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.trim().toLowerCase();
    const normalizedTerm = removeVietnameseTones(term);

    const dishName = dish.name.toLowerCase();
    const dishShort = dish.shortName.toLowerCase();
    const normalizedName = removeVietnameseTones(dishName);
    const normalizedShort = removeVietnameseTones(dishShort);

    return (
      dishName.includes(term) ||
      dishShort.includes(term) ||
      normalizedName.includes(normalizedTerm) ||
      normalizedShort.includes(normalizedTerm)
    );
  });

  const handleOpenAdd = () => {
    setEditingDish(null);
    setName("");
    setShortName("");
    setPrice(20000);
    setDescription("");
    setIsDishModalOpen(true);
  };

  const handleOpenEdit = (dish: Dish) => {
    setEditingDish(dish);
    setName(dish.name);
    setShortName(dish.shortName);
    setPrice(dish.price || 0);
    setDescription(dish.description || "");
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) return;

    const dishData: Dish = {
      id: editingDish ? editingDish.id : `dish-${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim(),
      price: Number(price) || 0,
      description: description.trim(),
      isAvailable: true,
      orderIndex: editingDish?.orderIndex || dishes.length + 1,
    };

    await addOrUpdateDish(dishData);
    setIsDishModalOpen(false);
  };

  const handleSelectAllToday = () => {
    if (searchQuery.trim()) {
      const filteredIds = filteredDishes.map((d) => d.id);
      const combined = Array.from(new Set([...activeDishIds, ...filteredIds]));
      setDailyMenuColumns(combined);
    } else {
      const allIds = dishes.map((d) => d.id);
      setDailyMenuColumns(allIds);
    }
  };

  const handleDeselectAllToday = () => {
    if (searchQuery.trim()) {
      const filteredIdSet = new Set(filteredDishes.map((d) => d.id));
      setDailyMenuColumns(activeDishIds.filter((id) => !filteredIdSet.has(id)));
    } else {
      setDailyMenuColumns([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Quản Lý Menu & Món Trong Ngày
            </h1>
            <p className="text-xs text-slate-500">
              Chọn các món xuất hiện làm cột trên Sheet Order ngày{" "}
              <span className="font-semibold text-orange-600">
                {formatDateVN(selectedDate)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Quay lại Order</span>
          </Link>

          {isAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm món mới</span>
            </button>
          ) : null}
        </div>
      </div>
      {/* Daily Selection Control Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Món phục vụ ngày: {formatDateVN(selectedDate)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
                {activeDishIds.length} món được chọn
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Bấm vào từng món để Bật / Tắt hiển thị cột trên Sheet Order của
              ngày hôm nay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món theo tên..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 rounded-xl outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={isAdmin ? handleSelectAllToday : openLoginModal}
              disabled={!isAdmin}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                !isAdmin
                  ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                  : "text-slate-700 bg-slate-100 hover:bg-slate-200"
              }`}
              title={
                !isAdmin
                  ? "Cần đăng nhập Admin để chọn tất cả"
                  : searchQuery.trim()
                  ? "Chọn tất cả món đang tìm kiếm"
                  : "Chọn tất cả món cho ngày này"
              }
            >
              Chọn tất cả món
            </button>
            <button
              onClick={isAdmin ? handleDeselectAllToday : openLoginModal}
              disabled={!isAdmin}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                !isAdmin
                  ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                  : "text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-600"
              }`}
              title={
                !isAdmin
                  ? "Cần đăng nhập Admin để bỏ chọn"
                  : searchQuery.trim()
                  ? "Bỏ chọn tất cả món đang tìm kiếm"
                  : "Bỏ chọn tất cả món"
              }
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Dishes Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredDishes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p className="text-sm font-medium">
                Không tìm thấy món nào phù hợp với &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs font-semibold text-orange-600 hover:underline"
              >
                Xóa tìm kiếm
              </button>
            </div>
          ) : (
            filteredDishes.map((dish) => {
              const isSelectedForToday = activeDishIds.includes(dish.id);

            return (
              <div
                key={dish.id}
                onClick={() => {
                  if (!isAdmin) {
                    openLoginModal();
                    return;
                  }
                  toggleDishInDailyMenu(dish.id);
                }}
                className={`relative p-4 rounded-2xl border transition-all ${
                  !isAdmin ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  isSelectedForToday
                    ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/30 shadow-xs"
                    : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                }`}
                title={
                  !isAdmin
                    ? "Vui lòng đăng nhập Admin để bật/tắt món"
                    : undefined
                }
              >
                {/* Header with Short Name pill */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {dish.shortName}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {dish.name}
                      </h3>
                      <span className="text-xs font-semibold text-orange-600">
                        {formatCurrency(dish.price || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSelectedForToday ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {dish.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                    {dish.description}
                  </p>
                )}

                {/* Status bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${isSelectedForToday ? "text-amber-700" : "text-slate-400"}`}
                  >
                    {isSelectedForToday
                      ? "✓ Đang mở bán hôm nay"
                      : "✕ Tạm ẩn ngày này"}
                  </span>

                  {isAdmin ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEdit(dish)}
                        className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                        title="Sửa thông tin món"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Bạn có chắc muốn xóa món "${dish.name}" khỏi hệ thống?`,
                            )
                          ) {
                            deleteDish(dish.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Xóa món"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 opacity-25 cursor-not-allowed"
                      title="Cần đăng nhập Admin để sửa/xóa"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Dish Add/Edit Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDish ? "Sửa Món Ăn" : "Thêm Món Ăn Mới"}
              </h3>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDish} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đầy đủ của món <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Bánh Mì Bò, Bánh Hoa Cúc..."
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên viết tắt (Cột sổ){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="Ví dụ: Bò, Quế, Cúc..."
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none text-sm font-black text-red-700"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Hiện trên đầu cột bảng
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn giá (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="25000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Lưu ý món (Không bắt buộc)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Bánh ngọt nhân phô mai hoặc sốt bơ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDish ? "Cập nhật món" : "Thêm vào Menu"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
