import React from 'react';
import { ShortenForm } from '../components/ShortenForm';
import { Zap, QrCode, BarChart2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 px-4">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-10 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] text-[#64748B] text-xs font-mono font-medium shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>High-Performance Link Infrastructure</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
          Clean links. Powerful analytics.
        </h1>

        <p className="text-[#64748B] text-sm sm:text-base max-w-xl mx-auto font-normal">
          Shorten long URLs into custom links with instant QR code generation and real-time click tracking.
        </p>
      </div>

      {/* Main Shorten Form */}
      <ShortenForm />

      {/* Feature Grid */}
      <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center mb-3 border border-[#CBD5E1]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">Fast Redirection</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Optimized HTTP 302 redirects with low latency routing.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center mb-3 border border-[#CBD5E1]">
            <QrCode className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">QR Generation</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Instant vector SVG and PNG QR codes downloadable per link.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center mb-3 border border-[#CBD5E1]">
            <BarChart2 className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">Click Analytics</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Real-time metric logging including click counts and timestamps.
          </p>
        </div>
      </div>
    </div>
  );
};
