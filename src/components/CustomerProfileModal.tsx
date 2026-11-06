import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Receipt,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerProfileModalProps {
  isOpen: boolean;
  tableNumber: string;
  initialName: string;
  initialEmail: string;
  isDark: boolean;
  onSave: (name: string, email: string) => void;
  onClose?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  tableNumber,
  initialName,
  initialEmail,
  isDark,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setEmail(initialEmail);
      setError(null);
    }
  }, [isOpen, initialName, initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Mohon masukkan nama pemesan (minimal 2 huruf).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Mohon masukkan format email yang valid (contoh: nama@email.com) untuk menerima struk pembayaran.');
      return;
    }

    setError(null);
    onSave(cleanName, cleanEmail);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 z-10 border transition-colors ${
            isDark
              ? 'bg-neutral-900 border-amber-500/40 text-neutral-100 shadow-amber-500/10'
              : 'bg-white border-amber-500/50 text-neutral-900 shadow-2xl'
          }`}
        >
          {/* Header Badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scan Berhasil · Terverifikasi</span>
              </div>
              <h3 className="text-base font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
                Data Pemesan & Struk Pembayaran
              </h3>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Masukkan nama Anda dan alamat email aktif. Struk pembayaran digital (e-receipt) resmi akan dikirim otomatis ke email Anda setelah pemesanan.
          </p>

          {/* Table Number Pill - Locked from scan */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
              isDark
                ? 'bg-neutral-950/70 border-amber-500/30 text-neutral-200'
                : 'bg-amber-50/80 border-amber-300 text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                #
              </span>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                  Nomor Meja Terdeteksi
                </span>
                <span className="font-extrabold text-sm text-amber-500 font-mono">
                  {tableNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Terkunci Otomatis</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            {/* Input Nama Pemesan */}
            <div className="space-y-1">
              <label
                className={`block text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Nama Pemesan *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Masukkan nama Anda (misal: Rian Pratama)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                }`}
              />
              <span className={`text-[10px] block ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Nama akan tertera pada tiket dapur (KOT) & struk kasir.
              </span>
            </div>

            {/* Input Email Penerima Struk */}
            <div className="space-y-1">
              <label
                className={`block text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Alamat Email (Untuk Menerima Struk) *</span>
              </label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                }`}
              />
              <span className={`text-[10px] block ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Struk pembayaran resmi, rincian menu, dan kode transaksi akan otomatis dikirimkan ke email ini.
              </span>
            </div>

            {/* Security & Lock Guarantee Note */}
            <div
              className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Kerahasiaan & Kunci Otomatis Saat Memesan</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Setelah disimpan, <strong>nama pemesan dan nomor meja otomatis tercatat dan tidak bisa diubah</strong> terutama saat Anda ingin memesan menu di keranjang.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>Simpan & Lanjut Memesan</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
