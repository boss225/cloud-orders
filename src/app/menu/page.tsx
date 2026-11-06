"use client";

import React, { useState, useEffect } from "react";
import { useOrder } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { Dish, MenuSession } from "@/types";
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
  BookOpen,
  Sun,
  Moon,
  Copy,
} from "lucide-react";
import Link from "next/link";

function removeVietnameseTones(str?: string | null): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export default function MenuManagementPage() {
  const {
    dishes = [],
    dailySheet,
    selectedDate,
    selectedSession,
    setSelectedSession,
    addOrUpdateDish,
    deleteDish,
    toggleDishInDailyMenu,
    setDailyMenuColumns,
    copyMenuSession,
  } = useOrder();
  const { isAdmin, isLoggedIn, openLoginModal } = useAuth();

  const [activeMenuTab, setActiveMenuTab] = useState<MenuSession>(selectedSession || "morning");

  // Đồng bộ tab menu khi selectedSession từ context thay đổi (ví dụ: tự động sang ca chiều sau 13h)
  useEffect(() => {
    if (selectedSession) {
      setActiveMenuTab(selectedSession);
    }
  }, [selectedSession]);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Form states for Add / Edit dish
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [price, setPrice] = useState<number>(20000);
  const [description, setDescription] = useState("");

  const morningDishIds = dailySheet?.morningDishIds ?? dailySheet?.dishIds ?? [];
  const afternoonDishIds = dailySheet?.afternoonDishIds ?? dailySheet?.dishIds ?? [];
  const currentTabDishIds = activeMenuTab === "morning" ? morningDishIds : afternoonDishIds;

  // Filter dishes by search term (name & shortName, accent-insensitive)
  const filteredDishes = (dishes || []).filter((dish) => {
    if (!dish) return false;
    if (!searchQuery.trim()) return true;
    const term = searchQuery.trim().toLowerCase();
    const normalizedTerm = removeVietnameseTones(term);

    const dishName = (dish.name || "").toLowerCase();
    const dishShort = (dish.shortName || "").toLowerCase();
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

  const handleSelectAllInTab = () => {
    if (searchQuery.trim()) {
      const filteredIds = filteredDishes.map((d) => d.id);
      const combined = Array.from(new Set([...currentTabDishIds, ...filteredIds]));
      setDailyMenuColumns(combined, activeMenuTab);
    } else {
      const allIds = dishes.map((d) => d.id);
      setDailyMenuColumns(allIds, activeMenuTab);
    }
  };

  const handleDeselectAllInTab = () => {
    if (searchQuery.trim()) {
      const filteredIdSet = new Set(filteredDishes.map((d) => d.id));
      setDailyMenuColumns(currentTabDishIds.filter((id) => !filteredIdSet.has(id)), activeMenuTab);
    } else {
      setDailyMenuColumns([], activeMenuTab);
    }
  };

  const handleCopyMenu = () => {
    const fromTab = activeMenuTab === "morning" ? "afternoon" : "morning";
    const fromName = fromTab === "morning" ? "Sáng" : "Chiều";
    const toName = activeMenuTab === "morning" ? "Sáng" : "Chiều";
    if (
      confirm(
        `Bạn có muốn sao chép toàn bộ món từ ${fromName} sang ${toName} ngày ${formatDateVN(
          selectedDate
        )}?`
      )
    ) {
      copyMenuSession(fromTab, activeMenuTab);
    }
  };

  const handleSwitchTab = (tab: MenuSession) => {
    setActiveMenuTab(tab);
    setSelectedSession(tab);
  };

  const isMorningTab = activeMenuTab === "morning";

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
              Cài Đặt Menu Món Trong Ngày
            </h1>
            <p className="text-xs text-slate-500">
              Cấu hình 2 menu riêng biệt: <strong className="text-amber-600">Menu Sáng</strong> và{" "}
              <strong className="text-indigo-600">Menu Chiều</strong> ngày{" "}
              <span className="font-semibold text-slate-800">
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
        {/* BIG TABS: Switch between Menu Sáng & Menu Chiều */}
        <div className="p-1.5 bg-slate-100 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handleSwitchTab("morning")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 ${
              isMorningTab
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Sun className={`w-5 h-5 ${isMorningTab ? "text-amber-100 animate-spin-slow" : "text-amber-500"}`} />
            <span>☀️ Menu Sáng</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                isMorningTab ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {morningDishIds.length} món
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("afternoon")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 ${
              !isMorningTab
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Moon className={`w-5 h-5 ${!isMorningTab ? "text-indigo-200" : "text-indigo-500"}`} />
            <span>🌙 Menu Chiều</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                !isMorningTab ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {afternoonDishIds.length} món
            </span>
          </button>
        </div>

        {/* Toolbar of the active tab */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 pt-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                {isMorningTab ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <span>
                  {isMorningTab ? "Menu Sáng" : "Menu Chiều"} ({formatDateVN(selectedDate)})
                </span>
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                  isMorningTab
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                }`}
              >
                {currentTabDishIds.length} món mở bán
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chạm vào từng món để bật hoặc tắt món xuất hiện trên cột đơn {isMorningTab ? "Sáng" : "Chiều"}.
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

            {/* Quick Copy button between Sáng and Chiều */}
            <button
              onClick={isAdmin ? handleCopyMenu : openLoginModal}
              disabled={!isAdmin}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                !isAdmin
                  ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                  : isMorningTab
                    ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                    : "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
              }`}
              title={
                !isAdmin
                  ? "Cần đăng nhập Admin"
                  : isMorningTab
                    ? "Sao chép danh sách món từ Chiều sang Sáng"
                    : "Sao chép danh sách món từ Sáng sang Chiều"
              }
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isMorningTab ? "Lấy từ Chiều" : "Lấy từ Sáng"}</span>
            </button>

            <button
              onClick={isAdmin ? handleSelectAllInTab : openLoginModal}
              disabled={!isAdmin}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                !isAdmin
                  ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                  : "text-slate-700 bg-slate-100 hover:bg-slate-200"
              }`}
              title="Chọn tất cả món cho ngày này"
            >
              Chọn tất cả
            </button>

            <button
              onClick={isAdmin ? handleDeselectAllInTab : openLoginModal}
              disabled={!isAdmin}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                !isAdmin
                  ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                  : "text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-600"
              }`}
              title="Bỏ chọn tất cả món cho ngày này"
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
              const isSelectedInActiveTab = currentTabDishIds.includes(dish.id);
              const isInMorning = morningDishIds.includes(dish.id);
              const isInAfternoon = afternoonDishIds.includes(dish.id);

              return (
                <div
                  key={dish.id}
                  onClick={() => {
                    if (!isAdmin) {
                      openLoginModal();
                      return;
                    }
                    toggleDishInDailyMenu(dish.id, activeMenuTab);
                  }}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    !isAdmin ? "cursor-not-allowed" : "cursor-pointer"
                  } ${
                    isSelectedInActiveTab
                      ? isMorningTab
                        ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs"
                        : "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40 shadow-xs"
                      : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                  title={
                    !isAdmin
                      ? "Vui lòng đăng nhập Admin để bật/tắt món"
                      : `Bấm để ${isSelectedInActiveTab ? "tắt" : "bật"} món "${dish.name}" trong ${isMorningTab ? "Sáng" : "Chiều"}`
                  }
                >
                  {/* Header with Short Name pill */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs ${
                        isMorningTab ? 'bg-orange-500' : 'bg-indigo-600'
                      }`}>
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
                      {isSelectedInActiveTab ? (
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                          isMorningTab ? 'text-amber-600' : 'text-indigo-600'
                        }`} />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Multi-Shift Indicator Badges: Hiển thị món này đang bán ca nào */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        isInMorning
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-400 opacity-50"
                      }`}
                    >
                      <span>☀️ Sáng</span>
                      {isInMorning && <span>✓</span>}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                        isInAfternoon
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                          : "bg-slate-100 text-slate-400 opacity-50"
                      }`}
                    >
                      <span>🌙 Chiều</span>
                      {isInAfternoon && <span>✓</span>}
                    </span>
                  </div>

                  {dish.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                      {dish.description}
                    </p>
                  )}

                  {/* Status bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        isSelectedInActiveTab 
                          ? (isMorningTab ? "text-amber-700" : "text-indigo-700") 
                          : "text-slate-400"
                      }`}
                    >
                      {isSelectedInActiveTab
                        ? `✓ Mở bán ${isMorningTab ? "Sáng" : "Chiều"}`
                        : `✕ Tạm ẩn ${isMorningTab ? "Sáng" : "Chiều"}`}
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
                                `Bạn có chắc muốn xóa món "${dish.name}" khỏi hệ thống?`
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
            })
          )}
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
