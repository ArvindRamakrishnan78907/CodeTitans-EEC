import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrUrl: string;
  shortUrl: string;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, qrUrl, shortUrl }) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qrcode-${shortUrl.split('/').pop()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-6 shadow-xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold text-[#0F172A] mb-1">QR Code</h3>
        <p className="text-xs text-[#64748B] mb-5 truncate font-mono">{shortUrl}</p>

        {/* QR Card Background: #F1F5F9 */}
        <div className="bg-[#F1F5F9] border border-[#CBD5E1] p-3 rounded-xl inline-block shadow-inner mb-5">
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-44 h-44 object-contain bg-white p-1 rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                shortUrl
              )}`;
            }}
          />
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-xl transition-colors border border-[#CBD5E1]"
            title="Open link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
