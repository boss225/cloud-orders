'use client';

import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportAllData, importAllData } from '@/lib/indexedDBService';

export default function BackupButtons() {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloud-order-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Xuất dữ liệu thất bại');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('Nhập file sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại trên máy. Tiếp tục?')) return;
    try {
      const result = await importAllData(JSON.parse(await file.text()));
      alert(`Đã khôi phục ${result.dishes} món và ${result.sheets} ngày.`);
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Nhập dữ liệu thất bại');
    }
  };

  const btn =
    'w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs';

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={handleExport} className={btn} title="Xuất dữ liệu ra file JSON">
        <Download className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} className={btn} title="Nhập dữ liệu từ file JSON">
        <Upload className="w-4 h-4" />
      </button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
    </div>
  );
}
