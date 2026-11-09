'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DailySheet, Dish, OrderRow, MenuSession } from '@/types';
import { 
  getStoredDishes, 
  saveStoredDishes, 
  getDailySheetFromDB, 
  saveDailySheetToDB, 
  getActiveSalesDays,
  deleteDailySheetFromDB,
  cleanAllSampleOrdersFromDB,
  isSampleOrderId 
} from '@/lib/indexedDBService';
import { getTodayString, getCurrentHourVN } from '@/lib/utils';
import { INITIAL_DISHES, INITIAL_ORDERS } from '@/lib/mockData';

export interface ActiveSalesDayInfo {
  date: string;
  orderCount: number;
  morningOrderCount?: number;
  afternoonOrderCount?: number;
  updatedAt: string;
}

interface OrderContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSession: MenuSession;
  setSelectedSession: (session: MenuSession) => void;
  dishes: Dish[];
  dailySheet: DailySheet | null;
  activeDishes: Dish[];
  morningDishes: Dish[];
  afternoonDishes: Dish[];
  sessionOrders: OrderRow[];
  morningOrders: OrderRow[];
  afternoonOrders: OrderRow[];
  isLoading: boolean;
  activeSalesDays: ActiveSalesDayInfo[];
  savedDaysCount: number;
  // Order actions
  addOrderRow: (data: Partial<OrderRow>) => void;
  updateOrderRow: (rowId: string, updates: Partial<OrderRow>) => void;
  deleteOrderRow: (rowId: string) => void;
  quickChangeCell: (rowId: string, dishId: string, qty: number) => void;
  toggleRowDelivered: (rowId: string) => void;
  // Dish & Menu actions
  addOrUpdateDish: (dish: Dish) => Promise<void>;
  deleteDish: (dishId: string) => Promise<void>;
  toggleDishInDailyMenu: (dishId: string, session?: MenuSession) => Promise<void>;
  setDailyMenuColumns: (dishIds: string[], session?: MenuSession) => Promise<void>;
  copyMenuSession: (from: MenuSession, to: MenuSession) => Promise<void>;
  deleteDailySheet: (dateStr: string) => Promise<void>;
  resetToPhotoData: () => void;
  refreshSalesDays: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  // Khởi tạo mặc định 'morning' đồng nhất trên cả SSR và initial client render để tránh Hydration error
  const [selectedSession, setSelectedSession] = useState<MenuSession>('morning');

  // Sau khi client mount, tự động cập nhật ca theo thời gian thực (từ 13:00 trở đi là ca chiều)
  useEffect(() => {
    const h = getCurrentHourVN();
    if (h >= 13) {
      setSelectedSession('afternoon');
    }
  }, []);

  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [dailySheet, setDailySheet] = useState<DailySheet | null>(() => ({
    date: getTodayString(),
    dishIds: [],
    morningDishIds: [],
    afternoonDishIds: [],
    orders: [],
    updatedAt: new Date().toISOString(),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [activeSalesDays, setActiveSalesDays] = useState<ActiveSalesDayInfo[]>([]);

  // Cập nhật danh sách các ngày có phát sinh đơn (tối đa 10 ngày)
  const refreshSalesDays = useCallback(async () => {
    const days = await getActiveSalesDays();
    setActiveSalesDays(days);
  }, []);

  // Tự động dọn sạch các đơn mẫu cũ (row-1 đến row-18) khi khởi động trong DB cục bộ
  useEffect(() => {
    const cleanSamples = async () => {
      await cleanAllSampleOrdersFromDB();
      await refreshSalesDays();
    };
    cleanSamples();
  }, [refreshSalesDays]);

  // 1. Tải danh mục món ăn (Dishes) từ IndexedDB cục bộ
  useEffect(() => {
    getStoredDishes().then((loadedDishes) => {
      setDishes(loadedDishes);
    });
    refreshSalesDays();
  }, [refreshSalesDays]);

  // 2. Tải sheet order của ngày từ IndexedDB cục bộ
  useEffect(() => {
    if (dishes.length === 0) return;

    setIsLoading(true);
    const activeIds = dishes.filter(d => d.isAvailable !== false).map(d => d.id);

    // Tải từ IndexedDB cục bộ (nhanh, an toàn, hoàn toàn offline/manual)
    getDailySheetFromDB(selectedDate, activeIds).then((sheet) => {
      const cleanOrders = (sheet.orders || [])
        .filter(o => !isSampleOrderId(o.id))
        .map(o => ({ ...o, session: o.session || 'morning' }));
      const normalized: DailySheet = {
        ...sheet,
        dishIds: sheet.dishIds || [],
        morningDishIds: sheet.morningDishIds ?? sheet.dishIds ?? [],
        afternoonDishIds: sheet.afternoonDishIds ?? sheet.dishIds ?? [],
        orders: cleanOrders,
      };
      setDailySheet(normalized);
      setIsLoading(false);
      refreshSalesDays();
    });
  }, [selectedDate, dishes, refreshSalesDays]);

  // Dishes cho ca sáng
  const morningDishes = React.useMemo(() => {
    if (!dailySheet || !dishes || dishes.length === 0) return dishes || [];
    const dishMap = new Map(dishes.map(d => [d.id, d]));
    const ids = dailySheet.morningDishIds ?? dailySheet.dishIds ?? [];
    return ids
      .map(id => dishMap.get(id))
      .filter((d): d is Dish => Boolean(d));
  }, [dailySheet, dishes]);

  // Dishes cho ca chiều
  const afternoonDishes = React.useMemo(() => {
    if (!dailySheet || !dishes || dishes.length === 0) return dishes || [];
    const dishMap = new Map(dishes.map(d => [d.id, d]));
    const ids = dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [];
    return ids
      .map(id => dishMap.get(id))
      .filter((d): d is Dish => Boolean(d));
  }, [dailySheet, dishes]);

  // Active dishes hiện đang làm cột trên sheet theo ca được chọn
  const activeDishes = React.useMemo(() => {
    return selectedSession === 'afternoon' ? afternoonDishes : morningDishes;
  }, [selectedSession, morningDishes, afternoonDishes]);

  // Orders được phân loại theo ca
  const morningOrders = React.useMemo(() => {
    if (!dailySheet?.orders) return [];
    return dailySheet.orders.filter(o => (o.session || 'morning') === 'morning');
  }, [dailySheet?.orders]);

  const afternoonOrders = React.useMemo(() => {
    if (!dailySheet?.orders) return [];
    return dailySheet.orders.filter(o => o.session === 'afternoon');
  }, [dailySheet?.orders]);

  const sessionOrders = React.useMemo(() => {
    return selectedSession === 'afternoon' ? afternoonOrders : morningOrders;
  }, [selectedSession, morningOrders, afternoonOrders]);

  // Lưu sheet: Ghi vào IndexedDB cục bộ
  const persistSheet = useCallback(async (newSheet: DailySheet) => {
    const normalizedSheet: DailySheet = {
      ...newSheet,
      dishIds: newSheet.dishIds || newSheet.morningDishIds || [],
      morningDishIds: newSheet.morningDishIds ?? newSheet.dishIds ?? [],
      afternoonDishIds: newSheet.afternoonDishIds ?? newSheet.dishIds ?? [],
      orders: newSheet.orders || [],
      updatedAt: new Date().toISOString(),
    };

    setDailySheet(normalizedSheet);
    // Lưu ngay vào IndexedDB cục bộ
    await saveDailySheetToDB(normalizedSheet);
    await refreshSalesDays();
  }, [refreshSalesDays]);

  // Thêm dòng đơn hàng mới
  const addOrderRow = (data: Partial<OrderRow>) => {
    if (!dailySheet) return;

    const rowSession: MenuSession = data.session || selectedSession;
    const sameSessionOrders = (dailySheet.orders || []).filter(
      o => (o.session || 'morning') === rowSession
    );

    const newStt = sameSessionOrders.length > 0
      ? Math.max(...sameSessionOrders.map(o => o.stt || 0)) + 1
      : 1;

    const newRow: OrderRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stt: data.stt || newStt,
      session: rowSession,
      customerName: data.customerName || '',
      roomOrAddress: data.roomOrAddress || '',
      phone: data.phone || '',
      items: data.items || {},
      extraNote: data.extraNote || '',
      status: data.status || 'pending',
      hasCheckmark: false,
      isDelivered: !!data.isDelivered,
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

  // MÓN ĂN & MENU: Ghi IndexedDB cục bộ
  const addOrUpdateDish = async (dish: Dish) => {
    let updated: Dish[];
    const exists = dishes.some(d => d.id === dish.id);
    if (exists) {
      updated = dishes.map(d => (d.id === dish.id ? dish : d));
    } else {
      updated = [...dishes, dish];
    }
    setDishes(updated);
    // Ghi IndexedDB
    await saveStoredDishes(updated);

    if (dailySheet && !exists) {
      const currentMorning = dailySheet.morningDishIds ?? dailySheet.dishIds ?? [];
      const currentAfternoon = dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [];

      const newMorning = selectedSession === 'morning' ? [...currentMorning, dish.id] : currentMorning;
      const newAfternoon = selectedSession === 'afternoon' ? [...currentAfternoon, dish.id] : currentAfternoon;

      persistSheet({
        ...dailySheet,
        morningDishIds: newMorning,
        afternoonDishIds: newAfternoon,
        dishIds: newMorning,
      });
    }
  };

  const deleteDish = async (dishId: string) => {
    const updated = dishes.filter(d => d.id !== dishId);
    setDishes(updated);
    // Ghi IndexedDB
    await saveStoredDishes(updated);

    if (dailySheet) {
      const currentMorning = dailySheet.morningDishIds ?? dailySheet.dishIds ?? [];
      const currentAfternoon = dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [];
      persistSheet({
        ...dailySheet,
        dishIds: (dailySheet.dishIds || []).filter(id => id !== dishId),
        morningDishIds: currentMorning.filter(id => id !== dishId),
        afternoonDishIds: currentAfternoon.filter(id => id !== dishId),
      });
    }
  };

  const toggleDishInDailyMenu = async (dishId: string, session?: MenuSession) => {
    if (!dailySheet) return;
    const targetSession = session || selectedSession;

    const currentMorning = dailySheet.morningDishIds ?? dailySheet.dishIds ?? [];
    const currentAfternoon = dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [];

    let newMorning = [...currentMorning];
    let newAfternoon = [...currentAfternoon];

    if (targetSession === 'morning') {
      if (newMorning.includes(dishId)) {
        newMorning = newMorning.filter(id => id !== dishId);
      } else {
        newMorning = [...newMorning, dishId];
      }
    } else {
      if (newAfternoon.includes(dishId)) {
        newAfternoon = newAfternoon.filter(id => id !== dishId);
      } else {
        newAfternoon = [...newAfternoon, dishId];
      }
    }

    persistSheet({
      ...dailySheet,
      morningDishIds: newMorning,
      afternoonDishIds: newAfternoon,
      dishIds: newMorning,
    });
  };

  const setDailyMenuColumns = async (dishIds: string[], session?: MenuSession) => {
    if (!dailySheet) return;
    const targetSession = session || selectedSession;

    const currentMorning = dailySheet.morningDishIds ?? dailySheet.dishIds ?? [];
    const currentAfternoon = dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? [];

    const newMorning = targetSession === 'morning' ? dishIds : currentMorning;
    const newAfternoon = targetSession === 'afternoon' ? dishIds : currentAfternoon;

    persistSheet({
      ...dailySheet,
      morningDishIds: newMorning,
      afternoonDishIds: newAfternoon,
      dishIds: newMorning,
    });
  };

  const copyMenuSession = async (from: MenuSession, to: MenuSession) => {
    if (!dailySheet) return;
    const sourceIds = from === 'morning'
      ? (dailySheet.morningDishIds ?? dailySheet.dishIds ?? [])
      : (dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? []);

    const newMorning = to === 'morning' ? [...sourceIds] : (dailySheet.morningDishIds ?? dailySheet.dishIds ?? []);
    const newAfternoon = to === 'afternoon' ? [...sourceIds] : (dailySheet.afternoonDishIds ?? dailySheet.dishIds ?? []);

    persistSheet({
      ...dailySheet,
      morningDishIds: newMorning,
      afternoonDishIds: newAfternoon,
      dishIds: newMorning,
    });
  };

  const deleteDailySheet = useCallback(async (dateStr: string) => {
    // 1. Xóa khỏi IndexedDB cục bộ
    await deleteDailySheetFromDB(dateStr);

    // 3. Nếu đang xem đúng ngày này, làm sạch orders về mảng rỗng
    if (selectedDate === dateStr) {
      setDailySheet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          orders: [],
          updatedAt: new Date().toISOString(),
        };
      });
    }

    // 4. Cập nhật lại danh sách các ngày có đơn
    await refreshSalesDays();
  }, [selectedDate, refreshSalesDays]);

  const resetToPhotoData = () => {
    if (!dailySheet) return;
    const defaultIds = INITIAL_DISHES.map(d => d.id);
    setDishes(INITIAL_DISHES);
    saveStoredDishes(INITIAL_DISHES);
    persistSheet({
      date: selectedDate,
      dishIds: defaultIds,
      morningDishIds: defaultIds,
      afternoonDishIds: defaultIds,
      orders: INITIAL_ORDERS,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <OrderContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        selectedSession,
        setSelectedSession,
        dishes,
        dailySheet,
        activeDishes,
        morningDishes,
        afternoonDishes,
        sessionOrders,
        morningOrders,
        afternoonOrders,
        isLoading,
        activeSalesDays,
        savedDaysCount: activeSalesDays.length,
        addOrderRow,
        updateOrderRow,
        deleteOrderRow,
        quickChangeCell,
        toggleRowDelivered,
        addOrUpdateDish,
        deleteDish,
        toggleDishInDailyMenu,
        setDailyMenuColumns,
        copyMenuSession,
        deleteDailySheet,
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
