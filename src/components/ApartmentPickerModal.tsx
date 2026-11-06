'use client';

import React, { useState } from 'react';
import { X, Building2, Check, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (apartmentCode: string) => void;
  currentValue?: string;
}

const BLOCKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// 22 tầng: 11 -> 11A -> 12 -> 14 (không có tầng 13)
const FLOORS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '11A', '12', '14', '15', '16', '17', '18', '19', '20',
  '21', '22'
];

// 20 căn hộ mỗi tầng
const UNITS = Array.from({ length: 20 }, (_, i) => String(i + 1));

export default function ApartmentPickerModal({ isOpen, onClose, onSelect, currentValue }: Props) {
  // Phân tích giá trị hiện tại nếu có định dạng Tòa.Tầng.Căn (ví dụ 9.10.15)
  const initialParts = currentValue ? currentValue.split('.') : [];
  
  const [selectedBlock, setSelectedBlock] = useState<string>(initialParts[0] || '1');
  const [selectedFloor, setSelectedFloor] = useState<string>(initialParts[1] || '1');
  const [selectedUnit, setSelectedUnit] = useState<string>(initialParts[2] || '1');

  if (!isOpen) return null;

  const resultApartmentCode = `${selectedBlock}.${selectedFloor}.${selectedUnit}`;

  const handleConfirm = () => {
    onSelect(resultApartmentCode);
    onClose();
  };

  const handleQuickPickUnit = (unit: string) => {
    setSelectedUnit(unit);
    // Tự động xác nhận khi chọn xong căn
    onSelect(`${selectedBlock}.${selectedFloor}.${unit}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
              🏢
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Chọn Nhanh Số Căn Hộ
              </h3>
              <p className="text-[11px] text-amber-100">
                10 Tòa &bull; 22 Tầng (Có 11A, không có 13) &bull; 20 Căn/Tầng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Live Result Preview Bar */}
        <div className="px-5 py-3 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="font-bold">Căn đã chọn:</span>
            <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-mono font-black text-base shadow-sm">
              {resultApartmentCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Xong & Dán vào ô</span>
          </button>
        </div>

        {/* 3 Columns Selector: TÒA - TẦNG - CĂN */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-3 gap-3 sm:gap-4 text-xs select-none">
          {/* CỘT 1: TÒA (1 - 10) */}
          <div className="flex flex-col bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200">
            <div className="text-center font-black uppercase text-[11px] text-slate-700 mb-2 pb-1.5 border-b border-slate-200">
              1. TÒA (1 - 10)
            </div>
            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
              {BLOCKS.map((block) => {
                const isSelected = selectedBlock === block;
                return (
                  <button
                    key={block}
                    type="button"
                    onClick={() => setSelectedBlock(block)}
                    className={`py-2.5 rounded-xl font-black text-sm transition active:scale-90 flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-300'
                        : 'bg-white hover:bg-orange-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-medium opacity-75">Tòa</span>
                    <span className="text-base font-black leading-none mt-0.5">{block}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CỘT 2: TẦNG (22 tầng, không có 13, có 11A) */}
          <div className="flex flex-col bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200">
            <div className="text-center font-black uppercase text-[11px] text-slate-700 mb-2 pb-1.5 border-b border-slate-200">
              2. TẦNG (22 Tầng)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 max-h-72">
              {FLOORS.map((floor) => {
                const isSelected = selectedFloor === floor;
                const is11A = floor === '11A';
                return (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setSelectedFloor(floor)}
                    className={`py-2 rounded-xl font-black transition active:scale-90 flex items-center justify-center ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-300'
                        : is11A
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-white hover:bg-orange-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <span className={floor.length > 2 ? 'text-xs' : 'text-sm'}>
                      {floor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CỘT 3: CĂN HỘ (1 - 20) */}
          <div className="flex flex-col bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200">
            <div className="text-center font-black uppercase text-[11px] text-slate-700 mb-2 pb-1.5 border-b border-slate-200">
              3. CĂN (1 - 20)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 max-h-72">
              {UNITS.map((unit) => {
                const isSelected = selectedUnit === unit;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleQuickPickUnit(unit)}
                    className={`py-2 rounded-xl font-black text-sm transition active:scale-90 flex items-center justify-center ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-300'
                        : 'bg-white hover:bg-orange-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {unit}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>💡 Bấm Tòa &rarr; Tầng &rarr; Căn để tự động chọn và điền ngay</span>
          <button
            type="button"
            onClick={handleConfirm}
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            Áp dụng: {resultApartmentCode}
          </button>
        </div>
      </div>
    </div>
  );
}
