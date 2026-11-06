'use client';

import React, { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { formatDateVN, formatCurrency, generateKitchenSummary } from '@/lib/utils';
import { ChefHat, Copy, Check, X, Printer, Sparkles, Sun, Moon, CalendarRange } from 'lucide-react';
import { MenuSession } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KitchenSummaryModal({ isOpen, onClose }: Props) {
  const { dailySheet, dishes, selectedSession } = useOrder();
  const [activeTab, setActiveTab] = useState<MenuSession | 'all'>(selectedSession || 'all');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dailySheet) return null;

  const dishMap = new Map(dishes.map(d => [d.id, d]));

  // Lọc danh sách đơn theo tab (Sáng, Chiều hoặc Cả ngày)
  const relevantOrders = activeTab === 'all'
    ? (dailySheet.orders || [])
    : (dailySheet.orders || []).filter(o => (o.session || 'morning') === activeTab);

  // Danh sách dishIds theo tab
  const morningIds = dailySheet.morningDishIds ?? dailySheet.dishIds ?? [];
  const afternoonIds = dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [];
  const relevantDishIds = activeTab === 'morning'
    ? morningIds
    : activeTab === 'afternoon'
      ? afternoonIds
      : Array.from(new Set([...morningIds, ...afternoonIds, ...dailySheet.dishIds]));

  // Tính tổng số lượng từng món
  const dishTotals: Record<string, number> = {};
  relevantDishIds.forEach(id => {
    dishTotals[id] = 0;
  });

  let totalItemsCount = 0;
  let estimatedTotalRevenue = 0;
  const extraNotes: Array<{ customer: string; note: string; session?: MenuSession }> = [];

  relevantOrders.forEach(order => {
    Object.entries(order.items).forEach(([dishId, qty]) => {
      if (qty > 0) {
        dishTotals[dishId] = (dishTotals[dishId] || 0) + qty;
        totalItemsCount += qty;
        const d = dishMap.get(dishId);
        if (d) {
          estimatedTotalRevenue += qty * (d.price || 0);
        }
      }
    });

    if (order.extraNote && order.extraNote.trim()) {
      extraNotes.push({
        customer: order.roomOrAddress || order.customerName || `Đơn #${order.stt}`,
        note: order.extraNote.trim(),
        session: order.session || 'morning',
      });
    }
  });

  const handleCopy = () => {
    const text = generateKitchenSummary(dailySheet, dishes, activeTab);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const tabTitle = activeTab === 'morning' 
    ? 'Ca Sáng' 
    : activeTab === 'afternoon' 
      ? 'Ca Chiều' 
      : 'Cả Ngày';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between transition-colors ${
          activeTab === 'morning'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : activeTab === 'afternoon'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
              : 'bg-gradient-to-r from-slate-800 to-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Tổng Hợp Đơn Bếp Làm - {tabTitle}</h3>
              <p className="text-xs text-white/80">{formatDateVN(dailySheet.date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Tabs: Ca Sáng | Ca Chiều | Cả Ngày */}
        <div className="px-6 pt-3 pb-1 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('morning')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>☀️ Ca Sáng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('afternoon')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'afternoon'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>🌙 Ca Chiều</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>📊 Cả Ngày</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border text-center ${
              activeTab === 'afternoon'
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`block text-xs font-medium ${
                activeTab === 'afternoon' ? 'text-indigo-700' : 'text-amber-700'
              }`}>
                Tổng phần món
              </span>
              <span className={`text-2xl font-black ${
                activeTab === 'afternoon' ? 'text-indigo-900' : 'text-amber-900'
              }`}>
                {totalItemsCount}
              </span>
            </div>

            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
              <span className="block text-xs text-orange-700 font-medium">Số đơn khách</span>
              <span className="text-2xl font-black text-orange-900">{relevantOrders.length}</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="block text-xs text-emerald-700 font-medium">Tạm tính tiền</span>
              <span className="text-lg font-black text-emerald-900 truncate block">
                {formatCurrency(estimatedTotalRevenue)}
              </span>
            </div>
          </div>

          {/* Dishes Count Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Số lượng từng món cần làm ({tabTitle}):
            </h4>
            {relevantDishIds.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border rounded-xl text-slate-400 text-xs">
                Chưa có món nào được chọn cho menu ca này.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {relevantDishIds.map(dishId => {
                  const dish = dishMap.get(dishId);
                  const count = dishTotals[dishId] || 0;
                  if (!dish) return null;
                  return (
                    <div
                      key={dishId}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        count > 0 
                          ? activeTab === 'afternoon'
                            ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                            : 'bg-amber-50/70 border-amber-300 shadow-sm' 
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-base text-slate-900 block">{dish.shortName}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{dish.name}</span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg font-black text-lg ${
                        count > 0 
                          ? activeTab === 'afternoon' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Extra Notes */}
          {extraNotes.length > 0 && (
            <div className="p-3.5 bg-yellow-50 rounded-xl border border-yellow-200 text-xs">
              <span className="font-bold text-yellow-900 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                Món thêm & ghi chú riêng ({tabTitle}):
              </span>
              <ul className="space-y-1">
                {extraNotes.map((item, idx) => (
                  <li key={idx} className="text-yellow-800">
                    <strong>
                      {activeTab === 'all' && (
                        <span className="text-slate-500 font-normal mr-1">
                          [{item.session === 'afternoon' ? 'Chiều' : 'Sáng'}]
                        </span>
                      )}
                      {item.customer}:
                    </strong>{' '}
                    {item.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In Bếp ({tabTitle})</span>
          </button>

          <button
            onClick={handleCopy}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow transition flex items-center gap-2 ${
              activeTab === 'afternoon'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép vào bộ nhớ tạm!' : `Copy danh sách ${tabTitle}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
