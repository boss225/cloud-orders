'use client';

import React, { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { formatDateVN, formatCurrency, generateKitchenSummary } from '@/lib/utils';
import { ChefHat, Copy, Check, X, Printer, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KitchenSummaryModal({ isOpen, onClose }: Props) {
  const { dailySheet, dishes, activeDishes } = useOrder();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dailySheet) return null;

  const dishMap = new Map(dishes.map(d => [d.id, d]));

  // Tính tổng số lượng từng món
  const dishTotals: Record<string, number> = {};
  dailySheet.dishIds.forEach(id => {
    dishTotals[id] = 0;
  });

  let totalItemsCount = 0;
  let estimatedTotalRevenue = 0;
  const extraNotes: Array<{ customer: string; note: string }> = [];

  dailySheet.orders.forEach(order => {
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
        customer: order.customerName || `Đơn #${order.stt}`,
        note: order.extraNote.trim(),
      });
    }
  });

  const handleCopy = () => {
    const text = generateKitchenSummary(dailySheet, dishes);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Tổng Hợp Đơn Bếp Làm</h3>
              <p className="text-xs text-amber-100">{formatDateVN(dailySheet.date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="block text-xs text-amber-700 font-medium">Tổng phần món</span>
              <span className="text-2xl font-black text-amber-900">{totalItemsCount}</span>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
              <span className="block text-xs text-orange-700 font-medium">Số đơn khách</span>
              <span className="text-2xl font-black text-orange-900">{dailySheet.orders.length}</span>
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
              Số lượng từng món cần làm:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {dailySheet.dishIds.map(dishId => {
                const dish = dishMap.get(dishId);
                const count = dishTotals[dishId] || 0;
                if (!dish) return null;
                return (
                  <div
                    key={dishId}
                    className={`p-3 rounded-xl border transition flex items-center justify-between ${
                      count > 0 
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-base text-slate-900 block">{dish.shortName}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{dish.name}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg font-black text-lg ${
                      count > 0 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra Notes */}
          {extraNotes.length > 0 && (
            <div className="p-3.5 bg-yellow-50 rounded-xl border border-yellow-200 text-xs">
              <span className="font-bold text-yellow-900 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                Món thêm & ghi chú riêng:
              </span>
              <ul className="space-y-1">
                {extraNotes.map((item, idx) => (
                  <li key={idx} className="text-yellow-800">
                    <strong>{item.customer}:</strong> {item.note}
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
            <span>In Bếp</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow transition flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép vào bộ nhớ tạm!' : 'Copy danh sách gửi Zalo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
