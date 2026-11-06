import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  LayoutDashboard,
  UtensilsCrossed,
  Printer,
  DollarSign,
  Receipt,
  Users,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Banknote,
  ShieldCheck,
  KeyRound,
  Trash2,
  Clock,
  Flame,
  Check,
  X,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  User,
  Lock,
  MessageSquareQuote,
  Sun,
  Moon,
  Plus,
  Edit3,
  BarChart3,
  Download,
  HelpCircle,
  Info,
  Upload,
  QrCode,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderStore, StoreOrder } from '../data/orderStore';
import { LEGEND_MENU, MenuItem, MenuStore } from '../data/legendMenu';
import { TableQRManager } from './TableQRManager';
import { printHtmlContent } from '../utils/printHelper';
import { useTheme } from '../utils/theme';

interface SuperAdminDashboardProps {
  onBackToCustomer: () => void;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onBackToCustomer,
  onLogout,
}) => {
  const [orders, setOrders] = useState<StoreOrder[]>(() => OrderStore.getOrders());
  const [activeTab, setActiveTab] = useState<'laporan' | 'menu' | 'qrcodes' | 'antrean' | 'pengaturan'>('laporan');
  const [currentTime, setCurrentTime] = useState('');
  const [searchMenuQuery, setSearchMenuQuery] = useState('');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [filterMenuCategory, setFilterMenuCategory] = useState<string>('semua');

  // Global Theme (Dark / Light) with unified localStorage persistence
  const { theme, isDark, toggleTheme: handleToggleTheme } = useTheme();

  // Financial Chart Timeframe Filter: 'harian' | 'mingguan' | 'bulanan'
  const [chartPeriod, setChartPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  // In-app modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [orderToVoid, setOrderToVoid] = useState<{ id: string; orderNumber: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sold out items state saved in localStorage
  const [soldOutItemIds, setSoldOutItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('legend_sold_out_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic Menu Catalog state
  const [menuCatalog, setMenuCatalog] = useState<MenuItem[]>(() => MenuStore.getMenu());
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [menuFormData, setMenuFormData] = useState<{
    name: string;
    category: MenuItem['category'];
    subCategory: string;
    price: number;
    description: string;
    image: string;
    isPopular: boolean;
  }>({
    name: '',
    category: 'main_course',
    subCategory: '',
    price: 35000,
    description: '',
    image: '',
    isPopular: false,
  });

  // QRIS Custom Image Upload
  const [customQrisImage, setCustomQrisImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('legend_custom_qris_image');
    } catch {
      return null;
    }
  });

  // Staff Credentials State: Username, Password & PIN
  const [superAdminUser, setSuperAdminUser] = useState<string>(() => {
    try {
      return localStorage.getItem('legend_user_superadmin') || 'admin';
    } catch {
      return 'admin';
    }
  });
  const [superAdminPass, setSuperAdminPass] = useState<string>(() => {
    try {
      return localStorage.getItem('legend_pass_superadmin') || 'admin123';
    } catch {
      return 'admin123';
    }
  });
  const [superAdminPin, setSuperAdminPin] = useState<string>(() => {
    try {
      return localStorage.getItem('legend_pin_superadmin') || '8888';
    } catch {
      return '8888';
    }
  });

  const [cashierUser, setCashierUser] = useState<string>(() => {
    try {
      return localStorage.getItem('legend_user_cashier') || 'kasir';
    } catch {
      return 'kasir';
    }
  });
  const [cashierPass, setCashierPass] = useState<string>(() => {
    try {
      return localStorage.getItem('legend_pass_cashier') || 'kasir123';
    } catch {
      return 'kasir123';
    }
  });
  const [cashierPin, setCashierPin] = useState<string>(() => {
    try {
      return localStorage.getItem('legend_pin_cashier') || '1234';
    } catch {
      return '1234';
    }
  });

  const [credentialsSavedFeedback, setCredentialsSavedFeedback] = useState(false);

  // Sync orders & menu catalog in real-time
  useEffect(() => {
    const unsub = OrderStore.subscribe((updated) => {
      setOrders(updated);
    });

    const handleMenuCatalogChanged = (e: any) => {
      if (e.detail) setMenuCatalog(e.detail);
    };
    window.addEventListener('legend_menu_catalog_changed', handleMenuCatalogChanged);

    return () => {
      unsub();
      window.removeEventListener('legend_menu_catalog_changed', handleMenuCatalogChanged);
    };
  }, []);

  // Real-time clock update
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
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
          ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle sold out item
  const handleToggleSoldOut = (itemId: string) => {
    setSoldOutItemIds((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      try {
        localStorage.setItem('legend_sold_out_items', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Save new credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('legend_user_superadmin', superAdminUser.trim() || 'admin');
      localStorage.setItem('legend_pass_superadmin', superAdminPass.trim() || 'admin123');
      localStorage.setItem('legend_pin_superadmin', superAdminPin.trim() || '8888');

      localStorage.setItem('legend_user_cashier', cashierUser.trim() || 'kasir');
      localStorage.setItem('legend_pass_cashier', cashierPass.trim() || 'kasir123');
      localStorage.setItem('legend_pin_cashier', cashierPin.trim() || '1234');

      setCredentialsSavedFeedback(true);
      showNotification('Kredensial staf (Username, Password & PIN) berhasil diperbarui!');
      setTimeout(() => setCredentialsSavedFeedback(false), 3000);
    } catch {
      // ignore
    }
  };

  // QRIS Custom Image Uploader
  const handleUploadQris = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCustomQrisImage(base64);
      try {
        localStorage.setItem('legend_custom_qris_image', base64);
        window.dispatchEvent(new CustomEvent('legend_qris_image_updated', { detail: base64 }));
        showNotification('Foto barcode QRIS toko berhasil disimpan & disinkronkan ke pelanggan!');
      } catch {
        // ignore
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetQris = () => {
    setCustomQrisImage(null);
    try {
      localStorage.removeItem('legend_custom_qris_image');
      window.dispatchEvent(new CustomEvent('legend_qris_image_updated', { detail: null }));
      showNotification('Barcode QRIS dikembalikan ke QRIS bawaan standar!');
    } catch {
      // ignore
    }
  };

  // Execute reset demo
  const handleExecuteResetDemo = () => {
    OrderStore.resetDemoOrders();
    setIsResetModalOpen(false);
    showNotification('Database riwayat pesanan berhasil direset ke data demo!');
  };

  // Execute void order
  const handleExecuteVoidOrder = () => {
    if (orderToVoid) {
      OrderStore.deleteOrder(orderToVoid.id);
      showNotification(`Tiket ${orderToVoid.orderNumber} berhasil dihapus / divoid!`);
      setOrderToVoid(null);
    }
  };

  // Menu CRUD actions
  const handleOpenAddMenuModal = () => {
    setEditingMenuItem(null);
    setMenuFormData({
      name: '',
      category: 'main_course',
      subCategory: 'Menu Pilihan Resto',
      price: 35000,
      description: '',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      isPopular: false,
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenuModal = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuFormData({
      name: item.name,
      category: item.category,
      subCategory: item.subCategory || '',
      price: item.price,
      description: item.description,
      image: item.image || '',
      isPopular: !!item.isPopular,
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormData.name.trim()) return;

    if (editingMenuItem) {
      const updated: MenuItem = {
        ...editingMenuItem,
        name: menuFormData.name.trim(),
        category: menuFormData.category,
        subCategory: menuFormData.subCategory.trim() || undefined,
        price: Number(menuFormData.price) || 0,
        description: menuFormData.description.trim(),
        image: menuFormData.image.trim() || undefined,
        isPopular: menuFormData.isPopular,
      };
      MenuStore.updateItem(updated);
      setMenuCatalog(MenuStore.getMenu());
      showNotification(`Menu "${updated.name}" berhasil diperbarui!`);
    } else {
      const created = MenuStore.addItem({
        name: menuFormData.name.trim(),
        category: menuFormData.category,
        subCategory: menuFormData.subCategory.trim() || undefined,
        price: Number(menuFormData.price) || 0,
        description: menuFormData.description.trim(),
        image: menuFormData.image.trim() || undefined,
        isPopular: menuFormData.isPopular,
      });
      setMenuCatalog(MenuStore.getMenu());
      showNotification(`Menu baru "${created.name}" berhasil ditambahkan!`);
    }
    setIsMenuModalOpen(false);
  };

  const handleConfirmDeleteMenu = () => {
    if (menuItemToDelete) {
      MenuStore.deleteItem(menuItemToDelete.id);
      setMenuCatalog(MenuStore.getMenu());
      showNotification(`Menu "${menuItemToDelete.name}" berhasil dihapus dari katalog!`);
      setMenuItemToDelete(null);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalSemuaPesanan = orders.length;
    const lunasOrders = orders.filter((o) => o.isPaid || o.status === 'lunas');
    const totalOmzet = lunasOrders.reduce((sum, o) => sum + o.total, 0);

    const qrisOrders = lunasOrders.filter((o) =>
      o.paymentMethod?.toLowerCase().includes('qris')
    );
    const tunaiOrders = lunasOrders.filter(
      (o) => !o.paymentMethod?.toLowerCase().includes('qris')
    );

    const omzetQris = qrisOrders.reduce((sum, o) => sum + o.total, 0);
    const omzetTunai = tunaiOrders.reduce((sum, o) => sum + o.total, 0);

    const activeOrders = orders.filter(
      (o) => o.status !== 'lunas' && o.status !== 'batal'
    );
    const avgTicket = lunasOrders.length > 0 ? Math.round(totalOmzet / lunasOrders.length) : 0;

    return {
      totalSemuaPesanan,
      lunasCount: lunasOrders.length,
      activeCount: activeOrders.length,
      totalOmzet,
      omzetQris,
      omzetTunai,
      avgTicket,
    };
  }, [orders]);

  // Dynamic Chart & Period Aggregation
  const chartData = useMemo(() => {
    const lunasOrders = orders.filter((o) => o.isPaid || o.status === 'lunas');

    if (chartPeriod === 'harian') {
      // 7 Hari Terakhir
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const result: { label: string; dateStr: string; revenue: number; orderCount: number }[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        // Sum revenue of orders matching this day
        const dayOrders = lunasOrders.filter((o) => {
          const od = new Date(o.timestamp);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        });

        // Add dummy base distribution for demo vibrancy if no orders exist for that day
        const seedRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
        result.push({
          label: `${dayLabel} (${dateStr})`,
          dateStr,
          revenue: seedRevenue > 0 ? seedRevenue : (i === 0 ? stats.totalOmzet || 150000 : 80000 + (i * 35000)),
          orderCount: dayOrders.length > 0 ? dayOrders.length : Math.max(1, i + 1),
        });
      }
      return result;
    } else if (chartPeriod === 'mingguan') {
      // 4 Minggu Terakhir
      return [
        { label: 'Minggu 1', dateStr: '01 - 07 Okt', revenue: Math.round(stats.totalOmzet * 0.28) || 320000, orderCount: 4 },
        { label: 'Minggu 2', dateStr: '08 - 14 Okt', revenue: Math.round(stats.totalOmzet * 0.24) || 280000, orderCount: 3 },
        { label: 'Minggu 3', dateStr: '15 - 21 Okt', revenue: Math.round(stats.totalOmzet * 0.32) || 450000, orderCount: 5 },
        { label: 'Minggu 4', dateStr: '22 - 28 Okt', revenue: Math.round(stats.totalOmzet * 0.16) || 190000, orderCount: 2 },
      ];
    } else {
      // 6 Bulan Terakhir
      return [
        { label: 'Mei', dateStr: 'Mei 2026', revenue: 4200000, orderCount: 48 },
        { label: 'Jun', dateStr: 'Jun 2026', revenue: 5100000, orderCount: 62 },
        { label: 'Jul', dateStr: 'Jul 2026', revenue: 6800000, orderCount: 78 },
        { label: 'Agu', dateStr: 'Agu 2026', revenue: 6100000, orderCount: 70 },
        { label: 'Sep', dateStr: 'Sep 2026', revenue: 7400000, orderCount: 85 },
        { label: 'Okt', dateStr: 'Okt 2026', revenue: stats.totalOmzet || 8200000, orderCount: stats.lunasCount || 92 },
      ];
    }
  }, [orders, chartPeriod, stats]);

  const maxChartRevenue = useMemo(() => {
    return Math.max(...chartData.map((d) => d.revenue), 100000);
  }, [chartData]);

  // Best Selling Menu Items Aggregation
  const topSellingMenus = useMemo(() => {
    const lunasOrders = orders.filter((o) => o.isPaid || o.status === 'lunas');
    const counts: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

    lunasOrders.forEach((o) => {
      o.items.forEach((it) => {
        const id = it.menu.id;
        if (!counts[id]) {
          counts[id] = {
            name: it.menu.name,
            quantity: 0,
            revenue: 0,
            category: it.menu.category,
          };
        }
        counts[id].quantity += it.quantity;
        counts[id].revenue += it.quantity * it.menu.price;
      });
    });

    const arr = Object.values(counts);
    arr.sort((a, b) => b.quantity - a.quantity);
    return arr.slice(0, 5);
  }, [orders]);

  // Export CSV Excel function
  const handleExportCSV = () => {
    const lunasOrders = orders.filter((o) => o.isPaid || o.status === 'lunas');
    const headers = [
      'No Tiket',
      'Nomor Meja',
      'Nama Pemesan',
      'Email Pemesan',
      'Waktu',
      'Metode Bayar',
      'Item Dipesan',
      'Total (IDR)',
      'Catatan Khusus',
    ];

    const rows = lunasOrders.map((o) => [
      o.orderNumber,
      o.tableNumber,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${(o.customerEmail || '-').replace(/"/g, '""')}"`,
      `"${o.time || new Date(o.timestamp).toLocaleString('id-ID')}"`,
      o.paymentMethod,
      `"${o.items.map((it) => `${it.quantity}x ${it.menu.name}`).join('; ')}"`,
      o.total,
      `"${(o.notes || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Laporan_Finansial_Legend_Resto_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Laporan finansial (.CSV Excel) berhasil diunduh!');
  };

  // Export Printable PDF Report
  const handlePrintFinancialReport = () => {
    const lunasOrders = orders.filter((o) => o.isPaid || o.status === 'lunas');
    const rowsHtml = lunasOrders
      .map(
        (o) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">${o.orderNumber}</td>
          <td style="padding: 8px;">${o.tableNumber} - ${o.customerName}</td>
          <td style="padding: 8px;">${o.time}</td>
          <td style="padding: 8px;">${o.items.map((i) => `${i.quantity}x ${i.menu.name}`).join(', ')}</td>
          <td style="padding: 8px;">${o.paymentMethod}</td>
          <td style="padding: 8px; font-weight: bold; text-align: right;">${formatRupiah(o.total)}</td>
        </tr>
      `
      )
      .join('');

    const fullDoc = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #111; max-width: 850px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 22px; text-transform: uppercase;">LEGEND RESTO & MUSIC LOUNGE</h2>
          <p style="margin: 2px 0; font-size: 13px; color: #555;">LAPORAN FINANSIAL & REKAP OMZET OWNER</p>
          <p style="margin: 2px 0; font-size: 11px; color: #777;">Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Transaksi: ${lunasOrders.length} Pesanan</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="border: 1px solid #ccc; border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: #666;">TOTAL OMZET</div>
            <div style="font-size: 16px; font-weight: bold;">${formatRupiah(stats.totalOmzet)}</div>
          </div>
          <div style="border: 1px solid #ccc; border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: #666;">OMZET QRIS ONLINE</div>
            <div style="font-size: 16px; font-weight: bold;">${formatRupiah(stats.omzetQris)}</div>
          </div>
          <div style="border: 1px solid #ccc; border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: #666;">KASIR TUNAI</div>
            <div style="font-size: 16px; font-weight: bold;">${formatRupiah(stats.omzetTunai)}</div>
          </div>
          <div style="border: 1px solid #ccc; border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: #666;">RATA-RATA TIKET (AOV)</div>
            <div style="font-size: 16px; font-weight: bold;">${formatRupiah(stats.avgTicket)}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; margin-bottom: 8px;">Daftar Transaksi Lunas</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #999;">
              <th style="padding: 8px;">No Tiket</th>
              <th style="padding: 8px;">Meja & Tamu</th>
              <th style="padding: 8px;">Waktu</th>
              <th style="padding: 8px;">Item Menu</th>
              <th style="padding: 8px;">Metode Bayar</th>
              <th style="padding: 8px; text-align: right;">Total Tagihan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 30px; text-align: right; font-size: 11px; color: #555;">
          <p>Disetujui oleh:</p>
          <div style="height: 50px;"></div>
          <p style="font-weight: bold;">( Owner / Manajer Legend Resto )</p>
        </div>
      </div>
    `;

    printHtmlContent('Laporan Finansial Owner - Legend Resto', fullDoc);
  };

  // Filtered menu for Menu Manager tab
  const filteredMenuList = useMemo(() => {
    return menuCatalog.filter((m) => {
      const matchCat = filterMenuCategory === 'semua' || m.category === filterMenuCategory;
      const q = searchMenuQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.subCategory && m.subCategory.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [menuCatalog, filterMenuCategory, searchMenuQuery]);

  // Filtered orders for Order Monitor tab
  const filteredOrdersList = useMemo(() => {
    return orders.filter((o) => {
      const q = searchOrderQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.tableNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q)
      );
    });
  }, [orders, searchOrderQuery]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 relative transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
      }`}
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm rounded-2xl shadow-2xl flex items-center gap-2 border border-amber-300"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Super Admin */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl transition-colors ${
          isDark
            ? 'bg-neutral-900/95 border-amber-500/30'
            : 'bg-white/95 border-amber-500/40 text-neutral-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCustomer}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border-neutral-700'
                : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border-neutral-300'
            }`}
            title="Kembali ke Layar Tamu / Meja"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Layar Tamu</span>
          </button>

          <div className="h-6 w-px bg-neutral-700 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 uppercase font-serif tracking-wider">
                LEGEND RESTO
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500 text-amber-500 text-[11px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Super Admin</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Akses Penuh Owner & Manajer
              </span>
              <span className="text-neutral-400">·</span>
              <span className="hidden md:inline">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Right Tools: Dark/Light Mode + Reset + Logout */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border-neutral-700'
                : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border-neutral-300'
            }`}
            title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            <span className="hidden md:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Button: Reset Demo Data with In-App Modal */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-300 border-neutral-700'
                : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border-neutral-300'
            }`}
            title="Reset Database ke Pesanan Demo"
          >
            <RefreshCw className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>

          {/* Button: Logout directly */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
            title="Kunci & Keluar ke Layar Tamu"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* KPI Banner Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`p-3.5 border rounded-2xl flex items-center gap-3 shadow-sm ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Total Omzet Resto
              </span>
              <span className="text-sm sm:text-base font-black text-amber-500 font-mono tabular-nums">
                {formatRupiah(stats.totalOmzet)}
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 border rounded-2xl flex items-center gap-3 shadow-sm ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                QRIS Terverifikasi
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-500 font-mono tabular-nums">
                {formatRupiah(stats.omzetQris)}
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 border rounded-2xl flex items-center gap-3 shadow-sm ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Kasir Tunai
              </span>
              <span className="text-sm sm:text-base font-black text-blue-500 font-mono tabular-nums">
                {formatRupiah(stats.omzetTunai)}
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 border rounded-2xl flex items-center gap-3 shadow-sm relative ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block truncate">
                  Rata-rata Tiket
                </span>
                {/* Tooltip explaining Rata-rata Tiket (AOV) */}
                <div className="group relative shrink-0">
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-400 hover:text-amber-500 cursor-help" />
                  <div
                    className={`hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 p-2.5 rounded-xl border text-[11px] leading-relaxed shadow-2xl z-50 ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                        : 'bg-white border-neutral-300 text-neutral-800'
                    }`}
                  >
                    <p className="font-bold text-amber-500 mb-0.5">📌 Apa itu Rata-rata Tiket?</p>
                    <p>
                      <strong>Average Order Value (AOV):</strong> Rata-rata nilai rupiah yang dibelanjakan tamu dalam satu kali pesan (Total Omzet ÷ Jumlah Tiket Selesai).
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-400">
                      Metrik ini berguna untuk mengukur daya beli pelanggan resto dan keberhasilan strategi penawaran menu.
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-black text-purple-500 font-mono tabular-nums">
                {formatRupiah(stats.avgTicket)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-neutral-700/50 pb-2">
          {[
            { id: 'laporan', label: '📊 Laporan Finansial & Omzet', count: stats.lunasCount },
            { id: 'menu', label: '🍴 Manajemen Menu & Stok', count: menuCatalog.length },
            { id: 'qrcodes', label: '🖨️ Pusat Cetak 13 QR Meja', count: 13 },
            { id: 'antrean', label: '📋 Pantau Antrean & Void Tiket', count: orders.length },
            { id: 'pengaturan', label: '⚙️ Pengaturan Akun & QRIS', count: null },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                    : isDark
                    ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                    : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-neutral-950 text-amber-400'
                        : isDark
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: LAPORAN FINANSIAL & DASHBOARD GRAFIK OMZET */}
        {activeTab === 'laporan' && (
          <div className="space-y-5">
            {/* Header & Export Tools */}
            <div
              className={`border rounded-3xl p-5 shadow-sm space-y-4 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-neutral-700/50">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-500 font-serif">
                    Dashboard Finansial & Tren Pendapatan Resto
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Visualisasi omzet harian, mingguan, bulanan serta ringkasan penjualan untuk laporan owner.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Period Filter Toggle */}
                  <div
                    className={`flex items-center rounded-xl p-1 border text-xs ${
                      isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-200 border-neutral-300'
                    }`}
                  >
                    {[
                      { id: 'harian', label: '7 Hari' },
                      { id: 'mingguan', label: '4 Minggu' },
                      { id: 'bulanan', label: '6 Bulan' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setChartPeriod(p.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          chartPeriod === p.id
                            ? 'bg-amber-500 text-neutral-950 shadow-xs'
                            : 'text-neutral-400 hover:text-amber-500'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Export Excel / CSV Button */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    title="Unduh seluruh data transaksi dalam format file CSV / Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ekspor CSV / Excel</span>
                  </button>

                  {/* Print / PDF Financial Report */}
                  <button
                    type="button"
                    onClick={handlePrintFinancialReport}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    title="Cetak format laporan resmi untuk owner"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak PDF Laporan</span>
                  </button>
                </div>
              </div>

              {/* Visual Interactive Bar Chart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-amber-500">
                    <BarChart3 className="w-4 h-4" />
                    <span>Grafik Performa Penjualan ({chartPeriod === 'harian' ? 'Harian' : chartPeriod === 'mingguan' ? 'Mingguan' : 'Bulanan'})</span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Puncak Tertinggi: <strong>{formatRupiah(maxChartRevenue)}</strong>
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-end gap-2 sm:gap-4 h-56 pt-8 pb-3 ${
                    isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  {chartData.map((col, idx) => {
                    const heightPercent = Math.max(12, Math.round((col.revenue / maxChartRevenue) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-neutral-900 border border-amber-500/50 text-white text-[10px] p-1.5 rounded-lg shadow-xl text-center whitespace-nowrap">
                          <p className="font-bold text-amber-400">{formatRupiah(col.revenue)}</p>
                          <p className="text-neutral-400">{col.orderCount} Tiket Transaksi</p>
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[48px] bg-neutral-800/80 rounded-t-xl overflow-hidden flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="w-full bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300 rounded-t-xl hover:brightness-110 cursor-pointer shadow-sm"
                          />
                        </div>

                        {/* Label */}
                        <span className="text-[10px] font-bold text-neutral-400 mt-2 truncate w-full text-center">
                          {col.dateStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Analytics: Top Selling & Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* 1. Top 5 Best Selling Menu Items */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-700/50">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>5 Menu Terlaris (Best Seller)</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">Berdasarkan kuantiti porsi</span>
                  </div>

                  <div className="space-y-2.5">
                    {topSellingMenus.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-4 text-center">Belum ada data pesanan lunas.</p>
                    ) : (
                      topSellingMenus.map((m, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{m.name}</span>
                            </span>
                            <span className="font-mono text-[11px] text-amber-400 font-bold">
                              {m.quantity} Porsi ({formatRupiah(m.revenue)})
                            </span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-400 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.round((m.quantity / (topSellingMenus[0]?.quantity || 1)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Payment Method Distribution Breakdown */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-700/50">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>Distribusi Metode Pembayaran</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">QRIS Online vs Kasir Tunai</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* QRIS bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span>QRIS Online (BCA/GoPay/OVO/ShopeePay)</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatRupiah(stats.omzetQris)} ({stats.totalOmzet > 0 ? Math.round((stats.omzetQris / stats.totalOmzet) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-2 rounded-full"
                          style={{
                            width: `${stats.totalOmzet > 0 ? Math.round((stats.omzetQris / stats.totalOmzet) * 100) : 50}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Tunai Kasir bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          <span>Bayar Langsung di Kasir (Tunai / EDC)</span>
                        </span>
                        <span className="font-mono font-bold text-blue-400">
                          {formatRupiah(stats.omzetTunai)} ({stats.totalOmzet > 0 ? Math.round((stats.omzetTunai / stats.totalOmzet) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-400 h-2 rounded-full"
                          style={{
                            width: `${stats.totalOmzet > 0 ? Math.round((stats.omzetTunai / stats.totalOmzet) * 100) : 50}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
                      💡 <strong>Insight Finansial:</strong> Pembayaran non-tunai (QRIS) mempercepat perputaran meja (*table turnover*) dan meminimalisir selisih uang kembalian pada kasir.
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Audit Table */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Rincian Audit Seluruh Transaksi Lunas
                  </h4>
                  <span className="text-xs text-neutral-500 font-mono">
                    Total: {orders.filter((o) => o.isPaid || o.status === 'lunas').length} Tiket
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-neutral-700/60">
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`uppercase text-[10px] font-bold ${
                        isDark ? 'bg-neutral-800/80 text-neutral-400' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <tr>
                        <th className="p-3">No. Tiket</th>
                        <th className="p-3">Meja & Tamu</th>
                        <th className="p-3">Email Pemesan</th>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">Item Pesanan</th>
                        <th className="p-3">Metode Bayar</th>
                        <th className="p-3 text-right">Total Tagihan</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700/50">
                      {orders
                        .filter((o) => o.isPaid || o.status === 'lunas')
                        .map((o) => (
                          <tr
                            key={o.id}
                            className={`transition-colors ${
                              isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-100'
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-amber-500">{o.orderNumber}</td>
                            <td className="p-3">
                              <strong className="block text-neutral-200">{o.tableNumber}</strong>
                              <span className="text-[11px] text-neutral-400">{o.customerName}</span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-neutral-400">
                              {o.customerEmail || <span className="text-neutral-600">-</span>}
                            </td>
                            <td className="p-3 text-neutral-400">
                              {new Date(o.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              WIB
                            </td>
                            <td className="p-3 text-neutral-300">
                              <div>
                                <span>
                                  {o.items.length} Menu ({o.items.map((i) => i.menu.name).slice(0, 2).join(', ')}
                                  {o.items.length > 2 ? '...' : ''})
                                </span>
                                {o.notes && (
                                  <span className="block text-[10px] text-amber-400/90 font-medium italic mt-0.5">
                                    💬 "{o.notes}"
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  o.paymentMethod?.toLowerCase().includes('qris')
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {o.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-black text-amber-500 text-right">
                              {formatRupiah(o.total)}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                LUNAS ✓
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAJEMEN MENU & STOK (CRUD Lengkap: Tambah, Ubah, Hapus) */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div
              className={`border rounded-3xl p-5 shadow-sm space-y-4 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-700/50">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-500 font-serif">
                    Katalog Menu & Manajemen Stok Restoran
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Tambah menu baru, ubah harga & foto, atur status stok habis, atau hapus menu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold rounded-xl">
                    {soldOutItemIds.length} Menu Habis
                  </span>
                  {/* Button Tambah Menu Baru */}
                  <button
                    type="button"
                    onClick={handleOpenAddMenuModal}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Tambah Menu Baru</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchMenuQuery}
                    onChange={(e) => setSearchMenuQuery(e.target.value)}
                    placeholder="Cari nama masakan / minuman..."
                    className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
                      isDark
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'semua', label: 'Semua' },
                    { id: 'main_course', label: 'Main Course' },
                    { id: 'classic', label: 'The Classic' },
                    { id: 'beverages', label: 'Beverages' },
                    { id: 'snack', label: 'Snack' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFilterMenuCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        filterMenuCategory === cat.id
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                          : isDark
                          ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                          : 'bg-neutral-200 border-neutral-300 text-neutral-700 hover:text-neutral-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Cards Grid with Edit & Delete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMenuList.map((item) => {
                  const isSoldOut = soldOutItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isSoldOut
                          ? 'bg-neutral-900/60 border-rose-500/30 opacity-75'
                          : isDark
                          ? 'bg-neutral-800/80 border-neutral-700/80 hover:border-amber-500/40'
                          : 'bg-white border-neutral-200 shadow-xs hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-700"
                        />
                        <div className="min-w-0 flex-1">
                          <strong className="text-xs font-bold text-neutral-200 block truncate">
                            {item.name}
                          </strong>
                          <span className="text-xs text-amber-500 font-mono font-bold block mt-0.5">
                            {formatRupiah(item.price)}
                          </span>
                          <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                            {item.subCategory || item.category}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions: Toggle Stock, Edit, Delete */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-700/50">
                        {/* Stock Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSoldOut(item.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer shadow-xs ${
                            isSoldOut
                              ? 'bg-rose-500 text-white hover:bg-rose-400'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                          }`}
                          title="Klik untuk ubah ketersediaan menu"
                        >
                          {isSoldOut ? 'HABIS ✕' : 'TERSEDIA ✓'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMenuModal(item)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg border border-neutral-700 transition-colors"
                            title="Edit menu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenuItemToDelete(item)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-colors"
                            title="Hapus menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PUSAT CETAK STAND 13 QR MEJA */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-4">
            <TableQRManager />
          </div>
        )}

        {/* TAB 4: PANTAU ANTREAN & VOID TIKET */}
        {activeTab === 'antrean' && (
          <div className="space-y-4">
            <div
              className={`border rounded-3xl p-5 shadow-sm space-y-4 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-700/50">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-500 font-serif">
                    Monitor Antrean & Pembatalan / Void Tiket
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Super Admin dapat memantau status pesanan dan membatalkan/void tiket jika ada kendala di restoran.
                  </p>
                </div>
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    placeholder="Cari meja / no. tiket..."
                    className={`w-full pl-8 pr-3 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
                      isDark
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                    }`}
                  />
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrdersList.map((ord) => (
                  <div
                    key={ord.id}
                    className={`p-4 border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs ${
                      isDark ? 'bg-neutral-800/70 border-neutral-700/80' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {ord.tableNumber.replace('Meja ', '')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-neutral-200">{ord.tableNumber}</strong>
                          <span className="text-xs font-mono font-bold text-amber-500">{ord.orderNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              ord.status === 'lunas'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ord.status === 'siap'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : ord.status === 'dimasak'
                                ? 'bg-amber-500/20 text-amber-500'
                                : ord.status === 'batal'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-neutral-700 text-neutral-300'
                            }`}
                          >
                            Status: {ord.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Pelanggan: <strong className="text-neutral-200">{ord.customerName}</strong>
                          {ord.customerEmail && <span> ({ord.customerEmail})</span>} · {ord.items.length} Menu · Total:{' '}
                          <strong className="font-mono text-amber-500">{formatRupiah(ord.total)}</strong> ({ord.paymentMethod})
                        </p>
                        {ord.notes && (
                          <div className="mt-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 flex items-center gap-1.5">
                            <MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              Catatan Khusus: <strong className="font-semibold italic">"{ord.notes}"</strong>
                            </span>
                          </div>
                        )}
                        {ord.tableTransferHistory && ord.tableTransferHistory.length > 0 && (
                          <div className="mt-1 text-[11px] text-amber-400/90 font-medium">
                            ⚠️ Riwayat Pindah Meja: {ord.tableTransferHistory.map((h) => `${h.fromTable} ➔ ${h.toTable} (${h.time})`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => setOrderToVoid({ id: ord.id, orderNumber: ord.orderNumber })}
                        className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Hapus atau Void pesanan dari database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus / Void Tiket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PENGATURAN KREDENSIAL, QRIS RESTO & ZONA RESET */}
        {activeTab === 'pengaturan' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div
              className={`border rounded-3xl p-6 shadow-sm space-y-6 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-700/50">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-500 font-serif">
                    Pengaturan Toko, Gambar QRIS & Kredensial Staf
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Upload foto QRIS asli restoran, atur nama pengguna dan kata sandi Super Admin & Kasir.
                  </p>
                </div>
              </div>

              {/* QRIS Upload Section */}
              <div
                className={`p-4 border rounded-2xl space-y-3 ${
                  isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-700/50">
                  <div className="flex items-center gap-2 text-neutral-200 font-bold text-xs uppercase tracking-wider">
                    <QrCode className="w-4 h-4 text-amber-500" />
                    <span>Gambar Barcode QRIS Pembayaran Resto</span>
                  </div>
                  {customQrisImage && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      QRIS Asli Aktif ✓
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400">
                  Unggah barcode QRIS asli restoran Anda (BCA, Mandiri, GoPay, OVO, DANA, ShopeePay, dll). Tamu akan melihat barcode ini di modal checkout saat memilih bayar QRIS.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-amber-500/50 bg-neutral-900 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {customQrisImage ? (
                      <img src={customQrisImage} alt="QRIS Resto" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <div className="text-center p-2">
                        <QrCode className="w-10 h-10 mx-auto text-neutral-600 mb-1" />
                        <span className="text-[9px] text-neutral-500 font-bold block">QRIS Standar (Bawaan Sistem)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>{customQrisImage ? 'Ganti Foto QRIS Asli' : 'Upload Foto QRIS Asli Toko'}</span>
                      <input type="file" accept="image/*" onChange={handleUploadQris} className="hidden" />
                    </label>

                    {customQrisImage && (
                      <button
                        type="button"
                        onClick={handleResetQris}
                        className="block px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-rose-400 rounded-xl font-semibold border border-neutral-700 text-[11px] cursor-pointer"
                      >
                        Reset ke QRIS Bawaan Resto
                      </button>
                    )}
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      Format: PNG / JPG / JPEG (Maks. 5MB). Otomatis disinkronkan ke seluruh tablet dan smartphone pelanggan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Credentials Form */}
              <form onSubmit={handleSaveCredentials} className="space-y-6">
                {/* Super Admin Credentials */}
                <div
                  className={`p-4 border rounded-2xl space-y-3 ${
                    isDark ? 'bg-neutral-800/60 border-amber-500/30' : 'bg-neutral-50 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider pb-2 border-b border-neutral-700/50">
                    <Crown className="w-4 h-4 fill-amber-500" />
                    <span>Akun Super Admin (Owner / Manajer)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-500" />
                        <span>Username:</span>
                      </label>
                      <input
                        type="text"
                        value={superAdminUser}
                        onChange={(e) => setSuperAdminUser(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                        placeholder="admin"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Password:</span>
                      </label>
                      <input
                        type="text"
                        value={superAdminPass}
                        onChange={(e) => setSuperAdminPass(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                        placeholder="admin123"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Cashier Credentials */}
                <div
                  className={`p-4 border rounded-2xl space-y-3 ${
                    isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-neutral-300 font-bold text-xs uppercase tracking-wider pb-2 border-b border-neutral-700/50">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <span>Akun Kasir (POS & KDS Dapur)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-500" />
                        <span>Username:</span>
                      </label>
                      <input
                        type="text"
                        value={cashierUser}
                        onChange={(e) => setCashierUser(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                        placeholder="kasir"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Password:</span>
                      </label>
                      <input
                        type="text"
                        value={cashierPass}
                        onChange={(e) => setCashierPass(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                        placeholder="kasir123"
                        required
                      />
                    </div>
                  </div>
                </div>

                {credentialsSavedFeedback && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Perubahan akun staf berhasil disimpan ke sistem!</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Simpan Perubahan Kredensial Staf
                </button>
              </form>
            </div>

            {/* Danger Zone: Reset Data */}
            <div
              className={`border border-rose-500/30 rounded-3xl p-6 shadow-sm space-y-3 ${
                isDark ? 'bg-neutral-900' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Zona Pengaturan Khusus Super Admin</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Fitur reset data demo telah dipindahkan sepenuhnya ke Super Admin. Kasir operasional tidak memiliki akses untuk mereset pesanan resto.
              </p>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95"
              >
                Reset Database Pesanan Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH / EDIT MENU */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`border rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl ${
                isDark ? 'bg-neutral-900 border-amber-500/40 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/50">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                    <UtensilsCrossed className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-amber-500 uppercase tracking-wide">
                    {editingMenuItem ? 'Edit Menu Resto' : 'Tambah Menu Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMenuSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Nama Masakan / Minuman</label>
                  <input
                    type="text"
                    required
                    value={menuFormData.name}
                    onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                    placeholder="Contoh: Sate Maranggi Spesial"
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Kategori Utama</label>
                    <select
                      value={menuFormData.category}
                      onChange={(e) => setMenuFormData({ ...menuFormData, category: e.target.value as any })}
                      className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                      }`}
                    >
                      <option value="main_course">Main Course</option>
                      <option value="classic">The Classic</option>
                      <option value="beverages">Beverages</option>
                      <option value="snack">Snack</option>
                      <option value="indomie">Indomie Corner</option>
                      <option value="sambal_side">Side & Sambal</option>
                      <option value="dessert">Toast & Dessert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Harga (Rupiah)</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={menuFormData.price}
                      onChange={(e) => setMenuFormData({ ...menuFormData, price: Number(e.target.value) })}
                      className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 font-mono ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Sub-Kategori / Tagline</label>
                  <input
                    type="text"
                    value={menuFormData.subCategory}
                    onChange={(e) => setMenuFormData({ ...menuFormData, subCategory: e.target.value })}
                    placeholder="Contoh: Olahan Daging Pilihan / Kopi & Teh"
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={menuFormData.description}
                    onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                    placeholder="Jelaskan cita rasa, bahan racikan, dan kelezatan hidangan..."
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 resize-none ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">URL Gambar / Foto Menu</label>
                  <input
                    type="url"
                    value={menuFormData.image}
                    onChange={(e) => setMenuFormData({ ...menuFormData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="popularCheckbox"
                    checked={menuFormData.isPopular}
                    onChange={(e) => setMenuFormData({ ...menuFormData, isPopular: e.target.checked })}
                    className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="popularCheckbox" className="font-semibold text-neutral-300 cursor-pointer">
                    Tandai sebagai Menu Favorit / Rekomendasi Resto
                  </label>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow-md cursor-pointer"
                  >
                    {editingMenuItem ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KONFIRMASI HAPUS MENU */}
      <AnimatePresence>
        {menuItemToDelete && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Menu Ini?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Menu <strong className="text-amber-400">"{menuItemToDelete.name}"</strong> akan dihapus dari katalog restoran dan tidak akan terlihat lagi oleh pelanggan.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMenuItemToDelete(null)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteMenu}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Ya, Hapus Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KONFIRMASI RESET PESANAN DEMO */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Riwayat Pesanan?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Seluruh data pesanan berjalan akan dikembalikan ke data awal demo resto (Meja 01, Meja 03, Meja 07).
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteResetDemo}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Ya, Reset Demo
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS / VOID TIKET */}
      {orderToVoid && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hapus / Void Tiket Pesanan?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Tiket <strong className="text-amber-400">{orderToVoid.orderNumber}</strong> akan dihapus permanen dari antrean dan database penjualan.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderToVoid(null)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteVoidOrder}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Ya, Void Tiket
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
