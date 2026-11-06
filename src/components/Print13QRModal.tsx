import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Smartphone,
  Sparkles,
  QrCode,
  Music,
  Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printHtmlContent } from '../utils/printHelper';

interface Print13QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTable?: string;
}

export const ALL_TABLES = [
  'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
  'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10',
  'Meja 11', 'Meja 12', 'Meja 13',
];

export const Print13QRModal: React.FC<Print13QRModalProps> = ({
  isOpen,
  onClose,
  initialTable = 'semua',
}) => {
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [printTheme, setPrintTheme] = useState<'minimal' | 'lounge'>('minimal');

  if (!isOpen) return null;

  const getTableUrl = (tbl: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const tableParam = tbl.replace('Meja ', '').trim();
    return `${origin}/?meja=${tableParam}`;
  };

  const handleCopyLink = (tbl: string) => {
    try {
      const url = getTableUrl(tbl);
      navigator.clipboard?.writeText(url);
      setCopiedTable(tbl);
      setTimeout(() => setCopiedTable(null), 2500);
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    const cards = document.querySelectorAll('.printable-card');
    let itemsHtml = '';
    
    if (cards && cards.length > 0) {
      cards.forEach((card) => {
        const clone = card.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.no-print').forEach((el) => el.remove());
        itemsHtml += `
          <div style="page-break-inside: avoid; margin-bottom: 16px; border: 2px dashed #222; border-radius: 20px; padding: 16px; text-align: center; background: #fff; color: #111;">
            ${clone.innerHTML}
          </div>
        `;
      });
    } else {
      itemsHtml = displayedTables.map((tbl) => {
        const url = getTableUrl(tbl);
        return `
          <div style="border: 2px solid #000; border-radius: 16px; padding: 20px; text-align: center; page-break-inside: avoid; margin-bottom: 20px; background: #fff;">
            <div style="font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">LEGEND RESTO & LOUNGE</div>
            <div style="font-size: 24px; font-weight: 900; margin: 10px 0; background: #fbbf24; color: #000; padding: 6px; border-radius: 8px;">${tbl}</div>
            <div style="font-size: 12px; margin-bottom: 12px; color: #444;">Scan dengan Kamera HP untuk Buka Menu</div>
            <div style="display: flex; justify-content: center; margin: 10px 0;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" width="180" height="180" alt="${tbl}" style="border: 4px solid #000; border-radius: 12px;" />
            </div>
            <div style="font-size: 10px; color: #666; margin-top: 8px;">Nomor meja terkunci otomatis · Tidak perlu ketik nomor meja</div>
          </div>
        `;
      }).join('');
    }

    const fullDoc = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 10px;">
        ${itemsHtml}
      </div>
    `;

    printHtmlContent(`QR Meja Resto - ${selectedTable}`, fullDoc);
  };

  const displayedTables =
    selectedTable === 'semua'
      ? ALL_TABLES
      : ALL_TABLES.filter((t) => t === selectedTable);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-6">
      {/* Container - on print this fills page */}
      <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:p-0">
        {/* Sticky Control Header (Hidden on Print) */}
        <div className="no-print sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-amber-300 font-serif tracking-wide flex items-center gap-2">
                  <span>Cetak QR Code Standee Meja</span>
                  <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    13 Meja Resto
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Cetak langsung 13 meja untuk kertas A4, stiker meja, atau diselipkan di standee akrilik.
                </p>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-amber-400/50"
              >
                <span>
                  {selectedTable === 'semua'
                    ? '🖨️ CETAK 13 MEJA LANGSUNG (A4)'
                    : `🖨️ CETAK ${selectedTable.toUpperCase()}`}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Options & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
            {/* Table Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full sm:max-w-xl">
              <button
                type="button"
                onClick={() => setSelectedTable('semua')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
                  selectedTable === 'semua'
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-black'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ✓ Semua 13 Meja (Sekaligus)
              </button>
              {ALL_TABLES.map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => setSelectedTable(tbl)}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
                    selectedTable === tbl
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-black'
                      : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>

            {/* Theme Selector: Minimal (Save Ink) vs Lounge */}
            <div className="flex items-center bg-neutral-800 rounded-xl p-1 border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintTheme('minimal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  printTheme === 'minimal'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Latar putih hemat tinta printer biasa"
              >
                Hemat Tinta (Putih)
              </button>
              <button
                type="button"
                onClick={() => setPrintTheme('lounge')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  printTheme === 'lounge'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Latar hitam & emas mewah khas lounge"
              >
                Tema Lounge (Emas)
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-neutral-800/60 border border-neutral-700/70 rounded-2xl flex items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Otomatis:</strong> Setiap QR code sudah terprogram mengunci nomor meja yang bersangkutan saat dipindai kamera pelanggan.
              </span>
            </div>
            <span className="hidden md:flex items-center gap-1 text-[11px] text-amber-400/90 font-semibold shrink-0">
              <Scissors className="w-3.5 h-3.5" />
              Dilengkapi garis potong standee
            </span>
          </div>
        </div>

        {/* Printable Cards Grid (13 Meja) */}
        <div className="p-4 sm:p-6 print:p-0">
          <div className={`grid ${
            selectedTable === 'semua'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 max-w-sm mx-auto'
          } gap-5 print:grid-cols-2 print:gap-4 print:max-w-none`}>
            {displayedTables.map((tbl) => {
              const url = getTableUrl(tbl);
              const isCopied = copiedTable === tbl;

              return (
                <div
                  key={tbl}
                  className={`printable-card relative rounded-3xl p-5 border-2 transition-all flex flex-col items-center justify-between text-center overflow-hidden ${
                    printTheme === 'lounge'
                      ? 'bg-neutral-950 text-neutral-100 border-amber-500/50 shadow-xl'
                      : 'bg-white text-neutral-950 border-neutral-800 border-dashed shadow-sm'
                  }`}
                  style={{ pageBreakInside: 'avoid' }}
                >
                  {/* Scissors cut-line hint on paper */}
                  <div className="no-print absolute top-2 right-2 text-[9px] text-neutral-500 flex items-center gap-1">
                    <Scissors className="w-3 h-3" />
                    <span>Garis Potong</span>
                  </div>

                  {/* Resto Branding Header */}
                  <div className="space-y-0.5 pt-1 pb-2 w-full border-b border-amber-500/20">
                    <div className="flex items-center justify-center gap-1.5">
                      <Music className={`w-3.5 h-3.5 ${printTheme === 'lounge' ? 'text-amber-400' : 'text-neutral-900'}`} />
                      <span className={`text-xs font-black tracking-widest uppercase font-serif ${
                        printTheme === 'lounge' ? 'text-amber-300' : 'text-neutral-900'
                      }`}>
                        LEGEND RESTO
                      </span>
                    </div>
                    <p className={`text-[9px] tracking-widest uppercase font-bold ${
                      printTheme === 'lounge' ? 'text-amber-400/80' : 'text-neutral-600'
                    }`}>
                      'N MUSIC LOUNGE
                    </p>
                  </div>

                  {/* Table Badge */}
                  <div className="my-2.5">
                    <span className={`inline-block px-5 py-1 rounded-full text-base sm:text-lg font-black font-mono tracking-widest shadow-sm ${
                      printTheme === 'lounge'
                        ? 'bg-amber-500 text-neutral-950 border border-amber-400'
                        : 'bg-neutral-950 text-white'
                    }`}>
                      {tbl.toUpperCase()}
                    </span>
                    <p className={`text-[10px] mt-1 font-semibold ${
                      printTheme === 'lounge' ? 'text-neutral-400' : 'text-neutral-600'
                    }`}>
                      Pindai untuk Pesan Menu Mandiri
                    </p>
                  </div>

                  {/* High Quality Crisp Vector QR Code */}
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-300 my-1 flex items-center justify-center">
                    <QRCodeSVG
                      value={url}
                      size={155}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>

                  {/* Instructions & WiFi Lounge Info */}
                  <div className="mt-2.5 space-y-1.5 w-full">
                    <div className={`p-2 rounded-xl text-[10px] leading-tight border ${
                      printTheme === 'lounge'
                        ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}>
                      <p className="font-bold">
                        1. Arahkan kamera HP ke Kode QR di atas
                      </p>
                      <p className="text-[9px] opacity-80 mt-0.5">
                        2. Pilih menu masakan & minuman, lalu konfirmasi
                      </p>
                    </div>

                    <div className={`flex items-center justify-center gap-1.5 text-[9px] font-semibold ${
                      printTheme === 'lounge' ? 'text-amber-400/90' : 'text-neutral-700'
                    }`}>
                      <Wifi className="w-3 h-3" />
                      <span>
                        WiFi: <strong className={printTheme === 'lounge' ? 'text-white' : 'text-black'}>Legend-Lounge</strong> · Sandi: <strong className={printTheme === 'lounge' ? 'text-white' : 'text-black'}>legendmusic</strong>
                      </span>
                    </div>
                  </div>

                  {/* Interactive Screen Buttons (Hidden in print output) */}
                  <div className="no-print mt-3 pt-2.5 border-t border-neutral-800 w-full flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(tbl)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-[10px] font-semibold flex items-center gap-1 border border-neutral-700 transition-colors cursor-pointer"
                      title="Salin Tautan QR Meja Ini"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                      <span>{isCopied ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>

                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl text-[10px] font-semibold flex items-center gap-1 border border-amber-500/30 transition-colors"
                      title="Buka Halaman Tamu Meja Ini di Tab Baru"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Uji Buka</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
