import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Printer,
  CheckCircle2,
  Clock,
  Flame,
  Search,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  Coffee,
  Check,
  X,
  Volume2,
  VolumeX,
  CreditCard,
  Banknote,
  Receipt,
  Users,
  Grid,
  Star,
  MessageSquareQuote,
  Copy,
  LogOut,
  Bell,
  BellOff,
  BellRing,
  Crown,
  Sun,
  Moon,
  QrCode,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderStore, StoreOrder, OrderStatus } from '../data/orderStore';
import { TableQRManager } from './TableQRManager';
import { useTheme } from '../utils/theme';
import { printHtmlContent } from '../utils/printHelper';

interface CashierPOSProps {
  onBackToCustomer: () => void;
  onLogout?: () => void;
}

const ALL_TABLES = [
  'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
  'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10',
  'Meja 11', 'Meja 12', 'Meja 13',
];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

// Realistic dual-stage restaurant service bell chime (Dining Service Ding-Dong)
function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Richer overtones for bell resonance
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(gainVal, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // First strike: High crystal bell (E6 ~1318 Hz + overtone B5 ~988 Hz)
    playTone(1318.5, now, 0.45, 0.35);
    playTone(987.8, now, 0.5, 0.2);

    // Second strike: Warm reverberating follow-up (A5 ~880 Hz + C#6 ~1108 Hz + low body)
    playTone(1108.7, now + 0.14, 0.65, 0.4);
    playTone(880.0, now + 0.14, 0.8, 0.25);
    playTone(440.0, now + 0.14, 0.9, 0.15);
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}

export const CashierPOS: React.FC<CashierPOSProps> = ({
  onBackToCustomer,
  onLogout,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [orders, setOrders] = useState<StoreOrder[]>(() => OrderStore.getOrders());
  const [activeTab, setActiveTab] = useState<'antrean' | 'denah' | 'laporan' | 'qrcodes'>('antrean');
  const [statusFilter, setStatusFilter] = useState<'semua' | OrderStatus>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<StoreOrder | null>(null);
  const [selectedKotOrder, setSelectedKotOrder] = useState<StoreOrder | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Browser Notification & Alert States
  const [browserNotificationPerm, setBrowserNotificationPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<StoreOrder | null>(null);
  const bannerTimerRef = useRef<any>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const notifiedOrderIdsRef = useRef<Set<string>>(new Set());

  const triggerNewOrderNotification = (newOrder: StoreOrder) => {
    if (notifiedOrderIdsRef.current.has(newOrder.id)) return;
    notifiedOrderIdsRef.current.add(newOrder.id);
    knownOrderIdsRef.current.add(newOrder.id);

    // 1. Play kitchen bell chime
    if (soundEnabledRef.current) {
      playOrderChime();
    }

    // 2. Trigger browser notification if allowed
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const notif = new Notification(`🔔 Pesanan Baru: ${newOrder.tableNumber}!`, {
          body: `${newOrder.customerName} memesan ${newOrder.items.length} menu (${formatRupiah(newOrder.total)}). Pembayaran: ${newOrder.paymentMethod}`,
          tag: `legend-order-${newOrder.id}`,
          icon: '/favicon.ico',
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }

    // 3. In-app floating popup banner
    setIncomingOrderAlert(newOrder);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setIncomingOrderAlert(null);
    }, 8000);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser ini tidak mendukung HTML5 Web Notification.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserNotificationPerm(perm);
      if (perm === 'granted') {
        playOrderChime();
        try {
          const testNotif = new Notification('🔔 Notifikasi Kasir Legend Aktif!', {
            body: 'Kasir akan menerima notifikasi desktop setiap kali ada pesanan baru masuk dari Meja 01 - 13.',
            icon: '/favicon.ico',
          });
          testNotif.onclick = () => {
            window.focus();
            testNotif.close();
          };
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Request notification permission failed:', e);
    }
  };

  const handleCopyCashierLink = () => {
    try {
      const url = `${window.location.origin}/?mode=kasir`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
          ' · ' +
          now.toLocaleTimeString('id-ID') +
          ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time order store monitoring: listen to onNewOrder and general subscribe
  useEffect(() => {
    // Mark existing orders so initial mount doesn't re-trigger bell
    const currentOrders = OrderStore.getOrders();
    currentOrders.forEach((o) => {
      knownOrderIdsRef.current.add(o.id);
    });

    // 1. Direct new order event listener
    const unsubNewOrder = OrderStore.onNewOrder((newOrder) => {
      triggerNewOrderNotification(newOrder);
      setOrders(OrderStore.getOrders());
    });

    // 2. Storage & broadcast channel sync listener (catches orders from other tabs/devices)
    const unsubSync = OrderStore.subscribe((updatedOrders) => {
      // Detect newly arrived orders with status 'menunggu'
      updatedOrders.forEach((o) => {
        if (!knownOrderIdsRef.current.has(o.id) && o.status === 'menunggu') {
          triggerNewOrderNotification(o);
        }
      });
      setOrders(updatedOrders);
    });

    return () => {
      unsubNewOrder();
      unsubSync();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchStatus = statusFilter === 'semua' || ord.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.tableNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.items.some((it) => it.menu.name.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalOmzet = orders
      .filter((o) => o.status !== 'batal')
      .reduce((sum, o) => sum + o.total, 0);

    const activeOrders = orders.filter((o) => o.status !== 'lunas' && o.status !== 'batal');
    const waitingKitchen = orders.filter((o) => o.status === 'menunggu');

    // Tables occupied
    const occupiedTables = new Set(
      activeOrders.map((o) => o.tableNumber)
    );

    return {
      totalOmzet,
      activeCount: activeOrders.length,
      waitingCount: waitingKitchen.length,
      occupiedCount: occupiedTables.size,
    };
  }, [orders]);

  // Customer satisfaction reviews & statistics
  const ratingsList = useMemo(() => {
    return orders
      .filter((o) => o.rating && o.rating.stars > 0)
      .map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.tableNumber,
        customerName: o.customerName,
        time: o.time,
        rating: o.rating!,
      }));
  }, [orders]);

  const ratingStats = useMemo(() => {
    if (ratingsList.length === 0) {
      return { avg: 0, count: 0, breakdown: [0, 0, 0, 0, 0] };
    }
    const sum = ratingsList.reduce((acc, r) => acc + r.rating.stars, 0);
    const avg = Number((sum / ratingsList.length).toFixed(1));
    const breakdown = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
    ratingsList.forEach((r) => {
      const starIndex = 5 - r.rating.stars;
      if (starIndex >= 0 && starIndex < 5) {
        breakdown[starIndex]++;
      }
    });
    return { avg, count: ratingsList.length, breakdown };
  }, [ratingsList]);

  // Status changers
  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    OrderStore.updateStatus(id, newStatus);
  };

  const handleTogglePaid = (id: string) => {
    OrderStore.togglePaid(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus tiket pesanan ini dari antrean kasir?')) {
      OrderStore.deleteOrder(id);
    }
  };

  // Dedicated thermal print functions with full restaurant info & reliable in-DOM isolation
  const handlePrintReceipt = (order: StoreOrder) => {
    const itemsRows = order.items
      .map(
        (it) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <div style="padding-right: 8px;">
            <span style="font-weight: bold;">${it.quantity}x</span> ${it.menu.name}
            ${it.selectedOption ? `<div style="font-size: 10px; color: #444;">(${it.selectedOption})</div>` : ''}
            ${it.notes ? `<div style="font-size: 10px; color: #555; font-style: italic;">* ${it.notes}</div>` : ''}
          </div>
          <div style="font-weight: bold; white-space: nowrap;">
            ${formatRupiah(it.menu.price * it.quantity)}
          </div>
        </div>
      `
      )
      .join('');

    const html = `
      <div style="width: 100%; max-width: 80mm; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.35; color: #000; padding: 6px; background: #fff;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="font-size: 15px; font-weight: 900; margin: 0; letter-spacing: 1px; text-transform: uppercase;">LEGEND RESTO & LOUNGE</h2>
          <div style="font-size: 10px; margin-top: 2px;">Jl. Utama Lounge No. 88</div>
          <div style="font-size: 10px;">Telp: 0812-3456-7890 · IG: @legendrestolounge</div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Tiket:</span>
            <strong>${order.orderNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Meja:</span>
            <strong>${order.tableNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Pelanggan:</span>
            <span>${order.customerName}</span>
          </div>
          ${
            order.customerEmail
              ? `
          <div style="display: flex; justify-content: space-between;">
            <span>E-Receipt:</span>
            <span>${order.customerEmail}</span>
          </div>
          `
              : ''
          }
          <div style="display: flex; justify-content: space-between;">
            <span>Waktu:</span>
            <span>${order.time}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Metode:</span>
            <span>${order.paymentMethod}</span>
          </div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          ${itemsRows}
        </div>

        ${
          order.notes
            ? `
          <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 10px;">
            <div style="font-weight: bold;">Catatan Khusus Meja:</div>
            <div style="font-style: italic; background: #eee; padding: 4px; border-radius: 4px; margin-top: 2px;">"${order.notes}"</div>
          </div>
        `
            : ''
        }

        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900;">
            <span>TOTAL BAYAR:</span>
            <span>${formatRupiah(order.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 3px;">
            <span>Status Pembayaran:</span>
            <strong>${order.isPaid ? 'LUNAS' : 'MENUNGGU KASIR'}</strong>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; margin-top: 8px;">
          <div style="font-weight: bold;">TERIMA KASIH ATAS KUNJUNGAN ANDA</div>
          <div style="color: #444; margin-top: 2px;">Nikmati santapan & alunan musik di Legend Lounge</div>
        </div>
      </div>
    `;

    printHtmlContent(`Struk_${order.orderNumber}_${order.tableNumber}`, html);
  };

  const handlePrintKOT = (order: StoreOrder) => {
    const kotItems = order.items
      .map(
        (it) => `
        <div style="margin-bottom: 8px; border-bottom: 1px dotted #888; padding-bottom: 4px;">
          <div style="display: flex; align-items: baseline; font-size: 14px; font-weight: 900;">
            <span style="display: inline-block; background: #000; color: #fff; padding: 1px 6px; border-radius: 4px; margin-right: 6px;">${it.quantity}X</span>
            <span style="text-transform: uppercase;">${it.menu.name}</span>
          </div>
          ${it.selectedOption ? `<div style="margin-left: 28px; font-size: 11px; font-weight: bold;">▶ Opsi: ${it.selectedOption}</div>` : ''}
          ${it.notes ? `<div style="margin-left: 28px; font-size: 11px; font-weight: bold; background: #fee2e2; color: #991b1b; padding: 2px 4px; border-left: 3px solid #dc2626; margin-top: 2px;">⚠ KOKI NOTE: "${it.notes}"</div>` : ''}
        </div>
      `
      )
      .join('');

    const html = `
      <div style="width: 100%; max-width: 80mm; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.35; color: #000; padding: 6px; background: #fff;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: inline-block; background: #000; color: #fff; font-weight: 900; font-size: 12px; padding: 2px 8px; border-radius: 4px; letter-spacing: 2px; text-transform: uppercase;">*** TIKET DAPUR (KOT) ***</div>
          <div style="font-size: 26px; font-weight: 900; margin: 8px 0; background: #fef08a; color: #000; padding: 4px; border: 2px solid #000; border-radius: 8px;">${order.tableNumber}</div>
          <div style="font-size: 11px; font-weight: bold;">
            <div>No. Tiket : ${order.orderNumber}</div>
            <div>Waktu : ${order.time} · Tamu : ${order.customerName}</div>
          </div>
        </div>

        <div style="border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          ${kotItems}
        </div>

        ${
          order.notes
            ? `
          <div style="border: 2px solid #000; background: #fef3c7; padding: 6px; border-radius: 6px; margin-bottom: 8px;">
            <div style="font-weight: 900; font-size: 11px; text-transform: uppercase;">📢 INSTRUKSI MEJA / CATATAN KHUSUS:</div>
            <div style="font-weight: bold; font-size: 12px; margin-top: 3px; background: #fff; padding: 4px; border: 1px solid #d97706; border-radius: 4px;">"${order.notes}"</div>
          </div>
        `
            : ''
        }

        <div style="text-align: center; font-size: 10px; font-weight: bold;">
          <div style="font-size: 11px; text-transform: uppercase;">📌 JEPIT PADA NAMPAN PESANAN</div>
          <div style="color: #444; font-weight: normal; margin-top: 2px;">Harap hidangkan panas & tepat waktu</div>
        </div>
      </div>
    `;

    printHtmlContent(`KOT_${order.tableNumber}_${order.orderNumber}`, html);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
      }`}
    >
      {/* Top Bar Kasir */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg transition-colors duration-200 ${
          isDark
            ? 'bg-neutral-900/95 border-amber-500/20 text-neutral-100'
            : 'bg-white/95 border-amber-500/30 text-neutral-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCustomer}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Kembali ke Tampilan Tamu Meja"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Layar Meja Pelanggan</span>
          </button>

          <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wide font-serif uppercase">
                LEGEND RESTO
              </span>
              <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                POS Kasir & KDS
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync (13 Meja)
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400 hidden md:inline">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Copy Direct Cashier URL button */}
          <button
            type="button"
            onClick={handleCopyCashierLink}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl border border-neutral-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold active:scale-95 shadow-sm"
            title="Salin tautan akses khusus kasir (?mode=kasir) untuk dibuka di laptop/tablet kasir"
          >
            <Copy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {copiedLink ? 'Link Tersalin! ✓' : 'Salin Link Kasir'}
            </span>
          </button>
          {/* Browser Notification Button */}
          {browserNotificationPerm === 'granted' && (
            <button
              type="button"
              onClick={() => {
                try {
                  const testNotif = new Notification('🔔 Notifikasi Browser Kasir Aktif', {
                    body: 'Sistem siap memberitahukan pesanan masuk dari Meja 01 s/d 13 secara real-time.',
                    icon: '/favicon.ico',
                  });
                  testNotif.onclick = () => {
                    window.focus();
                    testNotif.close();
                  };
                } catch {
                  // ignore
                }
                playOrderChime();
              }}
              className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="Notifikasi Browser Aktif! Klik untuk tes bunyi bel & notifikasi"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">Notif Browser: ON</span>
            </button>
          )}

          {browserNotificationPerm === 'default' && (
            <button
              type="button"
              onClick={handleRequestNotificationPermission}
              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/50 transition-all flex items-center gap-1.5 text-xs font-bold animate-pulse shadow-md"
              title="Klik untuk mengizinkan notifikasi pop-up desktop saat pesanan baru masuk"
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Izinkan Notif Browser</span>
            </button>
          )}

          {browserNotificationPerm === 'denied' && (
            <button
              type="button"
              onClick={() =>
                alert(
                  'Notifikasi browser sedang diblokir di pengaturan peramban Anda. Silakan klik ikon gembok di sebelah kiri alamat web browser untuk mengizinkan Notifikasi.'
                )
              }
              className="p-2 bg-neutral-800 text-neutral-500 rounded-xl border border-neutral-700/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Izin notifikasi browser diblokir"
            >
              <BellOff className="w-4 h-4" />
              <span className="hidden xl:inline">Notif Diblokir</span>
            </button>
          )}

          {/* Sound Toggle with Bell Test */}
          <div className="flex items-center bg-neutral-800/90 rounded-xl border border-neutral-700/80 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                soundEnabledRef.current = next;
                if (next) playOrderChime();
              }}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={soundEnabled ? 'Bel suara aktif. Klik untuk mute' : 'Bel suara mati. Klik untuk aktifkan'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">{soundEnabled ? 'Bel ON' : 'Mute'}</span>
            </button>

            {soundEnabled && (
              <button
                type="button"
                onClick={() => playOrderChime()}
                className="px-2 py-1 text-[10px] font-bold text-neutral-400 hover:text-amber-300 border-l border-neutral-700/80 transition-colors"
                title="Uji Bunyi Bel Dapur (Ding-Dong)"
              >
                Tes Bel
              </button>
            )}
          </div>

          {/* Theme Toggle Button for Cashier */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-sm ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border-neutral-700/80'
                : 'bg-neutral-100 hover:bg-neutral-200 text-amber-600 border-neutral-300'
            }`}
            title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            <span className="hidden xl:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() => onLogout()}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
              title="Kunci & Keluar dari Layar Kasir"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline">Kunci / Keluar</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* Real-Time Floating New Order Alert Banner */}
        <AnimatePresence>


          {incomingOrderAlert && (
            <motion.div
              initial={{ opacity: 0, y: -25, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="p-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-amber-300 ring-4 ring-amber-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-neutral-950 text-amber-400 flex items-center justify-center shrink-0 shadow-lg animate-bounce">
                  <BellRing className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm uppercase px-2.5 py-0.5 bg-neutral-950 text-amber-300 rounded-lg shadow-sm">
                      {incomingOrderAlert.tableNumber}
                    </span>
                    <strong className="text-base font-extrabold tracking-tight">
                      🔔 PESANAN BARU MASUK!
                    </strong>
                    <span className="text-xs font-mono font-bold opacity-85">
                      {incomingOrderAlert.orderNumber}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral-900 mt-1">
                    Pelanggan: <strong className="font-bold">{incomingOrderAlert.customerName}</strong> · Memesan{' '}
                    <strong className="font-bold">{incomingOrderAlert.items.length} Menu</strong> · Total{' '}
                    <strong className="font-mono font-black text-sm">{formatRupiah(incomingOrderAlert.total)}</strong> ({incomingOrderAlert.paymentMethod})
                  </p>
                  {incomingOrderAlert.notes && (
                    <div className="mt-1.5 px-2.5 py-1 bg-neutral-950/15 border border-neutral-950/20 rounded-lg text-xs font-bold text-neutral-950 flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 shrink-0 text-neutral-950" />
                      <span>Catatan Khusus: "{incomingOrderAlert.notes}"</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKotOrder(incomingOrderAlert);
                    setIncomingOrderAlert(null);
                  }}
                  className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-900 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span>Buka KOT Dapur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncomingOrderAlert(null)}
                  className="p-2 bg-neutral-950/20 hover:bg-neutral-950/30 text-neutral-950 rounded-xl transition-colors cursor-pointer"
                  title="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* KPI Banner Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Total Omzet
              </span>
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono tabular-nums">
                {formatRupiah(stats.totalOmzet)}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Menunggu Dapur
              </span>
              <span className="text-sm sm:text-base font-black text-rose-300 font-mono tabular-nums">
                {stats.waitingCount} Tiket
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Pesanan Aktif
              </span>
              <span className="text-sm sm:text-base font-black text-blue-300 font-mono tabular-nums">
                {stats.activeCount} Pesanan
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Meja Terisi
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-300 font-mono tabular-nums">
                {stats.occupiedCount} / 13 Meja
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/80 p-2 rounded-2xl border border-neutral-800">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('antrean')}
              className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'antrean'
                  ? 'text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {activeTab === 'antrean' && (
                <motion.div
                  layoutId="activePosTab"
                  transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                  className="absolute inset-0 bg-amber-500 rounded-xl shadow-md"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Antrean Pesanan Dapur ({orders.length})</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('denah')}
              className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'denah'
                  ? 'text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {activeTab === 'denah' && (
                <motion.div
                  layoutId="activePosTab"
                  transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                  className="absolute inset-0 bg-amber-500 rounded-xl shadow-md"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5" />
                <span>Denah 13 Meja</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('laporan')}
              className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'laporan'
                  ? 'text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {activeTab === 'laporan' && (
                <motion.div
                  layoutId="activePosTab"
                  transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                  className="absolute inset-0 bg-amber-500 rounded-xl shadow-md"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>Rekap Kasir</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'qrcodes'
                  ? 'text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {activeTab === 'qrcodes' && (
                <motion.div
                  layoutId="activePosTab"
                  transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                  className="absolute inset-0 bg-amber-500 rounded-xl shadow-md"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>Cetak QR 13 Meja</span>
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex items-center sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari meja, pemesan, menu..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-neutral-200 bg-neutral-800/90 border border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Tab 1: Antrean Pesanan (KDS) */}
        {activeTab === 'antrean' && (
          <div className="space-y-4">
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-neutral-500 font-semibold text-[11px] shrink-0">Filter:</span>
              {[
                { id: 'semua', label: 'Semua Status' },
                { id: 'menunggu', label: 'Menunggu Dapur' },
                { id: 'dimasak', label: 'Sedang Dimasak' },
                { id: 'siap', label: 'Siap Disajikan' },
                { id: 'lunas', label: 'Selesai / Lunas' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === st.id
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-neutral-500 bg-neutral-900/40 rounded-3xl border border-neutral-800/60 space-y-2">
                <UtensilsCrossed className="w-12 h-12 mx-auto stroke-1 text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-300">Tidak ada tiket pesanan</p>
                <p className="text-xs text-neutral-500">
                  Pesanan yang dikirim pelanggan dari meja akan muncul otomatis di sini secara real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredOrders.map((ord) => {
                    const isCompleted = ord.status === 'lunas';
                    return (
                      <motion.div
                        key={ord.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`bg-neutral-900 border rounded-2xl p-4 flex flex-col justify-between shadow-md transition-all ${
                          ord.status === 'menunggu'
                            ? 'border-rose-500/50 shadow-rose-500/5 ring-1 ring-rose-500/30'
                            : ord.status === 'dimasak'
                            ? 'border-amber-500/50 shadow-amber-500/5'
                            : ord.status === 'siap'
                            ? 'border-emerald-500/60 shadow-emerald-500/10'
                            : 'border-neutral-800 opacity-75'
                        }`}
                      >
                        {/* Header Tiket */}
                        <div className="pb-3 border-b border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                                {ord.tableNumber}
                              </span>
                              <span className="font-mono text-xs text-neutral-400 font-bold">
                                {ord.orderNumber}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              {ord.time}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <span className="text-neutral-300 font-semibold block truncate">
                                Pemesan: <strong className="text-white">{ord.customerName}</strong>
                              </span>
                              {ord.customerEmail && (
                                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 truncate mt-0.5">
                                  <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate">{ord.customerEmail}</span>
                                </span>
                              )}
                            </div>

                            {/* Badge Pembayaran */}
                            <button
                              type="button"
                              onClick={() => handleTogglePaid(ord.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                                ord.isPaid
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              }`}
                              title="Klik untuk mengubah status pembayaran"
                            >
                              {ord.isPaid ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>{ord.paymentMethod} (Lunas)</span>
                                </>
                              ) : (
                                <>
                                  <Banknote className="w-3 h-3" />
                                  <span>{ord.paymentMethod} (Belum Bayar)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* List Menu Pesanan */}
                        <div className="py-3 flex-1 space-y-2 text-xs divide-y divide-neutral-800/60">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start">
                              <div className="pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center text-[11px]">
                                    {it.quantity}x
                                  </span>
                                  <span className="font-bold text-neutral-100">
                                    {it.menu.name}
                                  </span>
                                </div>
                                {it.selectedOption && (
                                  <span className="text-[10px] text-amber-400/90 font-medium ml-7 block">
                                    Varian: {it.selectedOption}
                                  </span>
                                )}
                                {it.notes && (
                                  <span className="text-[10px] text-neutral-400 italic ml-7 block bg-neutral-800/80 px-1.5 py-0.5 rounded mt-0.5">
                                    Catatan: "{it.notes}"
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-neutral-400 font-semibold shrink-0">
                                {formatRupiah(it.menu.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Catatan / Request Khusus Seluruh Pesanan */}
                        {ord.notes && (
                          <div className="my-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-1 shadow-inner">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                              <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Catatan Pengantaran / Request Meja:</span>
                            </div>
                            <p className="text-xs text-amber-100 font-semibold italic pl-5 leading-relaxed bg-black/25 p-1.5 rounded-lg border border-amber-500/20">
                              "{ord.notes}"
                            </p>
                          </div>
                        )}

                        {/* Customer Satisfaction Review Badge if available */}
                        {ord.rating && (
                          <div className="my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>Rating Tamu</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <div className="flex items-center text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-2.5 h-2.5 ${
                                        i < ord.rating!.stars
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-neutral-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-bold text-amber-300 font-mono">
                                  {ord.rating.stars}.0
                                </span>
                              </div>
                            </div>
                            {ord.rating.feedback && (
                              <p className="text-[11px] text-neutral-300 italic">
                                "{ord.rating.feedback}"
                              </p>
                            )}
                            {ord.rating.aspects && ord.rating.aspects.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {ord.rating.aspects.map((asp, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-amber-500/15 text-[9px] font-bold text-amber-300"
                                  >
                                    ✓ {asp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Total & Status Flow Control */}
                        <div className="pt-3 border-t border-neutral-800 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-400 font-semibold">Total Pesanan:</span>
                            <span className="font-mono text-base font-black text-amber-400 tabular-nums">
                              {formatRupiah(ord.total)}
                            </span>
                          </div>

                          {/* Workflow Step Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                            {ord.status === 'menunggu' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'dimasak')}
                                className="col-span-2 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Flame className="w-3.5 h-3.5 fill-neutral-950" />
                                <span>Terima & Masak</span>
                              </button>
                            )}

                            {ord.status === 'dimasak' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'siap')}
                                className="col-span-2 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Siap Diantar ke Meja</span>
                              </button>
                            )}

                            {ord.status === 'siap' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'lunas')}
                                className="col-span-2 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Selesai & Tutup Meja</span>
                              </button>
                            )}

                            {isCompleted && (
                              <div className="col-span-2 py-1.5 bg-neutral-800/80 text-emerald-400 rounded-xl text-center text-[11px] font-semibold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Pesanan Selesai / Lunas</span>
                              </div>
                            )}

                            {/* Secondary Buttons: Cetak KOT Dapur, Cetak Struk Kasir & Hapus */}
                            <button
                              onClick={() => setSelectedKotOrder(ord)}
                              className="py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl transition-colors flex items-center justify-center gap-1 text-[11px] font-bold border border-amber-500/40"
                              title="Cetak Tiket Masak Dapur (KOT) khusus Koki"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                              <span>KOT Dapur 🍳</span>
                            </button>

                            <button
                              onClick={() => setSelectedReceiptOrder(ord)}
                              className="py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors flex items-center justify-center gap-1 text-[11px]"
                              title="Cetak Struk Pembayaran Kasir 58mm/80mm"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>Struk Kasir 🧾</span>
                            </button>

                            <button
                              onClick={() => handleDelete(ord.id)}
                              className="col-span-2 py-1 bg-neutral-800/60 hover:bg-rose-900/30 text-neutral-400 hover:text-rose-300 rounded-xl transition-colors flex items-center justify-center gap-1 text-[10px]"
                            >
                              <X className="w-3 h-3" />
                              <span>Batalkan / Hapus Tiket</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Denah 13 Meja (Interactive Table Map) */}
        {activeTab === 'denah' && (
          <div className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-amber-300">
                  Denah Tata Letak Meja Legend Lounge
                </h3>
                <p className="text-xs text-neutral-400">
                  Total 13 meja aktif. Klik kartu meja untuk melihat rincian pesanan berjalan.
                </p>
              </div>

              {/* Legend & Quick QR Print Action */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('qrcodes')}
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  title="Buka Pusat Cetak Standee QR 13 Meja"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>🖨️ Cetak QR 13 Meja</span>
                </button>
                <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Kosong
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  Ada Tamu
                </span>
              </div>
            </div>

            {/* Grid 13 Meja */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
              {ALL_TABLES.map((tbl) => {
                const tableOrders = orders.filter(
                  (o) => o.tableNumber === tbl && o.status !== 'lunas' && o.status !== 'batal'
                );
                const isOccupied = tableOrders.length > 0;
                const totalBill = tableOrders.reduce((sum, o) => sum + o.total, 0);

                return (
                  <div
                    key={tbl}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-36 ${
                      isOccupied
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-black text-neutral-100 font-mono">
                        {tbl}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab('qrcodes')}
                          className="p-1 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                          title={`Lihat & Cetak QR Code ${tbl}`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isOccupied ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      {isOccupied ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-amber-300 block truncate">
                            {tableOrders[0].customerName}
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-mono">
                            {tableOrders[0].items.length} Menu dipesan
                          </span>
                          <span className="text-xs font-black text-amber-400 font-mono block">
                            {formatRupiah(totalBill)}
                          </span>
                          {tableOrders.some((o) => !!o.notes) && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mt-0.5 truncate">
                              <MessageSquareQuote className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span>Ada Catatan Khusus</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 font-semibold block">
                          Tersedia (Kosong)
                        </span>
                      )}
                    </div>

                    {isOccupied && (
                      <button
                        onClick={() => {
                          setStatusFilter('semua');
                          setSearchQuery(tbl);
                          setActiveTab('antrean');
                        }}
                        className="text-[10px] font-bold text-amber-400 hover:underline text-left mt-1"
                      >
                        Lihat Tiket & Pesanan →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Rekap Kasir & Laporan Omzet */}
        {activeTab === 'laporan' && (
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-amber-300">
                Ringkasan Transaksi Kasir Hari Ini
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 font-semibold block">
                    Total Pembayaran QRIS
                  </span>
                  <span className="text-lg font-black text-amber-300 font-mono mt-1 block">
                    {formatRupiah(
                      orders
                        .filter((o) => o.paymentMethod.toLowerCase().includes('qris') && o.isPaid)
                        .reduce((sum, o) => sum + o.total, 0)
                    )}
                  </span>
                </div>

                <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 font-semibold block">
                    Total Pembayaran Tunai / Kasir
                  </span>
                  <span className="text-lg font-black text-emerald-300 font-mono mt-1 block">
                    {formatRupiah(
                      orders
                        .filter((o) => o.paymentMethod.toLowerCase().includes('kasir') && o.isPaid)
                        .reduce((sum, o) => sum + o.total, 0)
                    )}
                  </span>
                </div>

                <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 font-semibold block">
                    Total Belum Lunas
                  </span>
                  <span className="text-lg font-black text-rose-300 font-mono mt-1 block">
                    {formatRupiah(
                      orders.filter((o) => !o.isPaid).reduce((sum, o) => sum + o.total, 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Tabel Singkat Transaksi */}
              <div className="pt-2">
                <span className="text-xs font-bold text-neutral-300 block mb-2">
                  Daftar Transaksi Keseluruhan ({orders.length})
                </span>
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-800/80 text-neutral-300 text-[11px] uppercase">
                      <tr>
                        <th className="p-3">Tiket</th>
                        <th className="p-3">Meja</th>
                        <th className="p-3">Pemesan</th>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">Metode</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-200">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-neutral-800/40">
                          <td className="p-3 font-bold text-amber-300">{o.orderNumber}</td>
                          <td className="p-3">{o.tableNumber}</td>
                          <td className="p-3">{o.customerName}</td>
                          <td className="p-3 text-neutral-400">{o.time}</td>
                          <td className="p-3">{o.paymentMethod}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.status === 'lunas'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {o.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-white">
                            {formatRupiah(o.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Evaluasi Kepuasan Pelanggan (Rating & Ulasan Tamu) */}
              <div className="pt-4 border-t border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">
                        Evaluasi Kepuasan Pelanggan (Rating & Ulasan Layanan)
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Membantu manajemen mengevaluasi cita rasa makanan, kecepatan dapur, dan keramahan pelayanan
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                    {ratingStats.count} Ulasan Masuk
                  </span>
                </div>

                {/* Rating Analytics KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Average Star Score */}
                  <div className="p-4 bg-neutral-800/60 border border-neutral-700/60 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                      Rata-Rata Kepuasan
                    </span>
                    <div className="py-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-amber-400 font-mono">
                        {ratingStats.avg > 0 ? ratingStats.avg.toFixed(1) : '-'}
                      </span>
                      <span className="text-xs text-neutral-400 font-semibold font-mono">/ 5.0</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(ratingStats.avg)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Star Distribution Breakdown */}
                  <div className="p-4 bg-neutral-800/60 border border-neutral-700/60 rounded-2xl space-y-1.5 md:col-span-2">
                    <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">
                      Distribusi Bintang Penilaian
                    </span>
                    {[5, 4, 3, 2, 1].map((star, idx) => {
                      const count = ratingStats.breakdown[idx];
                      const pct = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs font-mono">
                          <span className="w-8 text-[11px] text-neutral-400">{star} ★</span>
                          <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-[11px] text-neutral-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Reviews Feed */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-neutral-300 block">
                    Ulasan Langsung dari Meja Tamu:
                  </span>

                  {ratingsList.length === 0 ? (
                    <div className="py-8 text-center bg-neutral-800/30 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                      Belum ada ulasan yang masuk hari ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ratingsList.map((r, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-neutral-800/70 border border-neutral-700/80 rounded-2xl space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {r.tableNumber}
                                </span>
                                <strong className="text-xs text-white">{r.customerName}</strong>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                {r.orderNumber} · {r.time}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-amber-400">
                              {[...Array(5)].map((_, sIdx) => (
                                <Star
                                  key={sIdx}
                                  className={`w-3.5 h-3.5 ${
                                    sIdx < r.rating.stars
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-neutral-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {r.rating.feedback && (
                            <p className="text-xs text-neutral-200 italic bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 leading-relaxed">
                              "{r.rating.feedback}"
                            </p>
                          )}

                          {r.rating.aspects && r.rating.aspects.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {r.rating.aspects.map((asp, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300"
                                >
                                  ✓ {asp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Pusat Cetak QR Code 13 Meja */}
        {activeTab === 'qrcodes' && (
          <TableQRManager />
        )}
      </div>

      {/* Modal Cetak Struk Kasir Thermal (58mm/80mm Receipt Preview) */}
      <AnimatePresence>
        {selectedReceiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceiptOrder(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl space-y-4 z-10"
            >
              {/* Receipt Header Controls */}
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Printer className="w-4 h-4" />
                  Pratinjau Struk Kasir
                </span>
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thermal Paper Look */}
              <div className="bg-white text-neutral-950 p-4 rounded-xl font-mono text-xs shadow-inner space-y-2 select-all">
                {/* Brand */}
                <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-neutral-400">
                  <h4 className="font-black text-sm tracking-wider uppercase font-serif">
                    LEGEND RESTO & LOUNGE
                  </h4>
                  <p className="text-[10px] text-neutral-600">Jl. Utama Lounge No. 88</p>
                  <p className="text-[10px] text-neutral-600">Telp: 0812-3456-7890</p>
                </div>

                {/* Metadata */}
                <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-neutral-400">
                  <div className="flex justify-between">
                    <span>Tiket:</span>
                    <strong className="font-bold">{selectedReceiptOrder.orderNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Meja:</span>
                    <strong className="font-bold">{selectedReceiptOrder.tableNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{selectedReceiptOrder.customerName}</span>
                  </div>
                  {selectedReceiptOrder.customerEmail && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span>E-Receipt:</span>
                      <span className="truncate max-w-[170px] text-neutral-600 font-semibold">{selectedReceiptOrder.customerEmail}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{selectedReceiptOrder.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span>{selectedReceiptOrder.paymentMethod}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-2 space-y-1.5 border-b border-dashed border-neutral-400 text-[11px]">
                  {selectedReceiptOrder.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="pr-2 leading-tight">
                        <span className="font-bold">{it.quantity}x </span>
                        <span>{it.menu.name}</span>
                        {it.selectedOption && (
                          <span className="text-[10px] block text-neutral-600">
                            ({it.selectedOption})
                          </span>
                        )}
                      </div>
                      <span className="font-bold shrink-0">
                        {formatRupiah(it.menu.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Catatan Seluruh Pesanan pada Struk */}
                {selectedReceiptOrder.notes && (
                  <div className="py-1.5 border-b border-dashed border-neutral-400 text-[10px] space-y-0.5">
                    <span className="font-bold text-neutral-800">Catatan Khusus:</span>
                    <p className="italic text-neutral-700 bg-neutral-100 p-1 rounded">
                      "{selectedReceiptOrder.notes}"
                    </p>
                  </div>
                )}

                {/* Totals */}
                <div className="pt-1 space-y-1 text-[11px]">
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-neutral-400">
                    <span>TOTAL BAYAR:</span>
                    <span className="text-sm">{formatRupiah(selectedReceiptOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-600">
                    <span>Status Bayar:</span>
                    <span className="font-bold uppercase">
                      {selectedReceiptOrder.isPaid ? 'LUNAS' : 'MENUNGGU KASIR'}
                    </span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center pt-3 text-[10px] text-neutral-600 border-t border-dashed border-neutral-400">
                  <p className="font-bold">Terima Kasih Atas Kunjungan Anda</p>
                  <p>Nikmati santapan & alunan musik di Legend Lounge</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedReceiptOrder)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>🖨️ Cetak Struk Pembayaran Kasir (Thermal)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cetak Tiket KOT Dapur (Kitchen Order Ticket - Tanpa Harga) */}
      <AnimatePresence>
        {selectedKotOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedKotOrder(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-4 z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <UtensilsCrossed className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      Tiket Dapur (KOT - Khusus Koki)
                    </span>
                    <span className="text-[10px] text-neutral-400">Tanpa harga · Khusus instruksi masak</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKotOrder(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KOT Paper View (Format Struk Khusus Koki) */}
              <div className="bg-white text-neutral-950 p-4 rounded-xl font-mono text-xs shadow-inner space-y-2 select-all border-2 border-dashed border-neutral-400">
                <div className="text-center pb-2 border-b-2 border-dashed border-neutral-900 space-y-1">
                  <span className="inline-block bg-neutral-950 text-white text-[11px] font-black px-2.5 py-0.5 rounded tracking-widest uppercase">
                    *** TIKET DAPUR (KOT) ***
                  </span>
                  <div className="py-1">
                    <span className="text-2xl font-black tracking-wider block bg-amber-200 text-neutral-950 py-1.5 px-3 border-2 border-neutral-950 rounded-lg font-sans shadow-xs">
                      {selectedKotOrder.tableNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-800 font-bold space-y-0.5 pt-1">
                    <p>No. Tiket : {selectedKotOrder.orderNumber}</p>
                    <p>Waktu : {selectedKotOrder.time}</p>
                    <p>Tamu : {selectedKotOrder.customerName}</p>
                  </div>
                </div>

                {/* Items with Bold Portions and Notes for Kitchen */}
                <div className="py-2 space-y-3 border-b-2 border-dashed border-neutral-900 text-[12px]">
                  {selectedKotOrder.items.map((it, idx) => (
                    <div key={idx} className="pb-1">
                      <div className="flex items-start gap-2">
                        <span className="font-black bg-neutral-950 text-white px-2 py-0.5 rounded text-xs">
                          {it.quantity}X
                        </span>
                        <span className="font-black text-neutral-950 uppercase text-[13px] leading-tight">
                          {it.menu.name}
                        </span>
                      </div>
                      {it.selectedOption && (
                        <div className="ml-8 mt-1 text-[11px] font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 inline-block">
                          ▶ Varian: {it.selectedOption}
                        </div>
                      )}
                      {it.notes && (
                        <div className="ml-8 mt-1 text-[11px] font-black text-rose-800 bg-rose-50 px-2 py-1 rounded border-l-4 border-rose-600">
                          ⚠ KOKI NOTE: "{it.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Catatan Khusus Pengantaran / Permintaan Meja untuk Koki & Runner */}
                {selectedKotOrder.notes && (
                  <div className="my-2 p-2.5 bg-amber-100 border-2 border-amber-600 rounded-lg text-neutral-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-amber-900 text-[11px] uppercase tracking-wider">
                      <span>📢 INSTRUKSI MEJA / CATATAN KHUSUS:</span>
                    </div>
                    <p className="font-black text-xs text-neutral-950 leading-snug bg-white p-1.5 rounded border border-amber-300">
                      "{selectedKotOrder.notes}"
                    </p>
                  </div>
                )}

                {/* Footer KOT */}
                <div className="text-center pt-2 space-y-1 text-[10px] text-neutral-800 font-bold">
                  <p className="uppercase tracking-wider text-xs font-black">
                    📌 JEPIT PADA NAMPAN PESANAN
                  </p>
                  <p className="text-[9px] text-neutral-600 font-normal">
                    Pelayan / Runner mengantar sesuai Nomor Meja di atas
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedKotOrder.status === 'menunggu') {
                      handleUpdateStatus(selectedKotOrder.id, 'dimasak');
                    }
                    handlePrintKOT(selectedKotOrder);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>🖨️ Cetak Tiket KOT Dapur & Masak</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
