import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 px-4 text-center max-w-md mx-auto">
      <div className="w-14 h-14 bg-[#FFFFFF] border border-[#CBD5E1] text-[#64748B] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
        <Search className="w-7 h-7 text-[#2563EB]" />
      </div>

      <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">Page Not Found</h1>
      <p className="text-xs text-[#64748B] mb-6">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
