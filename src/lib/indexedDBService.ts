import { DailySheet, Dish, OrderRow } from '@/types';
import { INITIAL_DISHES, INITIAL_ORDERS } from './mockData';

const DB_NAME = 'CloudOrderDB';
const DB_VERSION = 1;

const STORES = {
  SHEETS: 'daily_sheets',
  DISHES: 'dishes',
  META: 'meta',
};

const MAX_ACTIVE_SALES_DAYS = 10;

// Mở hoặc khởi tạo IndexedDB
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is only available in browser'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.SHEETS)) {
        db.createObjectStore(STORES.SHEETS, { keyPath: 'date' });
      }

      if (!db.objectStoreNames.contains(STORES.DISHES)) {
        db.createObjectStore(STORES.DISHES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 1. Quản lý Món ăn (Dishes)
export async function getStoredDishes(): Promise<Dish[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.DISHES, 'readonly');
      const store = tx.objectStore(STORES.DISHES);
      const req = store.getAll();

      req.onsuccess = () => {
        const dishes = req.result as Dish[];
        if (dishes && dishes.length > 0) {
          dishes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
          resolve(dishes);
        } else {
          // Khởi tạo món mặc định lần đầu
          saveStoredDishes(INITIAL_DISHES).then(() => resolve(INITIAL_DISHES));
        }
      };

      req.onerror = () => {
        resolve(INITIAL_DISHES);
      };
    });
  } catch (err) {
    console.warn('Error reading dishes from IndexedDB, using fallback', err);
    return INITIAL_DISHES;
  }
}

export async function saveStoredDishes(dishes: Dish[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DISHES, 'readwrite');
      const store = tx.objectStore(STORES.DISHES);

      // Xóa toàn bộ trước khi ghi lại để đảm bảo xóa món ăn chính xác
      store.clear();

      dishes.forEach((dish) => {
        store.put(dish);
      });

      tx.oncomplete = () => {
        // Lưu dự phòng cả localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cloud_order_dishes', JSON.stringify(dishes));
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save dishes to IndexedDB', err);
  }
}

// 2. Quản lý Sheet Order theo ngày
export async function getDailySheetFromDB(dateStr: string, activeDishIds: string[]): Promise<DailySheet> {
  try {
    const db = await openDB();
    const sheet = await new Promise<DailySheet | null>((resolve) => {
      const tx = db.transaction(STORES.SHEETS, 'readonly');
      const store = tx.objectStore(STORES.SHEETS);
      const req = store.get(dateStr);

      req.onsuccess = () => {
        resolve(req.result || null);
      };

      req.onerror = () => {
        resolve(null);
      };
    });

    if (sheet) {
      const defaultIds = activeDishIds.length > 0 ? activeDishIds : INITIAL_DISHES.map((d) => d.id);
      const normalized: DailySheet = {
        ...sheet,
        dishIds: sheet.dishIds || defaultIds,
        morningDishIds: sheet.morningDishIds ?? sheet.dishIds ?? defaultIds,
        afternoonDishIds: sheet.afternoonDishIds ?? sheet.dishIds ?? defaultIds,
        orders: (sheet.orders || []).map((o) => ({
          ...o,
          session: o.session || 'morning',
        })),
      };
      return normalized;
    }
  } catch (err) {
    console.warn('Error reading sheet from IndexedDB', err);
  }

  // Khởi tạo sheet mặc định nếu chưa có
  const defaultIds = activeDishIds.length > 0 ? activeDishIds : INITIAL_DISHES.map((d) => d.id);
  const defaultSheet: DailySheet = {
    date: dateStr,
    dishIds: defaultIds,
    morningDishIds: defaultIds,
    afternoonDishIds: defaultIds,
    orders: [],
    updatedAt: new Date().toISOString(),
  };

  // Ngày chưa có đơn thì không lưu vào DB
  return defaultSheet;
}

// Lưu sheet và tự động kiểm tra quy tắc 10 ngày phát sinh đơn
export async function saveDailySheetToDB(sheet: DailySheet): Promise<void> {
  try {
    const db = await openDB();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SHEETS, 'readwrite');
      const store = tx.objectStore(STORES.SHEETS);
      if (!sheet.orders || sheet.orders.length === 0) {
        // Không có đơn nào thì không lưu (và xóa bản cũ nếu có)
        store.delete(sheet.date);
      } else {
        store.put({ ...sheet, updatedAt: new Date().toISOString() });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Nếu ngày này có phát sinh đơn (orders.length > 0), thực thi dọn dẹp giữ tối đa 10 ngày
    if (sheet.orders && sheet.orders.length > 0) {
      await cleanupOldSalesDays(db);
    }
  } catch (err) {
    console.error('Failed to save daily sheet to IndexedDB', err);
  }
}

// Quy tắc 10 ngày có phát sinh đơn:
// Nếu có > 10 ngày có đơn, tìm ngày cũ nhất trong số đó và xóa dữ liệu ngày cũ nhất
export async function cleanupOldSalesDays(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORES.SHEETS, 'readwrite');
    const store = tx.objectStore(STORES.SHEETS);
    const req = store.getAll();

    req.onsuccess = () => {
      const allSheets = (req.result || []) as DailySheet[];

      // Lọc các ngày có phát sinh đơn (có bán hàng)
      const salesSheets = allSheets.filter((s) => s.orders && s.orders.length > 0);

      // Sắp xếp ngày tăng dần (từ cũ nhất đến mới nhất)
      salesSheets.sort((a, b) => a.date.localeCompare(b.date));

      const deletedDates: string[] = [];

      // Nếu số ngày có đơn vượt quá 10 ngày
      if (salesSheets.length > MAX_ACTIVE_SALES_DAYS) {
        const excessCount = salesSheets.length - MAX_ACTIVE_SALES_DAYS;
        const daysToDelete = salesSheets.slice(0, excessCount);

        daysToDelete.forEach((oldSheet) => {
          store.delete(oldSheet.date);
          deletedDates.push(oldSheet.date);
          console.log(`[IndexedDB 10-Days Policy] Đã xóa ngày cũ nhất: ${oldSheet.date} để duy trì tối đa 10 ngày bán`);
        });
      }

      resolve(deletedDates);
    };

    req.onerror = () => {
      resolve([]);
    };
  });
}

// Lấy danh sách các ngày đang có đơn trong IndexedDB (tối đa 10 ngày)
export async function getActiveSalesDays(): Promise<Array<{ 
  date: string; 
  orderCount: number; 
  morningOrderCount: number;
  afternoonOrderCount: number;
  updatedAt: string;
}>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SHEETS, 'readonly');
      const store = tx.objectStore(STORES.SHEETS);
      const req = store.getAll();

      req.onsuccess = () => {
        const allSheets = (req.result || []) as DailySheet[];
        const salesSheets = allSheets
          .filter((s) => s.orders && s.orders.length > 0)
          .sort((a, b) => b.date.localeCompare(a.date)) // Mới nhất lên đầu
          .map((s) => {
            const morningCount = (s.orders || []).filter((o) => (o.session || 'morning') === 'morning').length;
            const afternoonCount = (s.orders || []).filter((o) => o.session === 'afternoon').length;
            return {
              date: s.date,
              orderCount: (s.orders || []).length,
              morningOrderCount: morningCount,
              afternoonOrderCount: afternoonCount,
              updatedAt: s.updatedAt,
            };
          });

        resolve(salesSheets.slice(0, MAX_ACTIVE_SALES_DAYS));
      };

      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

// Xóa hoàn toàn 1 ngày thủ công nếu cần
export async function deleteDailySheetFromDB(dateStr: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SHEETS, 'readwrite');
      const store = tx.objectStore(STORES.SHEETS);
      store.delete(dateStr);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Error deleting sheet', e);
  }
}

// Chỉ đơn mẫu cũ có id dạng row-1..row-99 (đơn thật có dạng row-<timestamp>-xxxx)
export function isSampleOrderId(id?: string): boolean {
  return !!id && /^row-\d{1,2}$/.test(id);
}

// Dọn sạch toàn bộ các đơn mẫu (row-1 đến row-18) khỏi IndexedDB và LocalStorage
export async function cleanAllSampleOrdersFromDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORES.SHEETS, 'readwrite');
      const store = tx.objectStore(STORES.SHEETS);
      const req = store.getAll();

      req.onsuccess = () => {
        const sheets = (req.result || []) as DailySheet[];
        sheets.forEach((sheet) => {
          if (!sheet.orders || sheet.orders.length === 0) {
            store.delete(sheet.date);
            return;
          }
          const originalCount = sheet.orders ? sheet.orders.length : 0;
          if (originalCount > 0) {
            sheet.orders = sheet.orders.filter((o) => !isSampleOrderId(o.id));
            if (sheet.orders.length !== originalCount) {
              store.put(sheet);
            }
          }
        });
        resolve();
      };
      req.onerror = () => resolve();
    });

    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes('sheet_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            if (item.orders && item.orders.some((o: any) => isSampleOrderId(o.id))) {
              item.orders = item.orders.filter((o: any) => !isSampleOrderId(o.id));
              localStorage.setItem(key, JSON.stringify(item));
            }
          } catch (e) {}
        }
      });
    }
  } catch (e) {
    console.error('Error cleaning sample orders from DB', e);
  }
}

// Yêu cầu trình duyệt đánh dấu kho lưu trữ là "persistent" để IndexedDB
// không bị hệ điều hành/trình duyệt tự dọn khi thiếu dung lượng hoặc khi đóng PWA.
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch (err) {
    console.warn('Cannot request persistent storage', err);
    return false;
  }
}

// ===== Sao lưu / khôi phục thủ công (JSON) =====
export interface BackupData {
  app: 'cloud-order';
  version: 1;
  exportedAt: string;
  dishes: Dish[];
  sheets: DailySheet[];
}

export async function exportAllData(): Promise<BackupData> {
  const db = await openDB();
  const readAll = <T,>(storeName: string) =>
    new Promise<T[]>((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      req.onsuccess = () => resolve((req.result || []) as T[]);
      req.onerror = () => reject(req.error);
    });
  const [dishes, sheets] = await Promise.all([
    readAll<Dish>(STORES.DISHES),
    readAll<DailySheet>(STORES.SHEETS),
  ]);
  return { app: 'cloud-order', version: 1, exportedAt: new Date().toISOString(), dishes, sheets };
}

// Ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu trong file sao lưu
export async function importAllData(data: unknown): Promise<{ dishes: number; sheets: number }> {
  const d = data as Partial<BackupData>;
  if (!d || d.app !== 'cloud-order' || !Array.isArray(d.dishes) || !Array.isArray(d.sheets)) {
    throw new Error('File sao lưu không hợp lệ');
  }
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORES.DISHES, STORES.SHEETS], 'readwrite');
    const dishStore = tx.objectStore(STORES.DISHES);
    const sheetStore = tx.objectStore(STORES.SHEETS);
    dishStore.clear();
    sheetStore.clear();
    d.dishes!.forEach((x) => dishStore.put(x));
    d.sheets!.forEach((x) => sheetStore.put(x));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return { dishes: d.dishes.length, sheets: d.sheets.length };
}
