'use client';

import React, { useState, useEffect } from 'react';
import { getStoredFirebaseConfig, FirebaseConfig } from '@/lib/firebase';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, RefreshCw, KeyRound, Copy } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirebaseConfigModal({ isOpen, onClose }: Props) {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredFirebaseConfig();
      if (stored) {
        setConfig(stored);
      }
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('cloud_order_firebase_config', JSON.stringify(config));
      setIsSaved(true);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cloud_order_firebase_config');
      window.location.reload();
    }
  };

  const envTemplate = `NEXT_PUBLIC_FIREBASE_API_KEY=${config.apiKey || 'your_api_key'}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain || 'your_project.firebaseapp.com'}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId || 'your_project_id'}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket || 'your_project.appspot.com'}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId || '1234567890'}
NEXT_PUBLIC_FIREBASE_APP_ID=${config.appId || '1:1234567890:web:abcdef'}`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envTemplate);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cấu hình Firebase Firestore</h3>
              <p className="text-xs text-slate-600">Đồng bộ Sheet Order & Menu theo thời gian thực</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <span>💡 Hướng dẫn lấy thông tin Firebase:</span>
            </p>
            <p>
              Vào <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-semibold text-blue-700 inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> &rarr; Chọn Project &rarr; Project Settings &rarr; Your apps &rarr; Web app &rarr; Sao chép các trường bên dưới dán vào đây (hoặc dán vào file <code>.env.local</code>).
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project ID</label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                placeholder="ví dụ: cloud-order-app"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">API Key</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-xs font-mono outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Auth Domain</label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                  placeholder="project-id.firebaseapp.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Bucket</label>
                <input
                  type="text"
                  value={config.storageBucket}
                  onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                  placeholder="project-id.appspot.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  value={config.messagingSenderId}
                  onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                  placeholder="123456789"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">App ID</label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                  placeholder="1:123456:web:abcdef"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-xs font-mono outline-none"
                />
              </div>
            </div>

            {isSaved && (
              <div className="flex items-center gap-2 p-3 text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Đã lưu thành công! Đang tải lại để kết nối...</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
              >
                Xóa cài đặt (Dùng Local)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyEnv}
                  className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy .env.local</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Lưu & Kết Nối Ngay</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
