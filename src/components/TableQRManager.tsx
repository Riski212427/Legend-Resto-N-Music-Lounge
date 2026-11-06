import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Smartphone,
  Sparkles,
  QrCode,
  Music,
  Grid,
  FileCheck
} from 'lucide-react';
import { printHtmlContent } from '../utils/printHelper';

interface TableQRManagerProps {
  onSelectTableForDemo?: (table: string) => void;
}

export const ALL_TABLES = [
  'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
  'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10',
  'Meja 11', 'Meja 12', 'Meja 13',
];

export const TableQRManager: React.FC<TableQRManagerProps> = ({ onSelectTableForDemo }) => {
  const [selectedTable, setSelectedTable] = useState<string>('semua');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [printTheme, setPrintTheme] = useState<'lounge' | 'minimal'>('lounge');

  const getTableUrl = (tbl: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Format: https://origin/?meja=01
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
      // fallback
    }
  };

  const handlePrint = () => {
    // Generate clean standee HTML for reliable print
    const itemsHtml = displayedTables.map((tbl) => {
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

    const fullDoc = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        ${itemsHtml}
      </div>
    `;

    printHtmlContent(`QR Meja Resto - ${selectedTable}`, fullDoc);
  };

  const displayedTables = selectedTable === 'semua'
    ? ALL_TABLES
    : ALL_TABLES.filter((t) => t === selectedTable);

  return (
    <div className="space-y-6">
      {/* Screen Header & Action Tools (Hidden during Print) */}
      <div className="no-print bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-amber-300 font-serif tracking-wide">
                  Pusat Cetak QR Code Meja (13 Meja)
                </h2>
                <p className="text-xs text-neutral-400">
                  Cetak kartu QR untuk ditempel di meja atau ditaruh di standee akrilik restoran.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Print and Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Style Selector */}
            <div className="flex items-center bg-neutral-800 rounded-xl p-1 border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintTheme('lounge')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  printTheme === 'lounge'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Desain Mewah Lounge (Hitam & Emas)"
              >
                Tema Lounge
              </button>
              <button
                type="button"
                onClick={() => setPrintTheme('minimal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  printTheme === 'minimal'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Desain Putih Hemat Tinta / Standar"
              >
                Hemat Tinta (Putih)
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
            >
              <span>
                {selectedTable === 'semua'
                  ? '🖨️ CETAK 13 MEJA LANGSUNG (A4)'
                  : `🖨️ CETAK ${selectedTable.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>

        {/* Table Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedTable('semua')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
              selectedTable === 'semua'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-xs'
                : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Semua 13 Meja
          </button>
          {ALL_TABLES.map((tbl) => (
            <button
              key={tbl}
              type="button"
              onClick={() => setSelectedTable(tbl)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
                selectedTable === tbl
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-xs'
                  : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tbl}
            </button>
          ))}
        </div>

        {/* Tips Box */}
        <div className="p-3 bg-neutral-800/50 border border-neutral-800 rounded-2xl flex items-start gap-2.5 text-[11px] text-neutral-400">
          <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-neutral-200">Cara Kerja QR: </span>
            Ketika tamu memindai QR code ini dengan kamera HP (iOS Camera atau Google Lens di Android), menu digital Legend Resto akan langsung terbuka dengan <span className="text-amber-300 font-semibold">nomor meja yang sudah terkunci otomatis</span>. Tamu tidak perlu repot mengetik nomor meja lagi!
          </div>
        </div>
      </div>

      {/* Printable Grid of Table QR Cards */}
      <div className={`grid ${
        selectedTable === 'semua'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
          : 'grid-cols-1 max-w-md mx-auto'
      } gap-6 print:grid-cols-2 print:gap-4 print:max-w-none`}>
        {displayedTables.map((tbl) => {
          const url = getTableUrl(tbl);
          const isCopied = copiedTable === tbl;

          return (
            <div
              key={tbl}
              className={`printable-card relative rounded-3xl p-6 transition-all border flex flex-col items-center justify-between text-center overflow-hidden ${
                printTheme === 'lounge'
                  ? 'bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-amber-500/40 shadow-xl'
                  : 'bg-white text-neutral-900 border-neutral-300 shadow-md'
              }`}
              style={{ pageBreakInside: 'avoid' }}
            >
              {/* Decorative Corner Borders */}
              <div className={`absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 ${
                printTheme === 'lounge' ? 'border-amber-400/60' : 'border-neutral-900'
              }`} />
              <div className={`absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 ${
                printTheme === 'lounge' ? 'border-amber-400/60' : 'border-neutral-900'
              }`} />
              <div className={`absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 ${
                printTheme === 'lounge' ? 'border-amber-400/60' : 'border-neutral-900'
              }`} />
              <div className={`absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 ${
                printTheme === 'lounge' ? 'border-amber-400/60' : 'border-neutral-900'
              }`} />

              {/* Card Header Resto Branding */}
              <div className="space-y-1 pt-1 pb-3 w-full border-b border-amber-500/20">
                <div className="flex items-center justify-center gap-1.5">
                  <Music className={`w-4 h-4 ${printTheme === 'lounge' ? 'text-amber-400' : 'text-neutral-900'}`} />
                  <span className={`text-xs font-black tracking-widest uppercase font-serif ${
                    printTheme === 'lounge' ? 'text-amber-300' : 'text-neutral-900'
                  }`}>
                    LEGEND RESTO
                  </span>
                </div>
                <p className={`text-[9px] tracking-widest uppercase font-semibold ${
                  printTheme === 'lounge' ? 'text-amber-400/80' : 'text-neutral-600'
                }`}>
                  'N MUSIC LOUNGE
                </p>
              </div>

              {/* Table Name Badge */}
              <div className="my-3">
                <span className={`inline-block px-4 py-1 rounded-full text-base sm:text-lg font-black font-mono tracking-wider shadow-inner ${
                  printTheme === 'lounge'
                    ? 'bg-amber-500 text-neutral-950 border border-amber-400'
                    : 'bg-neutral-900 text-white'
                }`}>
                  {tbl.toUpperCase()}
                </span>
                <p className={`text-[10px] mt-1 font-medium ${
                  printTheme === 'lounge' ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  Pindai untuk Pesan Menu Mandiri
                </p>
              </div>

              {/* High-Resolution Crisp QR Code Container */}
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-neutral-200/80 my-2 flex items-center justify-center">
                <QRCodeSVG
                  value={url}
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* Instructions & WiFi Lounge Info */}
              <div className="mt-3 space-y-2 w-full">
                <div className={`p-2 rounded-xl text-[10px] leading-relaxed border ${
                  printTheme === 'lounge'
                    ? 'bg-neutral-800/70 border-neutral-700/60 text-neutral-300'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}>
                  <p className="font-semibold">
                    1. Buka kamera HP & arahkan ke kode QR
                  </p>
                  <p className="text-[9px] opacity-80">
                    2. Pilih menu makanan/minuman & konfirmasi
                  </p>
                </div>

                <div className={`flex items-center justify-center gap-1.5 text-[9px] font-semibold ${
                  printTheme === 'lounge' ? 'text-amber-400/90' : 'text-neutral-600'
                }`}>
                  <Wifi className="w-3 h-3" />
                  <span>WiFi: <strong className={printTheme === 'lounge' ? 'text-neutral-200' : 'text-neutral-900'}>Legend-Lounge</strong> · Pass: <strong className={printTheme === 'lounge' ? 'text-neutral-200' : 'text-neutral-900'}>legendmusic</strong></span>
                </div>
              </div>

              {/* Non-Print Interactive Action Buttons */}
              <div className="no-print mt-4 pt-3 border-t border-neutral-800 w-full flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(tbl)}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-[10px] font-semibold flex items-center gap-1 border border-neutral-700 transition-colors"
                  title="Salin Tautan QR Meja Ini"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Link'}</span>
                </button>

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl text-[10px] font-semibold flex items-center gap-1 border border-amber-500/30 transition-colors"
                  title="Buka Tampilan Tamu Meja Ini di Tab Baru"
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
  );
};
