import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Flame,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Music,
  Check,
  ChevronRight,
  Lock,
  QrCode,
  Camera,
  LayoutDashboard,
  ShieldCheck,
  KeyRound,
  Bell,
  Volume2,
  VolumeX,
  Star,
  MessageSquare,
  MessageSquareQuote,
  Sun,
  Moon,
  Mail,
  Receipt,
  Printer,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { LEGEND_MENU, CATEGORIES, MenuItem } from './data/legendMenu';
import { CameraQRScanner } from './components/CameraQRScanner';
import { CashierPOS } from './components/CashierPOS';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { StaffLoginScreen, StaffRole } from './components/StaffLoginScreen';
import { PopularRecommendations } from './components/PopularRecommendations';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { CustomerReceiptModal } from './components/CustomerReceiptModal';
import { OrderStore, StoreOrder } from './data/orderStore';
import { useTheme } from './utils/theme';

export interface CartItem {
  cartId: string;
  menu: MenuItem;
  quantity: number;
  selectedOption?: string;
  notes?: string;
}

export interface PlacedOrder {
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerEmail?: string;
  items: CartItem[];
  total: number;
  time: string;
  paymentMethod: string;
  notes?: string;
}

const TABLES = [
  'Meja 01',
  'Meja 02',
  'Meja 03',
  'Meja 04',
  'Meja 05',
  'Meja 06',
  'Meja 07',
  'Meja 08',
  'Meja 09',
  'Meja 10',
  'Meja 11',
  'Meja 12',
  'Meja 13',
];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

// Synthesized audio alert chime for customer when food is ready
export function playCustomerReadyChime(tableName?: string) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 4-note ascending celebratory lounge chime: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.15;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });

    // Mobile haptic vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 350]);
    }

    // Friendly Text-To-Speech announcement
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const text = tableName
          ? `Pesanan ${tableName}, siap disajikan!`
          : 'Pesanan Anda telah siap disajikan!';
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'id-ID';
        utter.rate = 1.05;
        utter.pitch = 1.1;
        window.speechSynthesis.speak(utter);
      } catch {
        // speech error fallback
      }
    }
  } catch (err) {
    console.warn('Audio alert blocked:', err);
  }
}

export default function App() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState('Meja 01');
  const [isTableLocked, setIsTableLocked] = useState(() => {
    try {
      return !!sessionStorage.getItem('legend_scanned_table');
    } catch {
      return false;
    }
  });
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Registered customer identity for locked ordering & digital e-receipt
  const [customerName, setCustomerName] = useState(() => {
    try {
      return sessionStorage.getItem('legend_customer_name') || '';
    } catch {
      return '';
    }
  });
  const [customerEmail, setCustomerEmail] = useState(() => {
    try {
      return sessionStorage.getItem('legend_customer_email') || '';
    } catch {
      return '';
    }
  });
  const [isProfileLocked, setIsProfileLocked] = useState(() => {
    try {
      return sessionStorage.getItem('legend_profile_locked') === 'true';
    } catch {
      return false;
    }
  });

  // Modal to prompt customer for Name and Email right after QR scan
  const [isCustomerProfileModalOpen, setIsCustomerProfileModalOpen] = useState(false);
  // Modal to view / print digital e-receipt
  const [isCustomerReceiptModalOpen, setIsCustomerReceiptModalOpen] = useState(false);
  const [receiptToView, setReceiptToView] = useState<PlacedOrder | null>(null);

  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'kasir' | 'qris'>('kasir');
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronized Sold Out items managed by Super Admin
  const [soldOutItems, setSoldOutItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('legend_sold_out_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'legend_sold_out_items') {
        try {
          setSoldOutItems(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleScanSuccess = (newTable: string) => {
    setTableNumber(newTable);
    setIsTableLocked(true);
    try {
      sessionStorage.setItem('legend_scanned_table', newTable);
    } catch {
      // ignore
    }
    setIsScannerOpen(false);

    // Prompt customer for Name and Email to receive payment receipt and lock them
    setIsCustomerProfileModalOpen(true);
    showToast(`Scan ${newTable} berhasil! Silakan lengkapi nama & email untuk struk pembayaran.`);
  };

  const handleSaveCustomerProfile = (savedName: string, savedEmail: string) => {
    setCustomerName(savedName);
    setCustomerEmail(savedEmail);
    setIsProfileLocked(true);
    setIsTableLocked(true);

    try {
      sessionStorage.setItem('legend_customer_name', savedName);
      sessionStorage.setItem('legend_customer_email', savedEmail);
      sessionStorage.setItem('legend_profile_locked', 'true');
      sessionStorage.setItem('legend_scanned_table', tableNumber);
    } catch {
      // ignore
    }

    setIsCustomerProfileModalOpen(false);
    showToast(`✅ Data pemesan ${savedName} & ${tableNumber} tercatat! Data otomatis terkunci saat memesan.`);
  };

  // Helper to check if current URL is a dedicated Cashier / POS route
  const checkIsCashierURL = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return (
      path === '/kasir' ||
      path.startsWith('/kasir') ||
      path === '/pos' ||
      path.startsWith('/pos') ||
      hash === '#/kasir' ||
      hash === '#kasir' ||
      params.get('mode') === 'kasir' ||
      params.get('pos') === 'true'
    );
  };

  const [isCashierRoute, setIsCashierRoute] = useState<boolean>(() => checkIsCashierURL());
  const [staffRole, setStaffRole] = useState<StaffRole | null>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = sessionStorage.getItem('legend_staff_role') as StaffRole | null;
      if (savedRole === 'cashier' || savedRole === 'superadmin') return savedRole;
      if (sessionStorage.getItem('legend_cashier_authenticated') === 'true') return 'cashier';
    }
    return null;
  });

  const handleStaffLoginSuccess = (role: StaffRole) => {
    try {
      sessionStorage.setItem('legend_staff_role', role);
      sessionStorage.setItem('legend_cashier_authenticated', 'true');
    } catch {
      // ignore
    }
    setStaffRole(role);
  };

  const handleStaffLogout = () => {
    try {
      sessionStorage.removeItem('legend_staff_role');
      sessionStorage.removeItem('legend_cashier_authenticated');
    } catch {
      // ignore
    }
    setStaffRole(null);
  };

  const handleBackToCustomerFromStaff = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    url.searchParams.delete('pos');
    window.history.pushState({}, '', '/');
    setIsCashierRoute(false);
  };

  // Listen to browser navigation / history changes for dedicated routes
  useEffect(() => {
    const handleUrlChange = () => {
      setIsCashierRoute(checkIsCashierURL());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Open Staff & Super Admin Login portal with 1 click on logo
  const handleOpenStaffLogin = () => {
    try {
      sessionStorage.removeItem('legend_staff_role');
      sessionStorage.removeItem('legend_cashier_authenticated');
    } catch {
      // ignore
    }
    setStaffRole(null);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'kasir');
    window.history.pushState({}, '', url.toString());
    setIsCashierRoute(true);
  };

  // Live order tracker for this table
  const [allOrders, setAllOrders] = useState<StoreOrder[]>(() => OrderStore.getOrders());
  const [selectedActiveOrderDetails, setSelectedActiveOrderDetails] = useState<StoreOrder | null>(null);

  useEffect(() => {
    const unsub = OrderStore.subscribe((orders) => {
      setAllOrders(orders);
    });
    return () => unsub();
  }, []);

  // Multiple active orders support for this table (e.g. repeat orders)
  const [activeOrderTabIdx, setActiveOrderTabIdx] = useState(0);

  const activeTableOrders = useMemo(() => {
    return allOrders.filter(
      (o) => o.tableNumber === tableNumber && o.status !== 'lunas' && o.status !== 'batal'
    );
  }, [allOrders, tableNumber]);

  const activeTableOrder = useMemo(() => {
    if (activeTableOrders.length === 0) return null;
    return activeTableOrders[activeOrderTabIdx] || activeTableOrders[0];
  }, [activeTableOrders, activeOrderTabIdx]);

  // Audio alert state & listener when status transitions to 'siap' (Siap Diantar)
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState<StoreOrder | null>(null);
  const prevStatusRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isCashierRoute) return;
    if (activeTableOrder) {
      if (
        prevStatusRef.current &&
        prevStatusRef.current !== 'siap' &&
        activeTableOrder.status === 'siap'
      ) {
        if (!isSoundMuted) {
          playCustomerReadyChime(activeTableOrder.tableNumber);
        }
        setShowReadyModal(activeTableOrder);
      }
      prevStatusRef.current = activeTableOrder.status;
    } else {
      prevStatusRef.current = null;
    }
  }, [activeTableOrder, isSoundMuted, isCashierRoute]);

  // Find the latest completed/lunas order for this table
  const finishedTableOrder = useMemo(() => {
    if (isCashierRoute) return undefined;
    return allOrders.find((o) => o.tableNumber === tableNumber && o.status === 'lunas');
  }, [allOrders, tableNumber, isCashierRoute]);

  // Customer satisfaction rating state (Bintang 1-5)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingHoverStars, setRatingHoverStars] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingAspects, setRatingAspects] = useState<string[]>([]);
  const [ratingSubmittedSuccess, setRatingSubmittedSuccess] = useState(false);

  // Auto-prompt rating modal once when order is marked 'lunas' and has no rating yet
  const hasAutoPromptedRatingRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (isCashierRoute) return;
    if (
      finishedTableOrder &&
      !finishedTableOrder.rating &&
      !activeTableOrder &&
      hasAutoPromptedRatingRef.current !== finishedTableOrder.id
    ) {
      hasAutoPromptedRatingRef.current = finishedTableOrder.id;
      const timer = setTimeout(() => {
        setIsRatingModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [finishedTableOrder, activeTableOrder, isCashierRoute]);

  const handleToggleAspect = (aspect: string) => {
    setRatingAspects((prev) =>
      prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect]
    );
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedTableOrder) return;

    OrderStore.submitRating(finishedTableOrder.id, {
      stars: ratingStars,
      feedback: ratingFeedback.trim() || undefined,
      aspects: ratingAspects.length > 0 ? ratingAspects : undefined,
      createdAt: Date.now(),
    });

    setRatingSubmittedSuccess(true);
    setTimeout(() => {
      setIsRatingModalOpen(false);
      setRatingSubmittedSuccess(false);
      showToast('🌟 Terima kasih atas ulasan bintang Anda!');
    }, 1500);
  };

  // Modal for configuring options before adding (e.g. Goreng vs Rebus)
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);
  const [chosenOption, setChosenOption] = useState<string>('');
  const [itemNotes, setItemNotes] = useState<string>('');

  // Read URL param for table (e.g. ?meja=02 or ?meja=13)
  useEffect(() => {
    if (isCashierRoute) return;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mejaParam = params.get('meja') || params.get('table');
      if (mejaParam) {
        const num = parseInt(mejaParam.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num >= 1 && num <= 13) {
          const formatted = `Meja ${String(num).padStart(2, '0')}`;
          setTableNumber(formatted);
          setIsTableLocked(true);
          try {
            sessionStorage.setItem('legend_scanned_table', formatted);
          } catch {
            // ignore
          }

          // If customer has not registered name & email in this session, open modal
          const savedName = sessionStorage.getItem('legend_customer_name');
          const savedEmail = sessionStorage.getItem('legend_customer_email');
          if (!savedName || !savedEmail) {
            setIsCustomerProfileModalOpen(true);
          }
          return;
        }
      }

      // Check if this session previously scanned a table
      try {
        const savedTable = sessionStorage.getItem('legend_scanned_table');
        if (savedTable) {
          setTableNumber(savedTable);
          setIsTableLocked(true);
        }
      } catch {
        // ignore
      }
    }
  }, [isCashierRoute]);

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return LEGEND_MENU.filter((item) => {
      const matchCat = selectedCategory === 'semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart summary
  const totalItems = cart.reduce((acc, c) => acc + c.quantity, 0);
  const totalPrice = cart.reduce((acc, c) => acc + c.menu.price * c.quantity, 0);

  // Trigger add item
  const handleInitiateAdd = (item: MenuItem) => {
    if (item.options && item.options.length > 0) {
      setConfiguringItem(item);
      setChosenOption(item.options[0]);
      setItemNotes('');
    } else {
      addToCartDirect(item);
    }
  };

  const addToCartDirect = (item: MenuItem, option?: string, notes?: string) => {
    const cartId = `${item.id}-${option || 'def'}-${notes || ''}`;
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.cartId === cartId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          cartId,
          menu: item,
          quantity: 1,
          selectedOption: option,
          notes,
        },
      ];
    });
    showToast(`+1 ${item.name} ditambahkan`);
  };

  const handleConfirmConfiguredItem = () => {
    if (!configuringItem) return;
    addToCartDirect(configuringItem, chosenOption, itemNotes);
    setConfiguringItem(null);
  };

  // Decrement or remove
  const handleDecrementCart = (cartId: string) => {
    setCart((prev) => {
      const target = prev.find((c) => c.cartId === cartId);
      if (!target) return prev;
      if (target.quantity <= 1) {
        return prev.filter((c) => c.cartId !== cartId);
      }
      return prev.map((c) =>
        c.cartId === cartId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  // Increment
  const handleIncrementCart = (cartId: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c
      )
    );
  };

  // Remove
  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  // Submit Order
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Verify customer identity and email for receipt
    if (!customerName.trim() || !customerEmail.trim()) {
      setIsCustomerProfileModalOpen(true);
      showToast('⚠️ Mohon lengkapi nama pemesan dan email untuk struk pembayaran terlebih dahulu.');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;

    const orderData: PlacedOrder = {
      orderNumber: `#LEGEND-${Math.floor(100 + Math.random() * 900)}`,
      tableNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      items: [...cart],
      total: totalPrice,
      time: timeStr,
      paymentMethod: paymentMethod === 'qris' ? 'QRIS Online' : 'Bayar di Kasir',
      notes: orderNotes.trim() || undefined,
    };

    // Synchronize into centralized OrderStore for live Cashier POS & Kitchen Display
    OrderStore.addOrder({
      orderNumber: orderData.orderNumber,
      tableNumber: orderData.tableNumber,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      items: orderData.items,
      total: orderData.total,
      time: orderData.time,
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes,
    });

    setLastOrder(orderData);
    setReceiptToView(orderData);
    setCart([]);
    setOrderNotes('');
    setIsCartOpen(false);
    setIsSuccessModalOpen(true);
  };

  // Dedicated Cashier & Kitchen POS Routing
  if (isCashierRoute) {
    if (!staffRole) {
      return (
        <StaffLoginScreen
          onLoginSuccess={handleStaffLoginSuccess}
          onBackToCustomer={handleBackToCustomerFromStaff}
        />
      );
    }

    if (staffRole === 'superadmin') {
      return (
        <SuperAdminDashboard
          onBackToCustomer={handleBackToCustomerFromStaff}
          onLogout={handleStaffLogout}
        />
      );
    }

    return (
      <CashierPOS
        onBackToCustomer={handleBackToCustomerFromStaff}
        onLogout={handleStaffLogout}
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
      } flex justify-center selection:bg-amber-500 selection:text-neutral-950 font-sans transition-colors duration-200`}
    >
      {/* App Container - Responsive Frame */}
      <div
        className={`w-full max-w-lg ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        } border-x min-h-screen flex flex-col pb-28 shadow-2xl relative transition-colors duration-200`}
      >
        {/* Top Header Lounge Style */}
        <header
          className={`sticky top-0 z-30 ${
            isDark ? 'bg-neutral-900/95 border-amber-500/20' : 'bg-white/95 border-amber-500/30'
          } backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors duration-200`}
        >
          <div>
            <button
              type="button"
              onClick={handleOpenStaffLogin}
              className="flex items-center gap-1.5 cursor-pointer select-none active:opacity-75 transition-opacity text-left bg-transparent border-none p-0 focus:outline-none"
              title="Klik untuk membuka Login Kasir / Super Admin"
            >
              <span className="p-1 rounded bg-amber-500/20 text-amber-500">
                <Music className="w-3.5 h-3.5" />
              </span>
              <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 uppercase font-serif">
                LEGEND
              </h1>
              <span className="text-[10px] text-amber-500 font-medium tracking-widest uppercase">
                RESTO & LOUNGE
              </span>
            </button>
            {isTableLocked ? (
              <div
                className="flex items-center gap-1.5 mt-0.5"
                title="Nomor meja dan nama pemesan terkunci otomatis dari hasil scan QR"
              >
                <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Pesanan:</span>
                <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-lg shadow-inner">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>{tableNumber}</span>
                  {customerName && (
                    <span className={`font-semibold truncate max-w-[85px] sm:max-w-[130px] ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      · {customerName}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className={`text-xs flex items-center gap-1 mt-0.5 transition-colors cursor-pointer text-left bg-transparent border-none p-0 focus:outline-none ${
                  isDark ? 'text-neutral-400 hover:text-amber-300' : 'text-neutral-600 hover:text-amber-600'
                }`}
                title="Klik untuk memilih nomor meja"
              >
                <span>Pesanan:</span>
                <strong className="text-amber-500 underline font-semibold">
                  {tableNumber}
                </strong>
                <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>· Ubah</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Global Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border-neutral-700/80'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-amber-600 border-neutral-300'
              }`}
              title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            </button>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 border-neutral-700/80'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-amber-600 hover:text-amber-700 border-neutral-300'
              }`}
              title="Pindai QR meja baru dengan kamera ponsel"
            >
              <Camera className="w-4 h-4 stroke-[2]" />
              <span className="text-[11px] font-bold hidden xs:inline sm:inline">Pindah Meja</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
              aria-label="Lihat Keranjang"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 bg-neutral-950 text-amber-400 border border-amber-500 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </header>

        {/* Dynamic Popular & Most Ordered Recommendations below header */}
        <PopularRecommendations
          allOrders={allOrders}
          cart={cart}
          onAddToCart={handleInitiateAdd}
          formatRupiah={formatRupiah}
        />

        {/* Hero Welcome Card with Gold Lounge Trim */}
        <div
          className={`mx-4 mt-3 p-3.5 rounded-2xl border flex items-start gap-3 shadow-inner transition-colors duration-200 ${
            isDark
              ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-amber-500/30'
              : 'bg-gradient-to-br from-amber-50 to-orange-50/60 border-amber-500/30 shadow-xs'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
            {isTableLocked ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="text-xs leading-relaxed flex-1">
            <p className="font-bold text-amber-500">
              {isTableLocked && customerName
                ? `Selamat Datang, ${customerName}! (${tableNumber})`
                : isTableLocked
                ? `Pesanan Terverifikasi untuk ${tableNumber}`
                : "Menu Resmi Legend Resto 'N Music Lounge"}
            </p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isTableLocked && customerEmail
                ? `Nomor meja & pemesan otomatis tercatat (terkunci). Struk digital dikirim ke: ${customerEmail}.`
                : isTableLocked
                ? `Nomor meja terkunci otomatis sesuai barcode QR di meja Anda. Silakan isi data pemesan untuk struk.`
                : 'Pilihan protein olahan kambing, iga sapi slow-cooked, aneka nasi & mie wok-hei, snack, dan minuman segar.'}
            </p>

            {isTableLocked && (
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/40 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>Pindah Meja? Buka Kamera & Scan Meja Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Order Tracker for This Table (Pelacak Status Pesanan Meja) */}
        <AnimatePresence>
          {activeTableOrder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-4 mt-3 rounded-2xl p-3.5 shadow-lg space-y-3 relative overflow-hidden border transition-colors ${
                isDark
                  ? 'bg-neutral-900 border-amber-500/50 shadow-amber-500/5'
                  : 'bg-white border-amber-500/60 shadow-neutral-200/80 text-neutral-900'
              }`}
            >
              <div className={`flex items-center justify-between pb-2 border-b gap-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-xs font-black text-amber-500 truncate">
                    Pesanan {activeTableOrder.tableNumber}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 font-bold hidden xs:inline">
                    {activeTableOrder.orderNumber}
                  </span>
                  {activeTableOrders.length > 1 && (
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[9px] font-bold">
                      {activeTableOrders.length} Tiket Aktif
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Sound mute toggle button */}
                  <button
                    type="button"
                    onClick={() => setIsSoundMuted(!isSoundMuted)}
                    className={`p-1 rounded-lg border text-[10px] flex items-center transition-colors ${
                      !isSoundMuted
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                    }`}
                    title={!isSoundMuted ? 'Notifikasi suara aktif' : 'Notifikasi suara dimatikan'}
                  >
                    {!isSoundMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* Test Chime Button */}
                  <button
                    type="button"
                    onClick={() => playCustomerReadyChime(activeTableOrder.tableNumber)}
                    className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30 flex items-center gap-1 active:scale-95 transition-all"
                    title="Uji coba bunyikan notifikasi suara bel 'Siap Diantar'"
                  >
                    <Bell className="w-3 h-3 text-amber-400" />
                    <span>Tes Bel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedActiveOrderDetails(activeTableOrder)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline ml-1"
                  >
                    Menu ({activeTableOrder.items.length})
                  </button>
                </div>
              </div>

              {/* Multi-Order Ticket Tabs for this Table */}
              {activeTableOrders.length > 1 && (
                <div className={`p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border ${
                  isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
                }`}>
                  <span className="text-[10px] font-bold text-neutral-400 shrink-0 px-1">
                    Pilih Tiket:
                  </span>
                  {activeTableOrders.map((ord, idx) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setActiveOrderTabIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                        ord.id === activeTableOrder.id
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm font-black'
                          : isDark
                          ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                          : 'bg-white text-neutral-600 border-neutral-300 hover:text-neutral-900 shadow-2xs'
                      }`}
                    >
                      {ord.orderNumber} ({ord.status === 'menunggu' ? 'Diterima' : ord.status === 'dimasak' ? 'Dimasak' : 'Siap Saji'})
                    </button>
                  ))}
                </div>
              )}

              {/* Special Animated Banner when Status is 'Siap Diantar' */}
              {activeTableOrder.status === 'siap' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-neutral-900 border-2 border-emerald-500/80 rounded-2xl flex items-center justify-between gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <motion.div
                      animate={{ rotate: [-12, 12, -12, 12, 0], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4 }}
                      className="w-8 h-8 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30"
                    >
                      <Bell className="w-4 h-4 fill-neutral-950 stroke-[2.5]" />
                    </motion.div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-emerald-300 block truncate">
                        🔔 Ting! Pesanan Siap Disajikan!
                      </span>
                      <span className="text-[10px] text-emerald-200/90 block leading-tight">
                        Pelayan sedang membawa nampan makanan ke meja Anda.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => playCustomerReadyChime(activeTableOrder.tableNumber)}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-[10px] font-black shrink-0 transition-colors shadow-md active:scale-95 flex items-center gap-1"
                  >
                    <span>Bunyikan</span>
                    <Bell className="w-3 h-3 fill-neutral-950" />
                  </button>
                </motion.div>
              )}

              {/* 3-Step Stepper Progress Bar */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5 relative">
                  {/* Step 1 */}
                  <div
                    className={`text-center space-y-1 p-2 rounded-xl transition-all ${
                      activeTableOrder.status === 'menunggu'
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-neutral-800/80 text-emerald-400'
                    }`}
                  >
                    <div className="w-6 h-6 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold font-mono">
                      {activeTableOrder.status !== 'menunggu' ? '✓' : '1'}
                    </div>
                    <span className="text-[10px] font-bold block leading-tight">
                      Diterima Kasir
                    </span>
                    <span className="text-[9px] text-neutral-400 block leading-tight">
                      KOT dicetak
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`text-center space-y-1 p-2 rounded-xl transition-all ${
                      activeTableOrder.status === 'dimasak'
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm ring-1 ring-amber-500/30'
                        : activeTableOrder.status === 'siap'
                        ? 'bg-neutral-800/80 text-emerald-400'
                        : 'bg-neutral-900/60 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    <div className="w-6 h-6 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold font-mono">
                      {activeTableOrder.status === 'siap' ? '✓' : '2'}
                    </div>
                    <span className="text-[10px] font-bold block leading-tight">
                      Dimasak Koki
                    </span>
                    <span className="text-[9px] text-neutral-400 block leading-tight">
                      Di dapur
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`text-center space-y-1 p-2 rounded-xl transition-all ${
                      activeTableOrder.status === 'siap'
                        ? 'bg-emerald-500/25 border-2 border-emerald-500 text-emerald-300 shadow-md ring-2 ring-emerald-500/30 animate-pulse'
                        : 'bg-neutral-900/60 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    <div className="w-6 h-6 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold font-mono">
                      {activeTableOrder.status === 'siap' ? '🔔' : '3'}
                    </div>
                    <span className="text-[10px] font-black block leading-tight">
                      Siap Diantar
                    </span>
                    <span className="text-[9px] text-neutral-300 block leading-tight">
                      Ke meja Anda
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-950/70 rounded-xl border border-neutral-800 text-[11px] text-neutral-300 flex items-start gap-2">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {activeTableOrder.status === 'menunggu' &&
                      'Kasir telah menerima pesanan dan mencetak lembar tiket KOT. Koki sedang menyiapkan bahan.'}
                    {activeTableOrder.status === 'dimasak' &&
                      'Koki sedang meracik pesanan Anda di dapur. Pelayan akan mengantar begitu matang.'}
                    {activeTableOrder.status === 'siap' &&
                      'Makanan telah selesai dimasak! Pelayan sedang membawa nampan hidangan menuju meja Anda.'}
                  </p>
                </div>

                {activeTableOrder.notes && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Catatan / Request Khusus Seluruh Pesanan:</span>
                    </div>
                    <p className="text-amber-100 italic pl-5 text-[11px] leading-relaxed">
                      "{activeTableOrder.notes}"
                    </p>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Rating Prompt Card (Saat pesanan selesai & lunas) */}
        <AnimatePresence>
          {!activeTableOrder && finishedTableOrder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-3 bg-neutral-900 border border-amber-500/40 rounded-2xl p-3.5 shadow-md space-y-2 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-300 block">
                      {finishedTableOrder.rating
                        ? `Ulasan Anda (${finishedTableOrder.tableNumber})`
                        : `Pesanan Selesai · ${finishedTableOrder.tableNumber}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {finishedTableOrder.orderNumber} · Lunas ({finishedTableOrder.paymentMethod})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRatingModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-black rounded-xl transition-all shadow-xs shrink-0"
                >
                  {finishedTableOrder.rating ? 'Ubah Rating' : 'Beri Ulasan ⭐'}
                </button>
              </div>

              {finishedTableOrder.rating ? (
                <div className="pt-1.5 border-t border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < finishedTableOrder.rating!.stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-amber-300">
                      {finishedTableOrder.rating.stars}.0 / 5.0
                    </span>
                  </div>
                  {finishedTableOrder.rating.feedback && (
                    <p className="text-[11px] text-neutral-300 italic bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/80">
                      "{finishedTableOrder.rating.feedback}"
                    </p>
                  )}
                  {finishedTableOrder.rating.aspects && finishedTableOrder.rating.aspects.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {finishedTableOrder.rating.aspects.map((asp, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-300"
                        >
                          ✓ {asp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 pt-1 leading-relaxed">
                  Bagikan kepuasan kuliner & suasana musik Anda di Legend Lounge. Ulasan Anda membantu kami mengevaluasi layanan resto.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sate kambing, iga bakar, jus, indomie..."
              className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl focus:outline-none transition-all ${
                isDark
                  ? 'text-neutral-200 bg-neutral-800/80 hover:bg-neutral-800 focus:bg-neutral-800 border border-neutral-700/80 focus:border-amber-500/80 placeholder:text-neutral-500'
                  : 'text-neutral-900 bg-neutral-100 hover:bg-neutral-100 focus:bg-white border border-neutral-300 focus:border-amber-500 placeholder:text-neutral-400'
              }`}
            />
          </div>
        </div>

        {/* Category Horizontal Filter with Framer Motion Layout Animation */}
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-neutral-950 font-bold'
                    : isDark
                    ? 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                    className="absolute inset-0 bg-amber-500 rounded-xl shadow-md shadow-amber-500/25"
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Menu Items List with Smooth Transition */}
        <main className="px-4 pt-1 flex-1 space-y-3">
          <div className={`text-xs flex justify-between items-center py-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            <span>Daftar Menu ({filteredMenu.length})</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-amber-500 hover:underline text-[11px] cursor-pointer"
              >
                Reset pencarian
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${searchQuery}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-3"
            >
              {filteredMenu.length === 0 ? (
                <div className="py-16 text-center text-neutral-500 space-y-2">
                  <UtensilsCrossed className="w-10 h-10 mx-auto stroke-1 text-neutral-600" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    Menu tidak ditemukan
                  </p>
                  <p className="text-xs text-neutral-500">
                    Silakan coba kata kunci lain atau pilih kategori Semua Menu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMenu.map((item, idx) => {
                    const totalInCartForThisItem = cart
                      .filter((c) => c.menu.id === item.id)
                      .reduce((sum, c) => sum + c.quantity, 0);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                        className={`p-3.5 rounded-2xl border flex gap-3.5 items-start transition-colors ${
                          isDark
                            ? 'bg-neutral-800/60 border-neutral-800 hover:border-amber-500/40 shadow-xs'
                            : 'bg-white border-neutral-200 shadow-xs hover:border-amber-500/40 text-neutral-900'
                        }`}
                      >
                        {/* Media Thumbnail or Category Badge */}
                        <div
                          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center ${
                            isDark ? 'bg-neutral-800 border-neutral-700/50' : 'bg-neutral-100 border-neutral-200'
                          }`}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <Music className="w-6 h-6 text-amber-500/40 mx-auto mb-1 stroke-1" />
                              <span className="text-[9px] uppercase tracking-wider text-amber-500/70 font-semibold block truncate">
                                {item.category.replace('_', ' ')}
                              </span>
                            </div>
                          )}

                          {item.isPopular && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-neutral-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-neutral-950" />
                              Top
                            </span>
                          )}

                          {soldOutItems.includes(item.id) && (
                            <span className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center text-[10px] font-black text-rose-400 border border-rose-500/40 uppercase tracking-wider">
                              Habis
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                          <div>
                            {item.subCategory && (
                              <span className="text-[10px] text-amber-500 font-medium uppercase tracking-wider block">
                                {item.subCategory}
                              </span>
                            )}
                            <h2 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                              {item.name}
                            </h2>
                            <p className={`text-[11px] line-clamp-2 mt-0.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              {item.description}
                            </p>
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between pt-2 mt-auto">
                            <span className="text-xs font-bold font-mono text-amber-500 tabular-nums">
                              {formatRupiah(item.price)}
                            </span>

                            {soldOutItems.includes(item.id) ? (
                              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-not-allowed ${
                                isDark ? 'bg-neutral-800 text-neutral-500 border-neutral-700/80' : 'bg-neutral-100 text-neutral-400 border-neutral-300'
                              }`}>
                                Stok Habis
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleInitiateAdd(item)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-transform active:scale-95 shadow-sm shadow-amber-500/20 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Pesan</span>
                                {totalInCartForThisItem > 0 && (
                                  <span className="ml-1 px-1.5 py-0.2 bg-neutral-950 text-amber-400 rounded-full text-[10px]">
                                    {totalInCartForThisItem}
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Discrete Footer for Customers with Staff Portal Link */}
        <footer className={`mx-4 mt-6 pt-6 pb-20 border-t text-center text-xs space-y-2 transition-colors ${
          isDark ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-500'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-amber-500">
            <Music className="w-3.5 h-3.5" />
            <span className="font-bold tracking-widest uppercase text-[11px]">
              Legend Resto 'N Music Lounge
            </span>
          </div>
          <p className="text-[11px]">
            Sistem Pemesanan Meja Mandiri · Pengalaman Kuliner & Musik Live
          </p>
        </footer>

        {/* Floating Cart Button Animated */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed bottom-0 left-0 right-0 p-3 flex justify-center z-40 transition-colors ${
                isDark
                  ? 'bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent'
                  : 'bg-gradient-to-t from-neutral-100 via-neutral-100/95 to-transparent'
              }`}
            >
              <div className="w-full max-w-lg">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="w-full p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-between active:scale-[0.99] transition-all font-bold"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-neutral-950 text-amber-400 text-xs font-black flex items-center justify-center">
                      {totalItems}
                    </span>
                    <span className="text-xs font-bold tracking-tight">
                      Pesanan {tableNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono tabular-nums">
                      {formatRupiah(totalPrice)}
                    </span>
                    <span className="text-xs bg-neutral-950 text-amber-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                      <span>Lihat</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Option Configuration Modal Animated */}
        <AnimatePresence>
          {configuringItem && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfiguringItem(null)}
                className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`relative w-full max-w-md ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900 shadow-2xl'
                } border rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 z-10 transition-colors`}
              >
                <div className={`flex items-start justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                      {configuringItem.name}
                    </h3>
                    <span className="text-xs text-amber-500 font-mono font-bold">
                      {formatRupiah(configuringItem.price)}
                    </span>
                  </div>
                  <button
                    onClick={() => setConfiguringItem(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Options */}
                {configuringItem.options && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-amber-500">
                      Pilihan Variasi / Masakan:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {configuringItem.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setChosenOption(opt)}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                            chosenOption === opt
                              ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold'
                              : isDark
                              ? 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Catatan Khusus (Opsional):
                  </label>
                  <input
                    type="text"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Contoh: Jangan terlalu pedas, kuah banyak, dll."
                    className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-amber-500 ${
                      isDark
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmConfiguredItem}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Tambahkan ke Pesanan
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Table Selector Modal Animated (Dapat dibuka kapan saja untuk ganti meja / buka kunci) */}
        <AnimatePresence>
          {isTableModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTableModalOpen(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`relative w-full max-w-sm ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900 shadow-2xl'
                } border rounded-3xl p-5 shadow-2xl space-y-4 z-10 transition-colors`}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <div>
                    <h3 className="text-sm font-bold text-amber-500">Pilih / Ganti Nomor Meja</h3>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {isTableLocked ? `Saat ini terverifikasi pada ${tableNumber}` : 'Total 13 meja makan aktif'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTableModalOpen(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isTableLocked && (
                  <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                    isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate font-semibold">Terkunci: {tableNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTableLocked(false);
                        try {
                          sessionStorage.removeItem('legend_scanned_table');
                        } catch {}
                        showToast('Kunci meja dibuka. Anda bebas memilih meja mana saja.');
                      }}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-[10px] shrink-0 transition-colors"
                    >
                      Buka Kunci
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {TABLES.map((tbl) => (
                    <button
                      key={tbl}
                      onClick={() => {
                        setTableNumber(tbl);
                        setIsTableLocked(true);
                        try {
                          sessionStorage.setItem('legend_scanned_table', tbl);
                        } catch {}
                        setIsTableModalOpen(false);
                        showToast(`Nomor meja beralih ke ${tbl}!`);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                        tbl === tableNumber
                          ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400 shadow-md font-black'
                          : isDark
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200'
                      }`}
                    >
                      {tbl}
                    </button>
                  ))}
                </div>

                {/* Quick Camera Scan shortcut */}
                <div className={`pt-3 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTableModalOpen(false);
                      setIsScannerOpen(true);
                    }}
                    className={`font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark ? 'text-neutral-400 hover:text-amber-300' : 'text-neutral-600 hover:text-amber-600'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pindai QR Meja dengan Kamera</span>
                  </button>
                  <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    13 Meja Tersedia
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart Drawer / Bottom Sheet Animated */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              />
              <motion.div
                initial={{ y: '100%', opacity: 0.8 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0.8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className={`relative w-full max-w-lg ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900 shadow-2xl'
                } border-t sm:border rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden z-10 transition-colors`}
              >
                {/* Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between transition-colors ${
                    isDark ? 'border-neutral-800 bg-neutral-900/90' : 'border-neutral-200 bg-white/95 text-neutral-900'
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-bold text-amber-500">
                      Rincian Pesanan
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {tableNumber} · {totalItems} Menu Dipilih
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/40 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-neutral-500 space-y-2">
                      <ShoppingBag className="w-10 h-10 mx-auto stroke-1 text-neutral-600" />
                      <p className={`text-xs font-semibold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Keranjang masih kosong
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {cart.map((ci) => (
                        <motion.div
                          key={ci.cartId}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.2 }}
                          className={`p-3 border rounded-xl space-y-2 transition-colors ${
                            isDark ? 'border-neutral-800 bg-neutral-800/40' : 'border-neutral-200 bg-neutral-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`text-xs font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                                {ci.menu.name}
                              </h4>
                              {ci.selectedOption && (
                                <span className="text-[10px] text-amber-500 font-semibold block">
                                  Varian: {ci.selectedOption}
                                </span>
                              )}
                              <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {formatRupiah(ci.menu.price)}
                              </span>
                            </div>
                            <span className="text-xs font-bold font-mono text-amber-500">
                              {formatRupiah(ci.menu.price * ci.quantity)}
                            </span>
                          </div>

                          {ci.notes && (
                            <p
                              className={`text-[10px] italic px-2 py-1 rounded ${
                                isDark ? 'text-neutral-400 bg-neutral-800/80' : 'text-neutral-600 bg-neutral-200/60'
                              }`}
                            >
                              Catatan: {ci.notes}
                            </p>
                          )}

                          {/* Stepper */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(ci.cartId)}
                              className="text-[11px] text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDecrementCart(ci.cartId)}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                                  isDark
                                    ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                                    : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`text-xs font-bold w-4 text-center tabular-nums ${
                                  isDark ? 'text-neutral-100' : 'text-neutral-900'
                                }`}
                              >
                                {ci.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleIncrementCart(ci.cartId)}
                                className="w-6 h-6 rounded bg-amber-500 text-neutral-950 font-bold flex items-center justify-center hover:bg-amber-400 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                  {/* Data Pemesan & Nomor Meja (Tercatat Otomatis & Terkunci Saat Memesan) */}
                  {cart.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                        isDark ? 'bg-neutral-800/60 border-amber-500/30' : 'bg-amber-50/80 border-amber-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Data Pemesan Terkunci</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Otomatis Tercatat</span>
                          </span>
                        </div>

                        {/* Nomor Meja & Nama Pemesan (Readonly & Locked) */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              Nomor Meja
                            </label>
                            <div
                              title="Nomor meja terkunci otomatis dari scan"
                              className={`px-3 py-2 rounded-xl border font-bold flex items-center justify-between select-none ${
                                isDark ? 'bg-neutral-900 border-neutral-700 text-amber-400' : 'bg-white border-neutral-300 text-neutral-900'
                              }`}
                            >
                              <span>{tableNumber}</span>
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </div>
                          </div>

                          <div>
                            <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              Nama Pemesan
                            </label>
                            {customerName ? (
                              <div
                                title="Nama pemesan terkunci dari hasil scan"
                                className={`px-3 py-2 rounded-xl border font-bold flex items-center justify-between select-none ${
                                  isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
                                }`}
                              >
                                <span className="truncate">{customerName}</span>
                                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsCustomerProfileModalOpen(true)}
                                className="w-full px-3 py-2 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-400 font-bold text-xs hover:bg-amber-500/20 text-left cursor-pointer flex items-center justify-between"
                              >
                                <span>+ Lengkapi Nama</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Email Penerima Struk Digital */}
                        <div>
                          <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Email Penerima Struk Digital
                          </label>
                          {customerEmail ? (
                            <div
                              title="Email struk terkunci"
                              className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center justify-between select-none ${
                                isDark ? 'bg-neutral-900 border-neutral-700 text-amber-300' : 'bg-white border-neutral-300 text-neutral-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="truncate">{customerEmail}</span>
                              </div>
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsCustomerProfileModalOpen(true)}
                              className="w-full px-3 py-2 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-400 font-bold text-xs hover:bg-amber-500/20 text-left cursor-pointer flex items-center justify-between"
                            >
                              <span>+ Lengkapi Email Struk</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className={`text-[10px] leading-relaxed italic ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          🔒 Nomor meja dan nama pemesan sudah otomatis tercatat dari scan QR dan tidak dapat diubah saat ingin memesan demi akurasi pengantaran pesanan.
                        </p>
                      </div>

                      {/* Catatan / Request Khusus Seluruh Pesanan (Global Delivery Notes) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                            <span>Catatan & Permintaan Seluruh Pesanan:</span>
                          </label>
                          <span className="text-[10px] text-amber-500 font-medium">Opsional</span>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Tolong antar bersamaan, sambal dipisah, minta piring sendok ekstra, es batu dibelakangkan..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-amber-500 resize-none transition-colors ${
                            isDark
                              ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
                              : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                          }`}
                        />
                        {/* Preset tags for fast tapping */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {[
                            'Antar bersamaan',
                            'Sambal dipisah',
                            'Minta piring & sendok ekstra',
                            'Sedikit es batu',
                            'Jangan terlalu asin',
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setOrderNotes((prev) => {
                                  if (!prev.trim()) return chip;
                                  if (prev.includes(chip)) return prev;
                                  return `${prev}, ${chip}`;
                                });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-400 hover:text-amber-300'
                                  : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-600 hover:text-amber-600'
                              }`}
                            >
                              + {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                          Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('kasir')}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                              paymentMethod === 'kasir'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-500 font-bold shadow-xs'
                                : isDark
                                ? 'border-neutral-800 bg-neutral-800 text-neutral-400 hover:bg-neutral-750'
                                : 'border-neutral-300 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            Bayar di Kasir
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('qris')}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                              paymentMethod === 'qris'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-500 font-bold shadow-xs'
                                : isDark
                                ? 'border-neutral-800 bg-neutral-800 text-neutral-400 hover:bg-neutral-750'
                                : 'border-neutral-300 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            QRIS (Online)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Checkout */}
                {cart.length > 0 && (
                  <div
                    className={`p-4 border-t space-y-2 transition-colors ${
                      isDark ? 'border-neutral-800 bg-neutral-900/90' : 'border-neutral-200 bg-white/95'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Total Pembayaran:</span>
                      <span className="text-base font-bold font-mono text-amber-500 tabular-nums">
                        {formatRupiah(totalPrice)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-neutral-950 text-xs font-bold rounded-xl shadow-md transition-all uppercase tracking-wide cursor-pointer"
                    >
                      Kirim Pesanan ke Dapur
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Modal Animated */}
        <AnimatePresence>
          {isSuccessModalOpen && lastOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 25 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 24, stiffness: 340 }}
                className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 z-10 border transition-colors ${
                  isDark ? 'bg-neutral-900 border-amber-500/40 text-neutral-100' : 'bg-white border-amber-500/50 text-neutral-900'
                }`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  className="w-14 h-14 bg-amber-500/20 text-amber-500 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>

                <div>
                  <h3 className="text-base font-bold text-amber-500">
                    Pesanan Berhasil Dikirim!
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Dapur Legend Resto sedang menyiapkan pesanan untuk{' '}
                    <strong className={isDark ? 'text-neutral-200' : 'text-neutral-900'}>{lastOrder.tableNumber}</strong>.
                  </p>
                </div>

                {/* Rincian Ringkas */}
                <div
                  className={`p-3.5 rounded-2xl text-left font-mono text-xs space-y-1.5 border transition-colors ${
                    isDark ? 'bg-neutral-800/80 border-neutral-700/80' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className={`flex justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    <span>No. Pesanan:</span>
                    <span className="font-bold text-amber-500">{lastOrder.orderNumber}</span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    <span>Pemesan:</span>
                    <span className={isDark ? 'text-neutral-200' : 'text-neutral-900'}>{lastOrder.customerName}</span>
                  </div>
                  {lastOrder.customerEmail && (
                    <div className={`flex justify-between items-center text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <span>Email Struk:</span>
                      <span className="font-semibold text-amber-400 font-mono truncate max-w-[170px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{lastOrder.customerEmail}</span>
                      </span>
                    </div>
                  )}
                  <div className={`flex justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    <span>Metode:</span>
                    <span className={isDark ? 'text-neutral-200' : 'text-neutral-900'}>{lastOrder.paymentMethod}</span>
                  </div>
                  <div className={`border-t border-dashed pt-1.5 flex justify-between font-bold ${
                    isDark ? 'border-neutral-600 text-neutral-100' : 'border-neutral-300 text-neutral-900'
                  }`}>
                    <span>Total:</span>
                    <span className="tabular-nums font-mono text-amber-500">
                      {formatRupiah(lastOrder.total)}
                    </span>
                  </div>
                </div>

                {/* E-Receipt Delivery Notice */}
                {lastOrder.customerEmail && (
                  <div className={`p-3 rounded-2xl border text-left text-xs space-y-1 ${
                    isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Struk Pembayaran Digital Dikirimkan</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      E-receipt rincian transaksi telah otomatis dikirimkan ke <strong>{lastOrder.customerEmail}</strong>.
                    </p>
                  </div>
                )}

                {lastOrder.notes && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-500 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Catatan Khusus Pesanan:</span>
                    </div>
                    <p className={`italic pl-5 text-[11px] leading-relaxed ${isDark ? 'text-amber-100' : 'text-neutral-800'}`}>
                      "{lastOrder.notes}"
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptToView(lastOrder);
                      setIsCustomerReceiptModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Lihat & Cetak E-Receipt Struk</span>
                  </button>

                  <button
                    onClick={() => setIsSuccessModalOpen(false)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Pesan Menu Lainnya
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Active Order Details Modal for Customer */}
        <AnimatePresence>
          {selectedActiveOrderDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedActiveOrderDetails(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`relative w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 z-10 border transition-colors ${
                  isDark ? 'bg-neutral-900 border-amber-500/50 text-neutral-100' : 'bg-white border-amber-500/50 text-neutral-900 shadow-2xl'
                }`}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <div>
                    <h3 className="text-xs font-bold text-amber-500">
                      Rincian Pesanan {selectedActiveOrderDetails.tableNumber}
                    </h3>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {selectedActiveOrderDetails.orderNumber} · {selectedActiveOrderDetails.time}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedActiveOrderDetails(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Items List */}
                <div className={`max-h-60 overflow-y-auto space-y-2 divide-y text-xs ${
                  isDark ? 'divide-neutral-800' : 'divide-neutral-200'
                }`}>
                  {selectedActiveOrderDetails.items.map((it, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-[10px]">
                            {it.quantity}x
                          </span>
                          <span className={`font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>{it.menu.name}</span>
                        </div>
                        {it.selectedOption && (
                          <span className="text-[10px] text-amber-500 font-medium block ml-6">
                            Varian: {it.selectedOption}
                          </span>
                        )}
                        {it.notes && (
                          <span
                            className={`text-[10px] italic block ml-6 px-1.5 py-0.5 rounded mt-0.5 ${
                              isDark ? 'text-neutral-400 bg-neutral-800/80' : 'text-neutral-600 bg-neutral-100'
                            }`}
                          >
                            Catatan: "{it.notes}"
                          </span>
                        )}
                      </div>
                      <span className={`font-mono font-semibold text-[11px] shrink-0 ${
                        isDark ? 'text-neutral-400' : 'text-neutral-600'
                      }`}>
                        {formatRupiah(it.menu.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total & Info */}
                <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Total Pembayaran:</span>
                    <span className="font-bold font-mono text-amber-500 text-sm">
                      {formatRupiah(selectedActiveOrderDetails.total)}
                    </span>
                  </div>

                  {selectedActiveOrderDetails.notes && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-500 text-[11px]">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Catatan / Request Khusus Seluruh Pesanan:</span>
                      </div>
                      <p className={`italic pl-5 text-[11px] leading-relaxed ${isDark ? 'text-amber-100' : 'text-neutral-800'}`}>
                        "{selectedActiveOrderDetails.notes}"
                      </p>
                    </div>
                  )}

                  {/* Data Pemesan & Email Struk Terdaftar */}
                  <div className={`p-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Pemesan: <strong className={isDark ? 'text-white' : 'text-neutral-900'}>{selectedActiveOrderDetails.customerName}</strong></span>
                    </div>
                    {selectedActiveOrderDetails.customerEmail && (
                      <span className="text-[10px] text-amber-400 font-mono truncate max-w-[170px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                        {selectedActiveOrderDetails.customerEmail}
                      </span>
                    )}
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-[10px] leading-relaxed ${
                      isDark ? 'bg-neutral-950/80 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    💡 <strong>Tips Validasi:</strong> Koki menyiapkan pesanan menggunakan tiket KOT. Saat pelayan mengantar hidangan, nomor meja pada nampan akan dicocokkan dengan Meja Anda.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptToView(selectedActiveOrderDetails);
                      setIsCustomerReceiptModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lihat E-Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedActiveOrderDetails(null)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Special Food Ready Alert Popup Modal (When Status changes to 'Siap Diantar') */}
        <AnimatePresence>
          {showReadyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReadyModal(null)}
                className="fixed inset-0 bg-black/85 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                className="relative w-full max-w-sm bg-neutral-900 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl space-y-4 z-10 text-center overflow-hidden"
              >
                {/* Glow Backdrop */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* Animated Ringing Bell Icon */}
                <motion.div
                  animate={{ rotate: [-15, 15, -15, 15, 0], scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 flex items-center justify-center shadow-lg shadow-emerald-500/40"
                >
                  <Bell className="w-8 h-8 fill-neutral-950 stroke-[2.5]" />
                </motion.div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    NOTIFIKASI SAJI RESTO
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5 font-serif">
                    Pesanan Anda Siap Disajikan!
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1">
                    Hidangan untuk <strong className="text-amber-300 font-bold">{showReadyModal.tableNumber}</strong> ({showReadyModal.orderNumber}) telah selesai dimasak oleh Koki.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950/70 border border-emerald-500/30 rounded-2xl text-left space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pelayan Sedang Mengantar Makanan</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Pelayan kami sedang membawa nampan berisi masakan menuju meja Anda. Cocokkan nomor meja pada kertas tiket nampan saat pesanan tiba.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReadyModal(null)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    Siap Menyambut Pelayan!
                  </button>

                  <button
                    type="button"
                    onClick={() => playCustomerReadyChime(showReadyModal.tableNumber)}
                    className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-[11px] font-bold rounded-xl border border-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Bunyikan Bel Lagi 🔔</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Customer Satisfaction Rating Modal (Bintang 1-5) */}
        <AnimatePresence>
          {isRatingModalOpen && finishedTableOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRatingModalOpen(false)}
                className="fixed inset-0 bg-black/85 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`relative w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 z-10 border transition-colors ${
                  isDark ? 'bg-neutral-900 border-amber-500/50 text-neutral-100' : 'bg-white border-amber-500/50 text-neutral-900'
                }`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-amber-500">
                        Evaluasi Kepuasan Pelanggan
                      </h3>
                      <p className={`text-[10px] font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {finishedTableOrder.tableNumber} · {finishedTableOrder.orderNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRatingModalOpen(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {ratingSubmittedSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-6 text-center space-y-2"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className={`text-sm font-bold font-serif ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Terima Kasih Banyak!
                    </h4>
                    <p className={`text-xs leading-relaxed px-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      Penilaian Anda sangat berharga bagi tim Legend Resto 'N Music Lounge untuk terus meningkatkan kualitas hidangan & layanan kami.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="space-y-4">
                    {/* 5-Star Interactive Rating */}
                    <div className="text-center space-y-1.5">
                      <label className="text-xs font-bold text-neutral-200 block">
                        Bagaimana kepuasan Anda hari ini?
                      </label>
                      <div className="flex justify-center items-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (ratingHoverStars || ratingStars);
                          return (
                            <button
                              type="button"
                              key={star}
                              onMouseEnter={() => setRatingHoverStars(star)}
                              onMouseLeave={() => setRatingHoverStars(0)}
                              onClick={() => setRatingStars(star)}
                              className="p-1 text-amber-400 hover:scale-125 transition-transform active:scale-95"
                              title={`${star} Bintang`}
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${
                                  isFilled
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                    : 'text-neutral-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 block font-mono">
                        {ratingStars === 1 && '⭐ Sangat Kurang Puas'}
                        {ratingStars === 2 && '⭐⭐ Kurang Puas'}
                        {ratingStars === 3 && '⭐⭐⭐ Cukup Baik'}
                        {ratingStars === 4 && '⭐⭐⭐⭐ Puas & Lezat'}
                        {ratingStars === 5 && '⭐⭐⭐⭐⭐ Luar Biasa Memuaskan!'}
                      </span>
                    </div>

                    {/* Quick Aspect Tags */}
                    <div className="space-y-1.5">
                      <label className={`text-[11px] font-semibold block ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Aspek yang paling memuaskan:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Cita Rasa Masakan',
                          'Kecepatan Saji',
                          'Keramahan Pelayan',
                          'Suasana & Musik',
                          'Kebersihan Resto',
                          'Porsi & Harga Pas',
                        ].map((asp) => {
                          const isSelected = ratingAspects.includes(asp);
                          return (
                            <button
                              type="button"
                              key={asp}
                              onClick={() => handleToggleAspect(asp)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-500 font-bold shadow-xs'
                                  : isDark
                                  ? 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
                                  : 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {asp}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Feedback Comment */}
                    <div className="space-y-1">
                      <label className={`text-[11px] font-semibold block ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Komentar atau saran untuk resto (opsional):
                      </label>
                      <textarea
                        rows={2}
                        value={ratingFeedback}
                        onChange={(e) => setRatingFeedback(e.target.value)}
                        placeholder="Contoh: Sate kambing sangat empuk, bumbu pas, live music lounge asik..."
                        className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none ${
                          isDark
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
                            : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Kirim Penilaian & Ulasan
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>



        {/* Live Camera QR Scanner Modal */}
        <CameraQRScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          currentTable={tableNumber}
        />

        {/* Customer Profile & E-Receipt Registration Modal (After Scan) */}
        <CustomerProfileModal
          isOpen={isCustomerProfileModalOpen}
          tableNumber={tableNumber}
          initialName={customerName}
          initialEmail={customerEmail}
          isDark={isDark}
          onSave={handleSaveCustomerProfile}
          onClose={() => {
            if (customerName.trim() && customerEmail.trim()) {
              setIsCustomerProfileModalOpen(false);
            }
          }}
        />

        {/* Customer Digital E-Receipt Modal */}
        <CustomerReceiptModal
          isOpen={isCustomerReceiptModalOpen}
          order={receiptToView}
          onClose={() => setIsCustomerReceiptModalOpen(false)}
          isDark={isDark}
          formatRupiah={formatRupiah}
        />


        {/* Floating Toast Notification Animated */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-4 left-1/2 z-50 bg-neutral-900/95 border border-amber-500/50 text-neutral-100 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
