import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, Upload, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';

interface CameraQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (tableNumber: string) => void;
  currentTable: string;
}

const ALL_TABLES = [
  'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
  'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10',
  'Meja 11', 'Meja 12', 'Meja 13',
];

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  currentTable,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to extract table number from URL or string
  const parseTableNumber = useCallback((data: string): string | null => {
    try {
      if (data.includes('meja=') || data.includes('table=')) {
        const url = new URL(data.startsWith('http') ? data : `https://example.com/${data}`);
        const param = url.searchParams.get('meja') || url.searchParams.get('table');
        if (param) {
          const num = parseInt(param.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num) && num >= 1 && num <= 13) {
            return `Meja ${String(num).padStart(2, '0')}`;
          }
        }
      }

      const numMatch = data.match(/\b([1-9]|1[0-3])\b/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        return `Meja ${String(num).padStart(2, '0')}`;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle scanned value
  const handleFoundCode = useCallback((rawCode: string) => {
    const table = parseTableNumber(rawCode);
    if (table) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(120);
        } catch {
          // ignore
        }
      }
      setScannedResult(table);
      stopCamera();
      setTimeout(() => {
        onScanSuccess(table);
      }, 600);
    } else {
      setErrorMessage(`Barcode terdeteksi ("${rawCode.slice(0, 25)}..."), tapi bukan format meja Legend (Meja 01 - 13).`);
    }
  }, [parseTableNumber, onScanSuccess, stopCamera]);

  // Frame scanning loop
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleFoundCode(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanLoop);
  }, [handleFoundCode]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setScannedResult(null);
    setIsProcessing(true);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setHasCameraPermission(false);
      setErrorMessage('Kamera tidak didukung pada browser/lingkungan ini. Anda dapat memilih meja langsung di bawah.');
      setIsProcessing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraPermission(true);
        animationFrameId.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      setHasCameraPermission(false);
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errName === 'SecurityError') {
        setErrorMessage('Akses kamera tidak diizinkan oleh browser atau dibatasi oleh izin iframe. Anda dapat memilih nomor meja langsung di bawah atau mengunggah foto QR.');
      } else if (errName === 'NotFoundError') {
        setErrorMessage('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setErrorMessage('Kamera tidak dapat diakses saat ini. Silakan pilih meja langsung dari daftar di bawah.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [stopCamera, scanLoop]);

  // File Upload scan fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleFoundCode(code.data);
        } else {
          setErrorMessage('QR Code tidak terbaca dari foto yang diunggah. Pastikan gambar jelas.');
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-auto"
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Camera className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300">Pindai Barcode / QR Meja Baru</h3>
                  <p className="text-[10px] text-neutral-400">
                    Posisi sekarang: <strong className="text-neutral-200">{currentTable}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Area */}
            <div className="relative aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Overlay with Laser Motion */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-48 h-48 border-2 border-amber-400/40 rounded-2xl flex items-center justify-center overflow-hidden">
                  {/* Corner Accents */}
                  <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>

                  {/* Animated Laser Scan Bar */}
                  <motion.div
                    animate={{ y: [-80, 80, -80] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.95)]"
                  />
                </div>
              </div>

              {/* Scanned Success Notification */}
              {scannedResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center space-y-2"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-100">QR Code Dikenali!</h4>
                  <p className="text-xs text-amber-300 font-mono font-bold">
                    Berpindah ke {scannedResult}
                  </p>
                </motion.div>
              )}

              {/* Friendly Permission Notice Overlay */}
              {errorMessage && !scannedResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed px-2">
                    {errorMessage}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Akses Kamera Lagi</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Action Controls & Accessible Table Selector */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-3 max-h-56 overflow-y-auto">
              <div className="flex items-center gap-2">
                <label className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer text-center flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unggah Foto QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Direct Table Selector (Always available if camera denied or for testing) */}
              <div className="pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    Pilih Nomor Meja Baru Langsung:
                  </span>
                  <span className="text-[9px] text-amber-400/80">Meja 01 - 13</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_TABLES.map((tbl) => {
                    const isCurrent = tbl === currentTable;
                    return (
                      <button
                        key={tbl}
                        type="button"
                        onClick={() => {
                          handleFoundCode(`https://legend-resto.app/?meja=${tbl.replace('Meja ', '')}`);
                        }}
                        disabled={isCurrent}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                          isCurrent
                            ? 'bg-neutral-800 text-neutral-500 border-neutral-800 opacity-50 cursor-not-allowed'
                            : 'bg-neutral-800/90 text-neutral-200 border-neutral-700 hover:bg-amber-500 hover:text-neutral-950 hover:border-amber-400'
                        }`}
                      >
                        {tbl}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
