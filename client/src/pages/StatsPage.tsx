import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MousePointerClick,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  ArrowLeft,
  AlertCircle,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { shortenerApi } from '../api/shortener';
import type { StatsResponse } from '../types/api';
import { Skeleton } from '../components/UI/Skeleton';
import { QrModal } from '../components/UI/QrModal';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/env';

export const StatsPage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const { showToast } = useToast();

  const fetchStats = async () => {
    if (!shortCode) return;
    setLoading(true);
    setError(null);
    setIs404(false);

    try {
      const data = await shortenerApi.getStats(shortCode);
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load link statistics';
      setError(msg);
      if (msg.toLowerCase().includes('not found') || (err as { status?: number }).status === 404) {
        setIs404(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [shortCode]);

  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const fullShortUrl = `${cleanBase}/${shortCode}`;
  const qrUrl = shortCode ? shortenerApi.getQrCodeUrl(shortCode) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShortUrl);
      setCopied(true);
      showToast('Short link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Failed to copy short URL', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="py-10 px-4 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shortener</span>
        </Link>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 bg-[#E2E8F0]" />
            <Skeleton className="h-8 w-24 bg-[#E2E8F0]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 w-full bg-[#E2E8F0]" />
            <Skeleton className="h-28 w-full bg-[#E2E8F0]" />
          </div>

          <Skeleton className="h-20 w-full bg-[#E2E8F0]" />
          <Skeleton className="h-40 w-full bg-[#E2E8F0]" />
        </div>
      )}

      {/* 404 / Error State */}
      {!loading && (is404 || error) && (
        <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-8 text-center max-w-md mx-auto shadow-xs space-y-5 animate-fade-in">
          <div className="w-12 h-12 bg-[#FEF2F2] border border-[#EF4444]/40 text-[#EF4444] rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">
              {is404 ? 'Short Link Not Found' : 'Error Loading Stats'}
            </h2>
            <p className="text-xs text-[#64748B]">
              {is404
                ? `No link found matching code "${shortCode}".`
                : error}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] border border-[#CBD5E1] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
            >
              <span>Create Link</span>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Dashboard View */}
      {!loading && stats && !is404 && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-6 shadow-xs">
            <div>
              <span className="text-xs font-mono font-bold text-[#2563EB] block mb-1">/{shortCode}</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Link Analytics
              </h1>
            </div>

            {/* Quick Copy Bar */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2 pl-3">
              <span className="font-mono text-xs font-medium text-[#2563EB] truncate max-w-[200px]">
                {fullShortUrl}
              </span>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  copied
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                }`}
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Clicks Card */}
            <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-5 flex items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] text-[#2563EB] flex items-center justify-center shrink-0">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Total Clicks
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {stats.clicks.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Creation Date Card */}
            <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-5 flex items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Created Date
                </span>
                <span className="text-sm font-bold text-[#0F172A] tracking-tight">
                  {formatDate(stats.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Destination URL Card */}
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
              <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Target URL</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
              <span className="font-mono text-xs text-[#0F172A] break-all font-medium">
                {stats.longURL}
              </span>
              <a
                href={stats.longURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] border border-[#CBD5E1] rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                <span>Visit URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* QR Card Background: #F1F5F9 */}
          <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-base font-bold text-[#0F172A]">QR Code</h3>
              <p className="text-xs text-[#64748B] max-w-sm">
                Scan or download the high-resolution QR code for this link.
              </p>
              <button
                onClick={() => setShowQrModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] border border-[#CBD5E1] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Expand & Download</span>
              </button>
            </div>

            <div
              onClick={() => setShowQrModal(true)}
              className="bg-white border border-[#CBD5E1] p-2.5 rounded-xl shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-28 h-28 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    fullShortUrl
                  )}`;
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {shortCode && (
        <QrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          qrUrl={qrUrl}
          shortUrl={fullShortUrl}
        />
      )}
    </div>
  );
};
