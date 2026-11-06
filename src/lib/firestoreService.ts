import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { getFirebaseInstance } from './firebase';
import { DailySheet, Dish, OrderRow } from '@/types';
import { INITIAL_DISHES, INITIAL_ORDERS } from './mockData';

// Storage keys cho Local fallback
const STORAGE_PREFIX = 'cloud_order_';

// 1. Quản lý danh mục món ăn (Dishes)
export async function getDishes(): Promise<Dish[]> {
  const { db, isConfigured } = getFirebaseInstance();

  if (isConfigured && db) {
    try {
      const q = query(collection(db, 'dishes'), orderBy('orderIndex', 'asc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Dish));
      }
    } catch (e) {
      console.warn('Firestore fetch dishes error, fallback to local', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`${STORAGE_PREFIX}dishes`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parse local dishes', e);
      }
    }
    // Khởi tạo mặc định lần đầu
    localStorage.setItem(`${STORAGE_PREFIX}dishes`, JSON.stringify(INITIAL_DISHES));
  }

  return INITIAL_DISHES;
}

export async function saveDishes(dishes: Dish[]): Promise<void> {
  const { db, isConfigured } = getFirebaseInstance();

  // Luôn lưu bản sao vào localStorage để có trải nghiệm tức thì
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}dishes`, JSON.stringify(dishes));
  }

  if (isConfigured && db) {
    try {
      // Lưu từng món vào Firestore collection 'dishes'
      for (const dish of dishes) {
        const docRef = doc(db, 'dishes', dish.id);
        await setDoc(docRef, dish, { merge: true });
      }
    } catch (e) {
      console.error('Firestore save dishes error', e);
    }
  }
}

// 2. Quản lý Sheet Order theo ngày
export async function getDailySheet(dateStr: string, activeDishIds: string[]): Promise<DailySheet> {
  const { db, isConfigured } = getFirebaseInstance();

  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'daily_sheets', dateStr);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailySheet;
        return data;
      }
    } catch (e) {
      console.warn('Firestore fetch daily sheet error, fallback to local', e);
    }
  }

  // Fallback LocalStorage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`${STORAGE_PREFIX}sheet_${dateStr}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parse local sheet', e);
      }
    }
  }

  // Khởi tạo sheet mặc định cho ngày
  const defaultSheet: DailySheet = {
    date: dateStr,
    dishIds: activeDishIds.length > 0 ? activeDishIds : INITIAL_DISHES.map(d => d.id),
    orders: INITIAL_ORDERS,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}sheet_${dateStr}`, JSON.stringify(defaultSheet));
  }

  return defaultSheet;
}

export async function saveDailySheet(sheet: DailySheet): Promise<void> {
  const { db, isConfigured } = getFirebaseInstance();

  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}sheet_${sheet.date}`, JSON.stringify(sheet));
  }

  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'daily_sheets', sheet.date);
      await setDoc(docRef, {
        ...sheet,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.error('Firestore save daily sheet error', e);
    }
  }
}

// 3. Listener Realtime (cho nhiều thiết bị cùng xem)
export function subscribeDailySheet(
  dateStr: string, 
  onUpdate: (sheet: DailySheet) => void
): () => void {
  const { db, isConfigured } = getFirebaseInstance();

  if (isConfigured && db) {
    const docRef = doc(db, 'daily_sheets', dateStr);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as DailySheet);
      }
    }, (error) => {
      console.warn('Firestore subscription error', error);
    });

    return unsubscribe;
  }

  // Fallback polling or storage event listener for multi-tab
  if (typeof window !== 'undefined') {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${STORAGE_PREFIX}sheet_${dateStr}` && e.newValue) {
        try {
          onUpdate(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  return () => {};
}
