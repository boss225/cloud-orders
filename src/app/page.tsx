'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import OrderSheetTable from '@/components/OrderSheetTable';
import OrderRowModal from '@/components/OrderRowModal';
import { OrderRow } from '@/types';
import { Plus, Lock } from 'lucide-react';

export default function HomePage() {
  const { isLoggedIn, isAdmin, openLoginModal } = useAuth();
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<OrderRow | null>(null);

  const handleEditRow = (row: OrderRow) => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditingRow(row);
    setIsRowModalOpen(true);
  };

  const handleAddNew = () => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditingRow(null);
    setIsRowModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 h-full flex flex-col min-h-0 pt-2">
      {/* Notice bar when not Admin */}
      {!isAdmin && (
        <div 
          onClick={openLoginModal}
          className="mb-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100/90 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 cursor-pointer transition shadow-xs shrink-0"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Chế độ xem:</strong> {!isLoggedIn ? 'Bạn chưa đăng nhập. Chỉ tài khoản Admin mới có quyền tạo đơn, sửa/xóa và cộng trừ món.' : 'Tài khoản hiện tại không phải Admin. Chỉ Admin mới có quyền tạo đơn hoặc chỉnh sửa đơn hàng.'}
            </span>
          </div>
          <span className="font-bold underline text-amber-800 whitespace-nowrap ml-2">
            {!isLoggedIn ? 'Đăng nhập Admin →' : 'Đổi sang tài khoản Admin →'}
          </span>
        </div>
      )}

      {/* Main Order Sheet Table */}
      <OrderSheetTable
        onEditRow={handleEditRow}
        onAddNew={handleAddNew}
      />

      {/* Floating Action Button (FAB) at bottom-right for iPad quick order */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
        <button
          onClick={handleAddNew}
          disabled={!isAdmin}
          className={`group flex items-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full font-black text-sm sm:text-base transition-all ${
            !isAdmin
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white shadow-2xl shadow-orange-500/50 hover:shadow-orange-600/60'
          }`}
          title={!isAdmin ? 'Chỉ tài khoản Admin mới có quyền tạo đơn' : 'Tạo đơn hàng mới'}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {isAdmin ? <Plus className="w-4 h-4 stroke-[3]" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
          <span className="tracking-wide">
            {isAdmin ? 'Tạo Đơn' : 'Chỉ Xem'}
          </span>
        </button>
      </div>

      {/* Order Row Modal (Add / Edit) */}
      <OrderRowModal
        isOpen={isRowModalOpen}
        onClose={() => setIsRowModalOpen(false)}
        editingRow={editingRow}
      />
    </div>
  );
}
