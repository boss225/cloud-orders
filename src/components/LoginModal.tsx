"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_PHONES } from "@/lib/mockData";
import {
  Phone,
  Lock,
  ShieldCheck,
  User,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isAdminDetected, setIsAdminDetected] = useState(false);

  useEffect(() => {
    const clean = phone.trim().replace(/\s+/g, "");
    if (ADMIN_PHONES.includes(clean)) {
      setIsAdminDetected(true);
      setError("");
    } else {
      setIsAdminDetected(false);
      setPassword("");
    }
  }, [phone]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = login(phone, password, name);
    if (!res.success) {
      setError(res.message || "Đăng nhập không thành công");
    } else {
      // Clear inputs
      setPhone("");
      setPassword("");
      setName("");
      setError("");
    }
  };

  const handleQuickSelect = (num: string) => {
    setPhone(num);
    if (ADMIN_PHONES.includes(num)) {
      setPassword("admin");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border-b border-amber-200/60">
          <button
            onClick={closeLoginModal}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                isAdminDetected
                  ? "bg-amber-600 text-white"
                  : "bg-orange-500 text-white"
              }`}
            >
              {isAdminDetected ? (
                <ShieldCheck className="w-6 h-6 animate-bounce" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {isAdminDetected
                  ? "Đăng nhập Quản Trị Viên"
                  : "Đăng nhập Hệ Thống"}
              </h3>
              <p className="text-xs text-slate-600">
                {isAdminDetected
                  ? "Quyền Admin quản lý Menu & Order Sheet"
                  : "Nhập số điện thoại để tiếp tục"}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                required
                autoFocus
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-base font-medium transition-all outline-none ${
                  isAdminDetected
                    ? "border-amber-500 ring-2 ring-amber-200 bg-amber-50/20"
                    : "border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                }`}
              />
            </div>
          </div>

          {/* Admin Detection Badge & Password Field */}
          {isAdminDetected && (
            <div className="space-y-3 pt-1 animate-fadeIn">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-50 rounded-xl border border-amber-300/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Phát hiện số Quản trị viên (Admin)</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mật khẩu Quản trị viên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu admin..."
                    required={isAdminDetected}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-amber-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-base font-medium transition-all outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  💡 Gợi ý mật khẩu mặc định:{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-amber-700">
                    admin
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Optional Name for normal users */}
          {!isAdminDetected && phone.length >= 9 && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên của bạn / Tên phòng (Không bắt buộc)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Oanh, Phòng 9.10.15..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-base shadow-md transition-all flex items-center justify-center gap-2 ${
              isAdminDetected
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25"
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25"
            }`}
          >
            {isAdminDetected ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Đăng nhập quyền Admin</span>
              </>
            ) : (
              <span>Đăng Nhập</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
