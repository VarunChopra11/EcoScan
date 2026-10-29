import React from 'react';
import {
  Leaf,
  Sparkles,
  Database,
  Cpu,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface LandingPageProps {
  onSelectTestMode: () => void;
  onSelectProdMode: () => void;
  isAzure: boolean;
  dbMode?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTestMode,
  onSelectProdMode,
  isAzure,
  dbMode,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-md shadow-brand-500/20">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-slate-900">EcoScan</span>
              <span className="ml-2 rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800 uppercase tracking-wider">
                Dual-Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 font-medium">
              <Cpu className="h-3.5 w-3.5 text-brand-600" />
              <span>{isAzure ? 'Azure GPT-4o' : 'EcoScan Engine'}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 font-medium">
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>{dbMode === 'mongodb_cluster' ? 'MongoDB Cluster' : 'Persistent Storage'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>AI-Powered Clothing Carbon Footprint & Circular Rewards</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Know the Climate Impact of Every Garment in Seconds
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            EcoScan analyzes clothing photographs with computer vision, estimates cradle-to-grave
            carbon footprints (kg CO₂e), measures emissions avoided against fast-fashion benchmarks,
            and awards EcoReward points redeemable with sustainable brand partners.
          </p>
        </div>

        {/* Dual Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Card 1: Test Build */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-brand-400 hover:shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="blue" size="md">
                  In-Memory • No Auth • Sandbox
                </Badge>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <RotateCcw className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Test Build
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Original Take-Home Challenge Specification
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Experience the exact assignment implementation with an in-memory session store.
                Ideal for evaluators seeking zero-friction testing of scoring logic and demo flows.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span><strong>In-memory data store:</strong> Zero database setup needed</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span><strong>1-Click Apparel Presets:</strong> Test drive tees, jeans, jackets</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span><strong>Interactive Webcam & Upload:</strong> Real-time capture</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span><strong>Session Reset Button:</strong> Refresh wallet & history in 1 click</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onSelectTestMode}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-slate-900 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-[0.99]"
              >
                <span>Launch Test Build (Assignment Mode)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Production Build */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white p-6 sm:p-8 shadow-sm transition-all hover:border-emerald-500 hover:shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="green" size="md">
                  Persistent • Clerk Auth • MongoDB Wallet
                </Badge>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-xs">
                  <Database className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                  Production Build
                </h3>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  Scalable Cloud Architecture with Data Isolation
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Full-featured production application with Clerk email authentication, MongoDB
                cloud persistence, user-specific data isolation, and a persistent EcoReward wallet.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-emerald-100">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>Clerk Authentication:</strong> Email login, signup, user profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>MongoDB Persistence:</strong> Scans, wallets, & promo codes saved</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>Strict Data Isolation:</strong> Token-verified identity (JWT sub)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>Persistent Wallet:</strong> Points balance survives reloads & logins</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-emerald-100">
              <button
                type="button"
                onClick={onSelectProdMode}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:from-brand-700 hover:to-emerald-700 transition active:scale-[0.99]"
              >
                <span>Launch Production Build (Clerk + Mongo)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>EcoScan Dual-Mode Platform</span>
            <span>•</span>
            <span className="font-normal text-slate-500">FastAPI & React Take-Home Engineering</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Certified Cradle-to-Grave Apparel Carbon Accounting
          </div>
        </div>
      </footer>
    </div>
  );
};
