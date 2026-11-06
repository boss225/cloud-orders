import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { getFirebaseInstance } from './firebase';
import { DailySheet, Dish } from '@/types';
import { saveDailySheetToDB, saveStoredDishes } from './indexedDBService';

const MAX_ACTIVE_SALES_DAYS = 10;

// Tạo hoặc lấy ID định danh của thiết bị hiện tại (để phân biệt thiết bị này với thiết bị khác)
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('cloud_order_device_id');
  if (!deviceId) {
    deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('cloud_order_device_id', deviceId);
  }
  return deviceId;
}

// 1. Đồng bộ Danh Mục Món Ăn (Dishes)
export async function pushDishesToFirestore(dishes: Dish[]): Promise<void> {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return;

  try {
    const docRef = doc(db, 'meta', 'dishes');
    await setDoc(docRef, {
      dishes,
      lastUpdatedByDeviceId: getDeviceId(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Firebase Sync] Lỗi đẩy món ăn lên Firestore:', err);
  }
}

// Lắng nghe thay đổi món ăn realtime từ các máy khác
export function subscribeRemoteDishes(onRemoteChange: (dishes: Dish[]) => void): () => void {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return () => {};

  try {
    const docRef = doc(db, 'meta', 'dishes');
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const currentDeviceId = getDeviceId();

      // Chỉ cập nhật nếu thay đổi đến từ MÁY KHÁC
      if (data.lastUpdatedByDeviceId !== currentDeviceId && Array.isArray(data.dishes)) {
        console.log('[Firebase Realtime] Nhận cập nhật Menu món ăn từ thiết bị khác');
        // Lưu vào IndexedDB cục bộ của máy này
        await saveStoredDishes(data.dishes);
        // Cập nhật lên màn hình
        onRemoteChange(data.dishes);
      }
    }, (err) => {
      console.warn('[Firebase Sync] Lỗi lắng nghe menu:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase Sync] Lỗi khởi tạo listener menu:', err);
    return () => {};
  }
}

// 2. Đồng bộ Sheet Order theo ngày
export async function pushDailySheetToFirestore(sheet: DailySheet): Promise<void> {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return;

  try {
    const docRef = doc(db, 'daily_sheets', sheet.date);
    await setDoc(docRef, {
      ...sheet,
      lastUpdatedByDeviceId: getDeviceId(),
      updatedAt: new Date().toISOString(),
    });

    // Thực thi quy tắc 10 ngày bán trên Cloud nếu ngày này có đơn
    if (sheet.orders && sheet.orders.length > 0) {
      await cleanupOldSalesDaysOnFirestore(db);
    }
  } catch (err) {
    console.warn('[Firebase Sync] Lỗi đẩy Sheet lên Firestore:', err);
  }
}

// Lắng nghe thay đổi Sheet Order realtime từ các máy khác
export function subscribeRemoteDailySheet(
  dateStr: string,
  onRemoteChange: (sheet: DailySheet) => void
): () => void {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return () => {};

  try {
    const docRef = doc(db, 'daily_sheets', dateStr);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data() as (DailySheet & { lastUpdatedByDeviceId?: string });
      const currentDeviceId = getDeviceId();

      // Chỉ cập nhật nếu thay đổi đến từ MÁY KHÁC
      if (data.lastUpdatedByDeviceId !== currentDeviceId) {
        console.log(`[Firebase Realtime] Nhận cập nhật Sheet ngày ${dateStr} từ thiết bị khác`);
        const { lastUpdatedByDeviceId, ...cleanSheet } = data;
        const normalizedSheet: DailySheet = {
          ...cleanSheet,
          dishIds: cleanSheet.dishIds || [],
          morningDishIds: cleanSheet.morningDishIds ?? cleanSheet.dishIds ?? [],
          afternoonDishIds: cleanSheet.afternoonDishIds ?? cleanSheet.dishIds ?? [],
          orders: (cleanSheet.orders || []).map((o) => ({
            ...o,
            session: o.session || 'morning',
          })),
        };
        // Lưu vào IndexedDB cục bộ của máy này
        await saveDailySheetToDB(normalizedSheet);
        // Cập nhật lên màn hình
        onRemoteChange(normalizedSheet);
      }
    }, (err) => {
      console.warn(`[Firebase Sync] Lỗi lắng nghe sheet ${dateStr}:`, err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn(`[Firebase Sync] Lỗi khởi tạo listener sheet ${dateStr}:`, err);
    return () => {};
  }
}

// 3. Quy tắc 10 ngày có đơn trên Cloud: Tự động xóa ngày cũ nhất nếu có > 10 ngày bán
export async function deleteDailySheetFromFirestore(dateStr: string): Promise<void> {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return;

  try {
    const docRef = doc(db, 'daily_sheets', dateStr);
    await deleteDoc(docRef);
    console.log(`[Firebase Sync] Đã xóa sheet ngày ${dateStr} trên Cloud`);
  } catch (err) {
    console.warn(`[Firebase Sync] Lỗi xóa sheet ngày ${dateStr} trên Cloud:`, err);
  }
}

// Dọn sạch các đơn mẫu (row-1 đến row-18) trên Cloud Firestore
export async function cleanAllSampleOrdersFromFirestore(): Promise<void> {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return;

  try {
    const colRef = collection(db, 'daily_sheets');
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as DailySheet;
      if (data.orders && data.orders.some((o) => o.id?.startsWith('row-'))) {
        const cleanOrders = data.orders.filter((o) => !o.id?.startsWith('row-'));
        await setDoc(doc(db, 'daily_sheets', docSnap.id), {
          ...data,
          orders: cleanOrders,
          updatedAt: new Date().toISOString(),
        });
        console.log(`[Firebase Sync] Đã lọc bỏ đơn mẫu khỏi sheet ngày ${docSnap.id} trên Cloud`);
      }
    }
  } catch (err) {
    console.warn('[Firebase Sync] Lỗi dọn đơn mẫu trên Firestore:', err);
  }
}

async function cleanupOldSalesDaysOnFirestore(db: any): Promise<void> {
  try {
    const colRef = collection(db, 'daily_sheets');
    const snapshot = await getDocs(colRef);
    const salesSheets: DailySheet[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as DailySheet;
      if (data.orders && data.orders.length > 0) {
        salesSheets.push(data);
      }
    });

    // Sắp xếp ngày từ cũ đến mới
    salesSheets.sort((a, b) => a.date.localeCompare(b.date));

    if (salesSheets.length > MAX_ACTIVE_SALES_DAYS) {
      const excess = salesSheets.length - MAX_ACTIVE_SALES_DAYS;
      const toDelete = salesSheets.slice(0, excess);

      for (const old of toDelete) {
        await deleteDoc(doc(db, 'daily_sheets', old.date));
        console.log(`[Firebase 10-Days Policy] Đã xóa ngày cũ nhất trên Cloud: ${old.date}`);
      }
    }
  } catch (err) {
    console.warn('[Firebase Sync] Lỗi dọn dẹp 10 ngày bán trên Cloud:', err);
  }
}
