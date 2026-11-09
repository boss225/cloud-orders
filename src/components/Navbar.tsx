'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOrder } from '@/context/OrderContext';
import BackupButtons from '@/components/BackupButtons';
import { getTodayString, formatDateVN } from '@/lib/utils';
import { 
  BookOpen, 
  UtensilsCrossed, 
  Calendar, 
  ChefHat, 
  Database, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  ChevronDown,
  History,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface Props {
  onOpenKitchenSummary: () => void;
}

export default function Navbar({ onOpenKitchenSummary }: Props) {
  const pathname = usePathname();
  const { user, isAdmin, isLoggedIn, openLoginModal, logout } = useAuth();
  const { 
    selectedDate, 
    setSelectedDate,
    activeSalesDays,
    savedDaysCount,
    deleteDailySheet
  } = useOrder();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isToday = selectedDate === getTodayString();

  const handleDateChange = (daysOffset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + daysOffset);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Nav */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="Cloud Order" 
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-orange-200/60"
            />
          </Link>

          <nav className="flex items-center gap-1 pl-2 border-l border-slate-200">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                pathname === '/'
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Sheet Order</span>
            </Link>

            <Link
              href="/menu"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                pathname === '/menu'
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Menu</span>
            </Link>
          </nav>
        </div>

        {/* Center: Date Picker */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => handleDateChange(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white transition font-bold"
            title="Ngày trước"
          >
            &larr;
          </button>

          <div className="flex items-center gap-1 px-1 font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleDateChange(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white transition font-bold"
            title="Ngày sau"
          >
            &rarr;
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className="ml-1 px-2 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-bold"
            >
              Hôm nay
            </button>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <BackupButtons />

          {/* IndexedDB 10-Days Retention Badge & Quick Date Jumper */}
          <div className="relative">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Lưu trữ IndexedDB - Lưu tối đa 10 ngày có đơn bán"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{savedDaysCount}/10 ngày</span>
              <ChevronDown className="w-3 h-3 text-emerald-600" />
            </button>

            {/* Dropdown list of the 10 active sales days */}
            {isHistoryOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-600" />
                    Các ngày có bán hàng
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                    {savedDaysCount}/10
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {activeSalesDays.length === 0 ? (
                    <p className="px-2.5 py-3 text-center text-slate-400 italic">
                      Chưa có ngày nào phát sinh đơn
                    </p>
                  ) : (
                    activeSalesDays.map((item) => {
                      const isCurrent = item.date === selectedDate;
                      return (
                        <div
                          key={item.date}
                          className={`w-full group px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-1.5 transition ${
                            isCurrent
                              ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(item.date);
                              setIsHistoryOpen(false);
                            }}
                            className="flex-1 text-left flex flex-col min-w-0"
                            title={`Chuyển sang xem ngày ${formatDateVN(item.date)}`}
                          >
                            <span className="font-semibold truncate text-xs">{formatDateVN(item.date)}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {item.orderCount} đơn
                              {(item.morningOrderCount !== undefined || item.afternoonOrderCount !== undefined) && (
                                <span className="text-slate-400 font-normal ml-1">
                                  (☀️{item.morningOrderCount || 0} 🌙{item.afternoonOrderCount || 0})
                                </span>
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isAdmin) {
                                  openLoginModal();
                                  return;
                                }
                                if (
                                  confirm(
                                    `Bạn có chắc chắn muốn xóa toàn bộ dữ liệu ngày "${formatDateVN(
                                      item.date
                                    )}" (${item.orderCount} đơn)?\n\nDữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống.`
                                  )
                                ) {
                                  deleteDailySheet(item.date);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title={!isAdmin ? "Cần đăng nhập Admin để xóa" : "Xóa dữ liệu ngày này"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 text-[10px] text-slate-400 px-1 leading-tight">
                  💡 Hệ thống tự động lưu 10 ngày có đơn gần nhất. Ngày thứ 11 sẽ tự động xóa ngày thứ 1.
                </div>
              </div>
            )}
          </div>

          {/* Kitchen Summary */}
          <button
            onClick={onOpenKitchenSummary}
            className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            title="Tổng hợp bếp"
          >
            <ChefHat className="w-4 h-4" />
            <span className="hidden sm:inline">Bếp</span>
          </button>

          {/* Auth Button */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-1 bg-slate-50 pl-2 pr-1 py-1 rounded-xl border border-slate-200">
              {isAdmin ? (
                <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-700 max-w-[80px] truncate">
                  {user.name || user.phone}
                </span>
              )}
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-600 transition"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
