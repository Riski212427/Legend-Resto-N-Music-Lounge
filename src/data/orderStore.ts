import { CartItem } from '../App';

export type OrderStatus = 'menunggu' | 'dimasak' | 'siap' | 'lunas' | 'batal';

export interface OrderRating {
  stars: number; // 1 to 5
  feedback?: string;
  aspects?: string[];
  createdAt: number;
}

export interface TableTransferRecord {
  fromTable: string;
  toTable: string;
  time: string;
  timestamp: number;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerEmail?: string;
  items: CartItem[];
  total: number;
  time: string;
  timestamp: number;
  paymentMethod: string;
  isPaid: boolean;
  status: OrderStatus;
  notes?: string;
  rating?: OrderRating;
  tableTransferHistory?: TableTransferRecord[];
  cancelReason?: string;
}

const STORAGE_KEY = 'legend_resto_pos_orders';
const SYNC_CHANNEL_NAME = 'legend_resto_sync_channel';

// Initial realistic seed orders for demo
const INITIAL_SEED_ORDERS: StoreOrder[] = [
  {
    id: 'ord-100',
    orderNumber: '#LEGEND-100',
    tableNumber: 'Meja 01',
    customerName: 'Keluarga Pak Hendra',
    items: [
      {
        cartId: 'item-0',
        menu: {
          id: 'is-1',
          name: 'Iga Sapi Bakar Karamel Madu',
          description: 'Iga sapi empuk dibakar dengan saus madu gurih khas chef.',
          price: 55000,
          category: 'main_course',
          isPopular: true,
        },
        quantity: 2,
      },
    ],
    total: 110000,
    time: '18:30 WIB',
    timestamp: Date.now() - 1000 * 60 * 60,
    paymentMethod: 'QRIS Online',
    isPaid: true,
    status: 'lunas',
    rating: {
      stars: 5,
      feedback: 'Iga bakarnya sangat empuk dan bumbu madunya meresap sampai ke tulang! Suasana musik lounge santai.',
      aspects: ['Rasa Makanan Lezat', 'Pelayanan Ramah', 'Suasana & Musik Cozy'],
      createdAt: Date.now() - 1000 * 60 * 45,
    },
  },
  {
    id: 'ord-101',
    orderNumber: '#LEGEND-101',
    tableNumber: 'Meja 03',
    customerName: 'Bima & Rekan',
    items: [
      {
        cartId: 'item-1',
        menu: {
          id: 'sk-1',
          name: 'Sate Kambing Legend (10 Tusuk)',
          description: 'Daging kambing muda empuk dipadu bumbu kecap pedas gurih.',
          price: 45000,
          category: 'main_course',
          isPopular: true,
        },
        quantity: 2,
        notes: 'Banyakin kecap dan irisan rawit',
      },
      {
        cartId: 'item-2',
        menu: {
          id: 'bev-1',
          name: 'Legend Lychee Tea Lounge',
          description: 'Es teh premium dengan buah leci segar dan sirup leci asli.',
          price: 22000,
          category: 'beverages',
          isPopular: true,
        },
        quantity: 2,
      },
    ],
    total: 134000,
    time: '19:42 WIB',
    timestamp: Date.now() - 1000 * 60 * 18,
    paymentMethod: 'Bayar di Kasir',
    isPaid: false,
    status: 'dimasak',
    notes: 'Minuman disajikan bersamaan dengan makanan, minta sambal kecap terpisah',
  },
  {
    id: 'ord-102',
    orderNumber: '#LEGEND-102',
    tableNumber: 'Meja 07',
    customerName: 'Siti Rahma',
    items: [
      {
        cartId: 'item-3',
        menu: {
          id: 'tc-1',
          name: 'Nasi Goreng Legend Special',
          description: 'Nasi goreng racikan khas lounge dengan suwiran ayam, telur, dan kerupuk.',
          price: 28000,
          category: 'classic',
          isPopular: true,
          options: ['Pedas Sedang', 'Pedas Gila', 'Tidak Pedas'],
        },
        quantity: 1,
        selectedOption: 'Pedas Sedang',
      },
      {
        cartId: 'item-4',
        menu: {
          id: 'sn-1',
          name: 'Platter Snack Legend',
          description: 'Kombinasi kentang goreng renyah, sosis bakar, dan chicken nugget.',
          price: 32000,
          category: 'snack',
          isPopular: true,
        },
        quantity: 1,
      },
      {
        cartId: 'item-5',
        menu: {
          id: 'bev-4',
          name: 'Es Lemon Tea Segar',
          description: 'Kesegaran perasan lemon asli berpadu seduhan daun teh pilihan.',
          price: 15000,
          category: 'beverages',
        },
        quantity: 1,
      },
    ],
    total: 75000,
    time: '19:55 WIB',
    timestamp: Date.now() - 1000 * 60 * 5,
    paymentMethod: 'QRIS Online',
    isPaid: true,
    status: 'menunggu',
    notes: 'Tolong antar bersamaan, minta piring & sendok ekstra untuk 2 orang',
  },
];

// Helper to get channel if supported
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(SYNC_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
}

export const OrderStore = {
  getOrders(): StoreOrder[] {
    if (typeof window === 'undefined') return INITIAL_SEED_ORDERS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_ORDERS));
        return INITIAL_SEED_ORDERS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load orders from localStorage:', e);
      return INITIAL_SEED_ORDERS;
    }
  },

  saveOrders(orders: StoreOrder[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      const channel = getBroadcastChannel();
      if (channel) {
        channel.postMessage({ type: 'ORDERS_UPDATED', orders });
        channel.close();
      }
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('legend_orders_changed', { detail: orders }));
      }, 0);
    } catch (e) {
      console.warn('Failed to save orders:', e);
    }
  },

  addOrder(order: Omit<StoreOrder, 'id' | 'timestamp' | 'status' | 'isPaid'> & Partial<StoreOrder>): StoreOrder {
    const orders = this.getOrders();
    const newOrder: StoreOrder = {
      ...order,
      id: order.id || `ord-${Date.now()}`,
      timestamp: order.timestamp || Date.now(),
      status: order.status || 'menunggu',
      isPaid: order.isPaid ?? (order.paymentMethod?.toLowerCase().includes('qris') ? true : false),
    };

    const updated = [newOrder, ...orders];
    this.saveOrders(updated);

    // Notify listeners specifically of this new order asynchronously
    try {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('legend_new_order_added', { detail: newOrder }));
      }, 0);
    } catch {
      // ignore
    }

    const channel = getBroadcastChannel();
    if (channel) {
      try {
        channel.postMessage({ type: 'NEW_ORDER_ARRIVED', order: newOrder });
        channel.close();
      } catch {
        // ignore
      }
    }

    return newOrder;
  },

  updateStatus(id: string, status: OrderStatus) {
    const orders = this.getOrders();
    const updated = orders.map((o) => {
      if (o.id === id) {
        const isPaid = status === 'lunas' ? true : o.isPaid;
        return { ...o, status, isPaid };
      }
      return o;
    });
    this.saveOrders(updated);
  },

  transferTable(orderId: string, toTable: string): StoreOrder | null {
    const orders = this.getOrders();
    let updatedOrder: StoreOrder | null = null;
    let oldTable = '';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        oldTable = o.tableNumber;
        const history: TableTransferRecord[] = o.tableTransferHistory || [];
        const record: TableTransferRecord = {
          fromTable: oldTable,
          toTable,
          time: timeStr,
          timestamp: Date.now(),
        };
        updatedOrder = {
          ...o,
          tableNumber: toTable,
          tableTransferHistory: [...history, record],
        };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      this.saveOrders(updated);
      try {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('legend_table_transferred', {
              detail: { order: updatedOrder, fromTable: oldTable, toTable },
            })
          );
        }, 0);
      } catch {
        // ignore
      }
      const channel = getBroadcastChannel();
      if (channel) {
        try {
          channel.postMessage({
            type: 'TABLE_TRANSFERRED',
            order: updatedOrder,
            fromTable: oldTable,
            toTable,
          });
          channel.close();
        } catch {
          // ignore
        }
      }
    }

    return updatedOrder;
  },

  cancelOrder(id: string, reason: string): StoreOrder | null {
    const orders = this.getOrders();
    let cancelledOrder: StoreOrder | null = null;
    const updated = orders.map((o) => {
      if (o.id === id) {
        cancelledOrder = {
          ...o,
          status: 'batal' as OrderStatus,
          cancelReason: reason || 'Dibatalkan oleh kasir / pelanggan',
        };
        return cancelledOrder;
      }
      return o;
    });

    if (cancelledOrder) {
      this.saveOrders(updated);
      try {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('legend_order_cancelled', {
              detail: { order: cancelledOrder, reason },
            })
          );
        }, 0);
      } catch {
        // ignore
      }
    }

    return cancelledOrder;
  },

  togglePaid(id: string) {
    const orders = this.getOrders();
    const updated = orders.map((o) => {
      if (o.id === id) {
        return { ...o, isPaid: !o.isPaid };
      }
      return o;
    });
    this.saveOrders(updated);
  },

  deleteOrder(id: string) {
    const orders = this.getOrders();
    const updated = orders.filter((o) => o.id !== id);
    this.saveOrders(updated);
  },

  submitRating(id: string, rating: OrderRating) {
    const orders = this.getOrders();
    const updated = orders.map((o) => {
      if (o.id === id) {
        return { ...o, rating };
      }
      return o;
    });
    this.saveOrders(updated);
  },

  clearAllOrders() {
    this.saveOrders([]);
  },

  resetDemoOrders() {
    this.saveOrders(INITIAL_SEED_ORDERS);
  },

  // Listen to cross-window sync
  subscribe(callback: (orders: StoreOrder[]) => void) {
    if (typeof window === 'undefined') return () => {};

    const handleCustomEvent = (e: any) => {
      callback(e.detail || this.getOrders());
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(this.getOrders());
      }
    };

    window.addEventListener('legend_orders_changed', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (evt) => {
          if (evt.data?.type === 'ORDERS_UPDATED') {
            callback(evt.data.orders || this.getOrders());
          }
        };
      } catch {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('legend_orders_changed', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      if (channel) {
        channel.close();
      }
    };
  },

  // Listen specifically to newly incoming orders from any table or window
  onNewOrder(callback: (order: StoreOrder) => void) {
    if (typeof window === 'undefined') return () => {};

    const handleCustomNewOrder = (e: any) => {
      if (e.detail) {
        callback(e.detail);
      }
    };

    window.addEventListener('legend_new_order_added', handleCustomNewOrder);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (evt) => {
          if (evt.data?.type === 'NEW_ORDER_ARRIVED' && evt.data.order) {
            callback(evt.data.order);
          }
        };
      } catch {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('legend_new_order_added', handleCustomNewOrder);
      if (channel) {
        channel.close();
      }
    };
  },
};
