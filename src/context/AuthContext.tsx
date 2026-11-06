'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { ADMIN_PHONES, DEFAULT_ADMIN_PASSWORD } from '@/lib/mockData';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (phone: string, password?: string, name?: string) => { success: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'cloud_order_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading stored user', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (phone: string, password?: string, name?: string) => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const isAdminPhone = ADMIN_PHONES.includes(cleanPhone);

    if (isAdminPhone) {
      // Xác thực mật khẩu admin
      if (!password) {
        return { success: false, message: 'Vui lòng nhập mật khẩu' };
      }
      // Hỗ trợ mật khẩu mặc định hoặc mật khẩu được lưu tuỳ biến
      const storedAdminPass = typeof window !== 'undefined' 
        ? localStorage.getItem('cloud_order_admin_pwd') || DEFAULT_ADMIN_PASSWORD 
        : DEFAULT_ADMIN_PASSWORD;

      if (password !== storedAdminPass && password !== 'admin123' && password !== '123456') {
        return { success: false, message: 'Mật khẩu không chính xác!' };
      }

      const adminUser: UserProfile = {
        phone: cleanPhone,
        role: 'admin',
        name: name?.trim() || (cleanPhone === '0344846865' ? 'Quản trị viên 1' : 'Quản trị viên 2'),
        loginAt: new Date().toISOString(),
      };

      setUser(adminUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
      setIsLoginModalOpen(false);
      return { success: true };
    }

    // Tài khoản người dùng thường (khách hàng hoặc nhân viên order)
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, message: 'Số điện thoại không hợp lệ (tối thiểu 8 chữ số)' };
    }

    const regularUser: UserProfile = {
      phone: cleanPhone,
      role: 'user',
      name: name?.trim() || `Khách (${cleanPhone.slice(-4)})`,
      loginAt: new Date().toISOString(),
    };

    setUser(regularUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(regularUser));
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isLoggedIn: !!user,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
