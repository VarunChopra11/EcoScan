import React from 'react';
import { Leaf, Sparkles, RotateCcw, Cpu } from 'lucide-react';

interface NavbarProps {
  currentPoints: number;
  visionMode: string;
  isAzure: boolean;
  onResetDemo: () => void;
  onNavigateToRedeem: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPoints,
  visionMode,
  isAzure,
  onResetDemo,
  onNavigateToRedeem,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-md shadow-brand-500/20">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-lg">EcoScan</span>
              <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800 uppercase tracking-wider">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Garment Carbon Footprint & Circular Rewards
            </p>
          </div>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Vision mode badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 font-medium">
            <Cpu className="h-3.5 w-3.5 text-brand-600" />
            <span>{isAzure ? 'Azure GPT-4o' : visionMode}</span>
          </div>

          {/* Points Pill */}
          <button
            onClick={onNavigateToRedeem}
            className="group flex items-center gap-2 rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/60 px-3 py-1.5 shadow-sm transition hover:scale-[1.02] hover:border-amber-400 focus:outline-none"
            title="Click to view redeemable rewards"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
              <Sparkles className="h-3 w-3" />
            </div>
            <span className="text-xs font-bold text-amber-900">
              {currentPoints} <span className="font-semibold text-amber-700">EcoPts</span>
            </span>
          </button>

          {/* Reset Demo button */}
          <button
            onClick={onResetDemo}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title="Reset demo session and points"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
