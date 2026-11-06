import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DailySheet, Dish, MenuSession } from "@/types";

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
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function getCurrentHourVN(): number {
  try {
    const str = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    return parseInt(str, 10);
  } catch {
    return new Date().getHours();
  }
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[dateObj.getDay()];
  return `${dayName}, ${d}/${m}/${y}`;
}

export function generateKitchenSummary(
  sheet: DailySheet, 
  dishes: Dish[], 
  session: MenuSession | 'all' = 'all'
): string {
  const dishMap = new Map<string, Dish>();
  dishes.forEach(d => dishMap.set(d.id, d));

  const relevantOrders = session === 'all'
    ? (sheet.orders || [])
    : (sheet.orders || []).filter(o => (o.session || 'morning') === session);

  const relevantDishIds = session === 'morning'
    ? (sheet.morningDishIds ?? sheet.dishIds ?? [])
    : session === 'afternoon'
      ? (sheet.afternoonDishIds ?? sheet.dishIds ?? [])
      : Array.from(new Set([
          ...(sheet.morningDishIds ?? sheet.dishIds ?? []),
          ...(sheet.afternoonDishIds ?? sheet.dishIds ?? []),
          ...sheet.dishIds,
        ]));

  const totals: Record<string, number> = {};
  relevantDishIds.forEach(id => {
    totals[id] = 0;
  });

  const extraNotes: string[] = [];

  relevantOrders.forEach(order => {
    Object.entries(order.items).forEach(([dishId, qty]) => {
      if (qty > 0) {
        totals[dishId] = (totals[dishId] || 0) + qty;
      }
    });
    if (order.extraNote && order.extraNote.trim()) {
      const sessionLabel = session === 'all' ? (order.session === 'afternoon' ? '[Chiều] ' : '[Sáng] ') : '';
      const orderLabel = order.roomOrAddress || order.customerName || `Đơn #${order.stt}`;
      extraNotes.push(`• ${sessionLabel}[${orderLabel}]: ${order.extraNote}`);
    }
  });

  const sessionTitle = session === 'morning'
    ? 'CA SÁNG'
    : session === 'afternoon'
      ? 'CA CHIỀU'
      : 'CẢ NGÀY';

  let text = `📋 TỔNG HỢP BẾP LÀM MÓN - ${sessionTitle} (${formatDateVN(sheet.date)})\n`;
  text += `--------------------------------------\n`;

  let totalDishesCount = 0;
  relevantDishIds.forEach(id => {
    const dish = dishMap.get(id);
    const count = totals[id] || 0;
    if (count > 0 && dish) {
      text += `👉 ${dish.shortName} (${dish.name}): ${count} phần\n`;
      totalDishesCount += count;
    }
  });

  text += `--------------------------------------\n`;
  text += `🔢 Tổng số phần món: ${totalDishesCount}\n`;
  text += `👥 Tổng số đơn khách: ${relevantOrders.length} đơn\n`;

  if (extraNotes.length > 0) {
    text += `\n📝 MÓN THÊM / GHI CHÚ RIÊNG:\n`;
    text += extraNotes.join('\n') + '\n';
  }

  return text;
}
