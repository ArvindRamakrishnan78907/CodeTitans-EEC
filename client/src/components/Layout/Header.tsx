import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Search, Server } from 'lucide-react';
import { isMockModeActive, setMockModeActive } from '../../api/shortener';
import { useToast } from '../../context/ToastContext';

export const Header: React.FC = () => {
  const [mockActive, setMockActive] = useState(isMockModeActive);
  const [statsInput, setStatsInput] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const toggleMock = () => {
    const nextState = !mockActive;
    setMockActive(nextState);
    setMockModeActive(nextState);
    showToast(
      nextState
        ? 'Switched to Sandbox API Mode (offline testing)'
        : 'Switched to Live API Mode (http://localhost:8000)',
      'info'
    );
  };

  const handleStatsLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statsInput.trim()) return;
    const parts = statsInput.trim().split('/');
    const code = parts[parts.length - 1] || parts[parts.length - 2];
    if (code) {
      navigate(`/stats/${code}`);
      setStatsInput('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#CBD5E1] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center font-bold shadow-xs transition-colors">
            <Link2 className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-[#0F172A] tracking-tight">
              TrimURL
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
              v1.0
            </span>
          </div>
        </Link>

        {/* Quick Stats Search & Environment Selector */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleStatsLookup} className="hidden sm:flex items-center relative">
            <input
              type="text"
              placeholder="Search code stats..."
              value={statsInput}
              onChange={(e) => setStatsInput(e.target.value)}
              className="w-48 md:w-56 text-xs bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder:text-[#64748B] font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
              title="Lookup Link Stats"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Mode Switcher */}
          <button
            onClick={toggleMock}
            className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg border font-medium transition-all cursor-pointer ${
              mockActive
                ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] hover:bg-[#FDE68A]'
                : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#0F172A] hover:bg-[#E2E8F0]'
            }`}
            title="Toggle between Live API and Sandbox API"
          >
            <Server className={`w-3.5 h-3.5 ${mockActive ? 'text-[#F59E0B]' : 'text-[#2563EB]'}`} />
            <span className="hidden md:inline font-semibold">
              {mockActive ? 'Sandbox Mode' : 'Live API (8000)'}
            </span>
            <span className={`w-2 h-2 rounded-full ${mockActive ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
