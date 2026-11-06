import React, { useState } from 'react';
import {
  X,
  Mail,
  Printer,
  CheckCircle2,
  Receipt,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlacedOrder } from '../App';
import { StoreOrder } from '../data/orderStore';
import { printHtmlContent } from '../utils/printHelper';

interface CustomerReceiptModalProps {
  isOpen: boolean;
  order: PlacedOrder | StoreOrder | null;
  onClose: () => void;
  isDark: boolean;
  formatRupiah: (val: number) => string;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  isOpen,
  order,
  onClose,
  isDark,
  formatRupiah,
}) => {
  const [isResent, setIsResent] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
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
          <div style="font-size: 10px;">Telp: 0812-3456-7890 · E-Receipt Digital</div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <span>No. Tiket:</span>
            <strong>${order.orderNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Nomor Meja:</span>
            <strong>${order.tableNumber}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Nama Pemesan:</span>
            <strong>${order.customerName}</strong>
          </div>
          ${
            order.customerEmail
              ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Email Penerima:</span>
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
            <div style="font-weight: bold;">Catatan Khusus:</div>
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
        </div>

        <div style="text-align: center; font-size: 10px; margin-top: 8px;">
          <div style="font-weight: bold;">STRUK PEMBAYARAN DIGITAL (E-RECEIPT)</div>
          <div style="color: #444; margin-top: 2px;">Terima kasih atas pesanan Anda di Legend Lounge</div>
        </div>
      </div>
    `;

    printHtmlContent(`EReceipt_${order.orderNumber}`, html);
  };

  const handleResendEmail = () => {
    setIsResent(true);
    setTimeout(() => {
      setIsResent(false);
    }, 3000);
  };

  const handleCopySummary = () => {
    const summary = `STRUK DIGITAL LEGEND RESTO
Tiket: ${order.orderNumber}
Meja: ${order.tableNumber}
Pemesan: ${order.customerName}
Email: ${order.customerEmail || '-'}
Waktu: ${order.time}
Total: ${formatRupiah(order.total)}
Metode: ${order.paymentMethod}`;
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`relative w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 z-10 border transition-colors ${
            isDark ? 'bg-neutral-900 border-amber-500/40 text-neutral-100' : 'bg-neutral-100 border-amber-500/50 text-neutral-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-700/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Receipt className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-amber-500">
                  Struk Pembayaran Digital (E-Receipt)
                </h3>
                <p className="text-[10px] text-neutral-400">
                  Bukti resmi transaksi Legend Resto
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Thermal Paper Look */}
          <div className="bg-white text-neutral-950 p-4 rounded-2xl font-mono text-xs shadow-md space-y-2 select-all border border-neutral-300">
            {/* Header Resto */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-neutral-400">
              <h4 className="font-black text-sm tracking-wider uppercase font-serif">
                LEGEND RESTO & LOUNGE
              </h4>
              <p className="text-[10px] text-neutral-600">Jl. Utama Lounge No. 88</p>
              <p className="text-[10px] text-neutral-600">Telp: 0812-3456-7890</p>
            </div>

            {/* Metadata Pemesan & Meja */}
            <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-neutral-400">
              <div className="flex justify-between">
                <span>Tiket:</span>
                <strong className="font-bold text-amber-600">{order.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Nomor Meja:</span>
                <strong className="font-bold">{order.tableNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Nama Pemesan:</span>
                <strong className="font-bold">{order.customerName}</strong>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between items-center text-[10px]">
                  <span>Email Struk:</span>
                  <span className="truncate max-w-[170px] text-neutral-700 font-semibold">
                    {order.customerEmail}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Waktu Order:</span>
                <span>{order.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span>{order.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 space-y-1.5 border-b border-dashed border-neutral-400 text-[11px]">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="pr-2 leading-tight">
                    <span className="font-bold">{it.quantity}x </span>
                    <span>{it.menu.name}</span>
                    {it.selectedOption && (
                      <span className="text-[10px] block text-neutral-600">
                        ({it.selectedOption})
                      </span>
                    )}
                    {it.notes && (
                      <span className="text-[10px] block italic text-neutral-500">
                        Catatan: "{it.notes}"
                      </span>
                    )}
                  </div>
                  <span className="font-bold shrink-0">
                    {formatRupiah(it.menu.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Catatan Keseluruhan */}
            {order.notes && (
              <div className="py-1.5 border-b border-dashed border-neutral-400 text-[10px] space-y-0.5">
                <span className="font-bold text-neutral-800">Catatan Meja:</span>
                <p className="italic text-neutral-700 bg-neutral-100 p-1 rounded">
                  "{order.notes}"
                </p>
              </div>
            )}

            {/* Total */}
            <div className="pt-1 space-y-1 text-[11px]">
              <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-neutral-400">
                <span>TOTAL BAYAR:</span>
                <span className="text-sm font-mono text-amber-700">
                  {formatRupiah(order.total)}
                </span>
              </div>
            </div>

            {/* Delivery Confirmation */}
            {order.customerEmail && (
              <div className="pt-2 text-center text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                <span>✓ E-Receipt otomatis dikirimkan ke </span>
                <strong className="block font-mono">{order.customerEmail}</strong>
              </div>
            )}

            {/* Footer Note */}
            <div className="text-center pt-2 text-[10px] text-neutral-600 border-t border-dashed border-neutral-400">
              <p className="font-bold">Terima Kasih Atas Kunjungan Anda</p>
              <p>Nikmati santapan & alunan musik di Legend Lounge</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan Struk PDF</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResendEmail}
                className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isResent
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                    : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                {isResent ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">Terkirim! ✓</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px]">Kirim ke Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                    : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px]">Salin Teks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
