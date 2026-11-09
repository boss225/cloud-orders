'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import Navbar from '@/components/Navbar';
import LoginModal from '@/components/LoginModal';
import { requestPersistentStorage } from '@/lib/indexedDBService';
import KitchenSummaryModal from '@/components/KitchenSummaryModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isKitchenSummaryOpen, setIsKitchenSummaryOpen] = useState(false);

  // Xin quyền lưu trữ bền vững để IndexedDB không bị xóa khi dọn app/PWA
  React.useEffect(() => {
    requestPersistentStorage();
  }, []);

  // Đăng ký Service Worker cho PWA (chỉ kích hoạt ở production, tự hủy ở localhost dev)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost') {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('PWA SW register info:', err);
        });
      } else {
        // Hủy đăng ký Service Worker và dọn cache nếu đang chạy dev localhost để tránh kẹt cache
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        });
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
      }
    }
  }, []);

  const isHome = pathname === '/';

  return (
    <AuthProvider>
      <OrderProvider>
        <div className={`flex flex-col bg-slate-50 selection:bg-orange-500 selection:text-white ${
          isHome ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
        }`}>
          <Navbar 
            onOpenKitchenSummary={() => setIsKitchenSummaryOpen(true)}
          />

          <main className={`flex-1 flex flex-col min-h-0 ${isHome ? 'overflow-hidden pb-2.5' : 'pb-16'}`}>
            {children}
          </main>

          {/* Chỉ hiển thị footer ở các trang phụ */}
          {!isHome && (
            <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>
                  <strong>Cloud Order</strong> &bull; Hệ thống Sheet Order món ăn hàng ngày
                </p>
              </div>
            </footer>
          )}

          {/* Global Modals */}
          <LoginModal />
          <KitchenSummaryModal
            isOpen={isKitchenSummaryOpen}
            onClose={() => setIsKitchenSummaryOpen(false)}
          />
        </div>
      </OrderProvider>
    </AuthProvider>
  );
}
