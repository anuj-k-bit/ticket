import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, ShieldCheck } from 'lucide-react';

export const QRScannerModal = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    let scanner = null;

    // Initialize scanner instance targeting container element 'qr-reader'
    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          if (decodedText) {
            onScanSuccess(decodedText);
            if (scanner) {
              scanner.clear().catch((err) => console.warn('Failed to clear scanner:', err));
            }
          }
        },
        (errorMessage) => {
          // Silent frame parse error
        }
      );
    } catch (err) {
      console.error('Failed to initialize QR Code scanner:', err);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((err) => console.warn('Cleanup error:', err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-800 space-y-5 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Scan Attendee Ticket QR</h3>
            <p className="text-slate-400 text-xs">Point camera at attendee digital ticket pass</p>
          </div>
        </div>

        {/* Camera HTML5 Viewport Container */}
        <div className="p-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div id="qr-reader" className="w-full"></div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Automatic Auto-Checkin on QR Code Detection
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
