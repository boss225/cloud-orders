'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DailySheet, Dish, OrderRow } from '@/types';
import { 
  getStoredDishes, 
  saveStoredDishes, 
  getDailySheetFromDB, 
  saveDailySheetToDB, 
  getActiveSalesDays 
} from '@/lib/indexedDBService';
import { 
  pushDailySheetToFirestore, 
  pushDishesToFirestore, 
  subscribeRemoteDailySheet, 
  subscribeRemoteDishes 
} from '@/lib/firestoreSync';
import { getFirebaseInstance } from '@/lib/firebase';
import { getTodayString } from '@/lib/utils';
import { INITIAL_DISHES, INITIAL_ORDERS } from '@/lib/mockData';

export interface ActiveSalesDayInfo {
  date: string;
  orderCount: number;
  updatedAt: string;
}

interface OrderContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dishes: Dish[];
  dailySheet: DailySheet | null;
  activeDishes: Dish[];
  isLoading: boolean;
  activeSalesDays: ActiveSalesDayInfo[];
  savedDaysCount: number;
  isFirebaseConfigured: boolean;
  // Order actions
  addOrderRow: (data: Partial<OrderRow>) => void;
  updateOrderRow: (rowId: string, updates: Partial<OrderRow>) => void;
  deleteOrderRow: (rowId: string) => void;
  quickChangeCell: (rowId: string, dishId: string, qty: number) => void;
  toggleRowDelivered: (rowId: string) => void;
  // Dish & Menu actions
  addOrUpdateDish: (dish: Dish) => Promise<void>;
  deleteDish: (dishId: string) => Promise<void>;
  toggleDishInDailyMenu: (dishId: string) => Promise<void>;
  setDailyMenuColumns: (dishIds: string[]) => Promise<void>;
  resetToPhotoData: () => void;
  refreshSalesDays: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [dailySheet, setDailySheet] = useState<DailySheet | null>(() => ({
    date: getTodayString(),
    dishIds: INITIAL_DISHES.map(d => d.id),
    orders: INITIAL_ORDERS,
    updatedAt: new Date().toISOString(),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [activeSalesDays, setActiveSalesDays] = useState<ActiveSalesDayInfo[]>([]);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(false);

  // Kiểm tra trạng thái cấu hình Firebase
  useEffect(() => {
    const { isConfigured } = getFirebaseInstance();
    setIsFirebaseConfigured(isConfigured);
  }, []);

  // Cập nhật danh sách các ngày có phát sinh đơn (tối đa 10 ngày)
  const refreshSalesDays = useCallback(async () => {
    const days = await getActiveSalesDays();
    setActiveSalesDays(days);
  }, []);

  // 1. Tải danh mục món ăn (Dishes) từ IndexedDB + Lắng nghe Realtime từ Firebase
  useEffect(() => {
    getStoredDishes().then((loadedDishes) => {
      setDishes(loadedDishes);
    });
    refreshSalesDays();

    // Lắng nghe realtime từ Firebase khi các máy khác đổi menu
    const unsubscribe = subscribeRemoteDishes((remoteDishes) => {
      setDishes(remoteDishes);
    });

    return () => {
      unsubscribe();
    };
  }, [refreshSalesDays]);

  // 2. Tải sheet order của ngày từ IndexedDB + Lắng nghe Realtime từ Firebase
  useEffect(() => {
    if (dishes.length === 0) return;

    setIsLoading(true);
    const activeIds = dishes.filter(d => d.isAvailable !== false).map(d => d.id);

    // Tải trước từ IndexedDB cục bộ (cực nhanh, không cần mạng)
    getDailySheetFromDB(selectedDate, activeIds).then((sheet) => {
      setDailySheet(sheet);
      setIsLoading(false);
      refreshSalesDays();
    });

    // Lắng nghe realtime từ Firebase cho ngày được chọn (đồng bộ giữa các thiết bị)
    const unsubscribe = subscribeRemoteDailySheet(selectedDate, (remoteSheet) => {
      setDailySheet(remoteSheet);
      refreshSalesDays();
    });

    return () => {
      unsubscribe();
    };
  }, [selectedDate, dishes, refreshSalesDays]);

  // Active dishes hiện đang làm cột trên sheet
  const activeDishes = React.useMemo(() => {
    if (!dailySheet || dishes.length === 0) return dishes;
    const dishMap = new Map(dishes.map(d => [d.id, d]));
    return dailySheet.dishIds
      .map(id => dishMap.get(id))
      .filter((d): d is Dish => Boolean(d));
  }, [dailySheet, dishes]);

  // Lưu sheet: Ghi vào IndexedDB cục bộ + Đẩy lên Firebase Realtime
  const persistSheet = useCallback(async (newSheet: DailySheet) => {
    setDailySheet(newSheet);
    // 1. Lưu ngay vào IndexedDB cục bộ (Bảo đảm an toàn offline)
    await saveDailySheetToDB(newSheet);
    await refreshSalesDays();

    // 2. Đẩy lên Firebase Firestore Realtime cho các thiết bị khác cùng cập nhật
    await pushDailySheetToFirestore(newSheet);
  }, [refreshSalesDays]);

  // Thêm dòng đơn hàng mới
  const addOrderRow = (data: Partial<OrderRow>) => {
    if (!dailySheet) return;

    const newStt = (dailySheet.orders.length > 0)
      ? Math.max(...dailySheet.orders.map(o => o.stt || 0)) + 1
      : 1;

    const newRow: OrderRow = {
      id: `row-${Date.now()}`,
      stt: newStt,
      customerName: data.customerName || '',
      roomOrAddress: data.roomOrAddress || '',
      phone: data.phone || '',
      items: data.items || {},
      extraNote: data.extraNote || '',
      status: data.status || 'pending',
      hasCheckmark: false,
      createdAt: new Date().toISOString(),
    };

    const newOrders = [...dailySheet.orders, newRow];
    persistSheet({
      ...dailySheet,
      orders: newOrders,
    });
  };

  // Cập nhật dòng
  const updateOrderRow = (rowId: string, updates: Partial<OrderRow>) => {
    if (!dailySheet) return;
    const newOrders = dailySheet.orders.map(row => {
      if (row.id === rowId) {
        return { ...row, ...updates, updatedAt: new Date().toISOString() };
      }
      return row;
    });
    persistSheet({ ...dailySheet, orders: newOrders });
  };

  // Xoá dòng
  const deleteOrderRow = (rowId: string) => {
    if (!dailySheet) return;
    const newOrders = dailySheet.orders.filter(r => r.id !== rowId);
    persistSheet({ ...dailySheet, orders: newOrders });
  };

  // Thay đổi số lượng ô món ăn nhanh (+ / -)
  const quickChangeCell = (rowId: string, dishId: string, qty: number) => {
    if (!dailySheet) return;
    const newOrders = dailySheet.orders.map(row => {
      if (row.id === rowId) {
        const newItems = { ...row.items };
        if (qty <= 0) {
          delete newItems[dishId];
        } else {
          newItems[dishId] = qty;
        }
        return { ...row, items: newItems, updatedAt: new Date().toISOString() };
      }
      return row;
    });
    persistSheet({ ...dailySheet, orders: newOrders });
  };

  // Bật/tắt trạng thái đã giao cả dòng
  const toggleRowDelivered = (rowId: string) => {
    if (!dailySheet) return;
    const newOrders = dailySheet.orders.map(row => {
      if (row.id === rowId) {
        const isDelivered = !row.isDelivered;
        const newStatus: OrderRow['status'] = isDelivered ? 'delivered' : 'pending';
        return {
          ...row,
          isDelivered,
          status: newStatus,
          hasCheckmark: isDelivered,
        };
      }
      return row;
    });
    persistSheet({ ...dailySheet, orders: newOrders });
  };

  // MÓN ĂN & MENU: Ghi IndexedDB + Đẩy Firebase
  const addOrUpdateDish = async (dish: Dish) => {
    let updated: Dish[];
    const exists = dishes.some(d => d.id === dish.id);
    if (exists) {
      updated = dishes.map(d => (d.id === dish.id ? dish : d));
    } else {
      updated = [...dishes, dish];
    }
    setDishes(updated);
    // 1. Ghi IndexedDB
    await saveStoredDishes(updated);
    // 2. Đẩy Firebase Realtime
    await pushDishesToFirestore(updated);

    if (dailySheet && !dailySheet.dishIds.includes(dish.id)) {
      const newDishIds = [...dailySheet.dishIds, dish.id];
      persistSheet({ ...dailySheet, dishIds: newDishIds });
    }
  };

  const deleteDish = async (dishId: string) => {
    const updated = dishes.filter(d => d.id !== dishId);
    setDishes(updated);
    // 1. Ghi IndexedDB
    await saveStoredDishes(updated);
    // 2. Đẩy Firebase Realtime
    await pushDishesToFirestore(updated);

    if (dailySheet && dailySheet.dishIds.includes(dishId)) {
      persistSheet({
        ...dailySheet,
        dishIds: dailySheet.dishIds.filter(id => id !== dishId),
      });
    }
  };

  const toggleDishInDailyMenu = async (dishId: string) => {
    if (!dailySheet) return;
    let newIds: string[];
    if (dailySheet.dishIds.includes(dishId)) {
      newIds = dailySheet.dishIds.filter(id => id !== dishId);
    } else {
      newIds = [...dailySheet.dishIds, dishId];
    }
    persistSheet({ ...dailySheet, dishIds: newIds });
  };

  const setDailyMenuColumns = async (dishIds: string[]) => {
    if (!dailySheet) return;
    persistSheet({ ...dailySheet, dishIds });
  };

  const resetToPhotoData = () => {
    if (!dailySheet) return;
    const defaultIds = INITIAL_DISHES.map(d => d.id);
    setDishes(INITIAL_DISHES);
    saveStoredDishes(INITIAL_DISHES);
    pushDishesToFirestore(INITIAL_DISHES);
    persistSheet({
      date: selectedDate,
      dishIds: defaultIds,
      orders: INITIAL_ORDERS,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <OrderContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        dishes,
        dailySheet,
        activeDishes,
        isLoading,
        activeSalesDays,
        savedDaysCount: activeSalesDays.length,
        isFirebaseConfigured,
        addOrderRow,
        updateOrderRow,
        deleteOrderRow,
        quickChangeCell,
        toggleRowDelivered,
        addOrUpdateDish,
        deleteDish,
        toggleDishInDailyMenu,
        setDailyMenuColumns,
        resetToPhotoData,
        refreshSalesDays,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
