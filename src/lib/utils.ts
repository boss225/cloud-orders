import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DailySheet, Dish } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[dateObj.getDay()];
  return `${dayName}, ${d}/${m}/${y}`;
}

export function generateKitchenSummary(sheet: DailySheet, dishes: Dish[]): string {
  const dishMap = new Map<string, Dish>();
  dishes.forEach(d => dishMap.set(d.id, d));

  const totals: Record<string, number> = {};
  sheet.dishIds.forEach(id => {
    totals[id] = 0;
  });

  const extraNotes: string[] = [];

  sheet.orders.forEach(order => {
    Object.entries(order.items).forEach(([dishId, qty]) => {
      if (qty > 0) {
        totals[dishId] = (totals[dishId] || 0) + qty;
      }
    });
    if (order.extraNote && order.extraNote.trim()) {
      extraNotes.push(`• [${order.customerName || 'Đơn #' + order.stt}]: ${order.extraNote}`);
    }
  });

  let text = `📋 TỔNG HỢP BẾP LÀM MÓN (${formatDateVN(sheet.date)})\n`;
  text += `--------------------------------------\n`;

  let totalDishesCount = 0;
  sheet.dishIds.forEach(id => {
    const dish = dishMap.get(id);
    const count = totals[id] || 0;
    if (count > 0 && dish) {
      text += `👉 ${dish.shortName} (${dish.name}): ${count} phần\n`;
      totalDishesCount += count;
    }
  });

  text += `--------------------------------------\n`;
  text += `🔢 Tổng số phần món: ${totalDishesCount}\n`;
  text += `👥 Tổng số đơn khách: ${sheet.orders.length} đơn\n`;

  if (extraNotes.length > 0) {
    text += `\n📝 MÓN THÊM / GHI CHÚ RIÊNG:\n`;
    text += extraNotes.join('\n') + '\n';
  }

  return text;
}
