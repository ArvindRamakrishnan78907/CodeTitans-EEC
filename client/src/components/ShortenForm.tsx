import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Link as LinkIcon,
  Copy,
  Check,
  QrCode,
  BarChart3,
  Loader2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { shortenerApi } from '../api/shortener';
import { useToast } from '../context/ToastContext';
import { QrModal } from './UI/QrModal';

export const ShortenForm: React.FC = () => {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [createdResult, setCreatedResult] = useState<{
    shortUrl: string;
    shortCode: string;
    qrUrl: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const { showToast } = useToast();

  const validateLongUrl = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) {
      return 'Please enter a URL to shorten';
    }
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'Please enter a valid URL starting with http:// or https://';
      }
    } catch {
      return 'Please enter a valid URL (e.g. https://example.com)';
    }
    return null;
  };

  const validateCustomAlias = (alias: string): string | null => {
    const trimmed = alias.trim();
    if (!trimmed) return null;
    if (trimmed.length > 16) {
      return 'Custom alias must be 16 characters or less';
    }
    const aliasRegex = /^[a-zA-Z0-9-]+$/;
    if (!aliasRegex.test(trimmed)) {
      return 'Custom alias can only contain letters, numbers, and hyphens (-)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    const urlErr = validateLongUrl(longUrl);
    if (urlErr) {
      setInlineError(urlErr);
      return;
    }

    const aliasErr = validateCustomAlias(customAlias);
    if (aliasErr) {
      setInlineError(aliasErr);
      return;
    }

    setLoading(true);

    try {
      const response = await shortenerApi.shortenUrl({
        long_url: longUrl.trim(),
        custom_alias: customAlias.trim() || undefined,
      });

      const shortUrl = response.short_url;
      const parts = shortUrl.split('/');
      const shortCode = parts[parts.length - 1] || parts[parts.length - 2];
      const qrUrl = shortenerApi.getQrCodeUrl(shortCode);

      setCreatedResult({ shortUrl, shortCode, qrUrl });
      showToast('URL shortened successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to shorten URL';
      setInlineError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdResult) return;
    try {
      await navigator.clipboard.writeText(createdResult.shortUrl);
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleReset = () => {
    setLongUrl('');
    setCustomAlias('');
    setCreatedResult(null);
    setInlineError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card Background: #FFFFFF, Borders: #CBD5E1 */}
      <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target URL */}
          <div>
            <label htmlFor="long-url" className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
              Target URL <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#64748B]">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="long-url"
                type="text"
                placeholder="https://example.com/long-page-address..."
                value={longUrl}
                onChange={(e) => {
                  setLongUrl(e.target.value);
                  if (inlineError) setInlineError(null);
                }}
                disabled={loading || !!createdResult}
                className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-[#0F172A] placeholder:text-[#64748B] rounded-xl text-sm transition-colors disabled:opacity-60 font-mono"
              />
            </div>
          </div>

          {/* Custom Alias */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="custom-alias" className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                Custom Alias <span className="text-[#64748B] lowercase font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-[#64748B]">Alphanumeric & hyphens (max 16)</span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#64748B] font-mono text-xs select-none">
                /
              </div>
              <input
                id="custom-alias"
                type="text"
                maxLength={16}
                placeholder="my-alias"
                value={customAlias}
                onChange={(e) => {
                  setCustomAlias(e.target.value);
                  if (inlineError) setInlineError(null);
                }}
                disabled={loading || !!createdResult}
                className="w-full pl-8 pr-4 py-2.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-[#0F172A] placeholder:text-[#64748B] rounded-xl text-sm font-mono transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Inline Error Display (#EF4444) */}
          {inlineError && (
            <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] border border-[#EF4444]/40 rounded-xl text-[#EF4444] text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Primary Button (#2563EB, Hover #1D4ED8) */}
          {!createdResult && (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1D4ED8] text-white font-semibold rounded-xl text-sm transition-colors shadow-xs disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Shorten URL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </form>

        {/* Shortened Result State */}
        {createdResult && (
          <div className="mt-6 pt-6 border-t border-[#CBD5E1] space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#10B981] font-semibold text-xs">
                <Check className="w-4 h-4 p-0.5 bg-[#ECFDF5] border border-[#10B981] rounded-full" />
                <span>Link Ready</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Create Another</span>
              </button>
            </div>

            {/* Copyable Short URL Field */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="flex-1 flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 font-mono text-sm text-[#2563EB] font-medium overflow-x-auto">
                <span className="truncate">{createdResult.shortUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Card Background: #F1F5F9 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-3.5">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div
                  onClick={() => setShowQrModal(true)}
                  className="bg-white border border-[#CBD5E1] p-1.5 rounded-lg cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                  title="Click to expand QR Code"
                >
                  <img
                    src={createdResult.qrUrl}
                    alt="QR Code"
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        createdResult.shortUrl
                      )}`;
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#0F172A]">QR Code</h4>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>View / Download</span>
                  </button>
                </div>
              </div>

              {/* Secondary Button: #E2E8F0 */}
              <Link
                to={`/stats/${createdResult.shortCode}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] border border-[#CBD5E1] rounded-lg text-xs font-semibold transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>View Analytics</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {createdResult && (
        <QrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          qrUrl={createdResult.qrUrl}
          shortUrl={createdResult.shortUrl}
        />
      )}
    </div>
  );
};
