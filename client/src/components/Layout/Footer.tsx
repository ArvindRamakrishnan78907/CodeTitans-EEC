import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#CBD5E1] bg-[#FFFFFF] py-6 mt-auto text-[#64748B] text-xs">
      <div className="max-w-6xl mx-auto px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium text-[#0F172A]">
          <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>TrimURL — Professional URL Infrastructure</span>
        </div>
        <p className="text-[#64748B] font-mono text-[11px]">
          React • TypeScript • Tailwind CSS
        </p>
      </div>
    </footer>
  );
};
