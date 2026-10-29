import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Leaf,
  Sparkles,
  Database,
  LogOut,
  Camera,
  Gift,
  History,
  LayoutDashboard,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import {
  ProductionDashboardResponse,
  Offer,
  ScanResponse,
  TabType,
} from '../../types';
import {
  getProductionDashboard,
  productionScanImage,
  redeemProductionOffer,
} from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { ScannerView } from '../Scanner/ScannerView';
import { OfferCard } from '../Redeem/OfferCard';
import { RedeemModal } from '../Redeem/RedeemModal';
import { HistoryView } from '../History/HistoryView';

interface ProductionAppProps {
  onBackToLanding: () => void;
  onSwitchToTestBuild: () => void;
}

export const ProductionApp: React.FC<ProductionAppProps> = ({
  onBackToLanding,
  onSwitchToTestBuild,
}) => {
  // Authentication state
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
  const isClerkAvailable = Boolean(clerkPubKey && clerkPubKey.startsWith('pk_'));

  // Local user identity for demo/test auth when Clerk keys are omitted
  const [activeUser, setActiveUser] = useState<{ id: string; email: string; name: string } | null>(() => {
    const saved = localStorage.getItem('ecoscan_prod_user');
    return saved ? JSON.parse(saved) : { id: 'user_alice', email: 'alice@ecoscan.app', name: 'Alice Sustainable' };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | TabType>('dashboard');
  const [dashboardData, setDashboardData] = useState<ProductionDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Offer modal state
  const [activeModalOffer, setActiveModalOffer] = useState<Offer | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  // Custom email login input
  const [loginEmail, setLoginEmail] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthParams = () => {
    if (!activeUser) return {};
    return { testUserId: activeUser.id };
  };

  const fetchDashboard = async () => {
    if (!activeUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getProductionDashboard(getAuthParams());
      setDashboardData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load production dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('ecoscan_prod_user', JSON.stringify(activeUser));
      fetchDashboard();
    }
  }, [activeUser]);

  const handleSwitchUser = (userId: string, email: string, name: string) => {
    const newUser = { id: userId, email, name };
    setActiveUser(newUser);
    showToast(`Switched account to ${name} (${userId})`);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    const cleanId = 'user_' + loginEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const newUser = { id: cleanId, email: loginEmail, name: loginEmail.split('@')[0] };
    setActiveUser(newUser);
    setLoginEmail('');
    showToast(`Signed in as ${newUser.email}`);
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.removeItem('ecoscan_prod_user');
  };

  const handleScanSuccess = async (scan: ScanResponse) => {
    showToast(`🎉 +${scan.points_awarded} EcoPoints saved to your persistent MongoDB wallet!`);
    await fetchDashboard();
  };

  const handleRedeemOffer = async (offer: Offer) => {
    setIsRedeeming(true);
    try {
      const res = await redeemProductionOffer(offer.id, getAuthParams());
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#f59e0b', '#3b82f6'],
        });
      } catch (e) {}

      setActiveModalOffer({
        ...offer,
        is_redeemed: true,
        redemption_code: res.code,
      });
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Redemption failed. Check your points balance.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // If user is logged out, show the auth screen
  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to EcoScan Home</span>
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Production Build
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-4 shadow-sm">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">Sign In to EcoScan</h3>
            <p className="mt-1 text-xs text-slate-500">
              Access your persistent MongoDB carbon ledger & circular reward wallet.
            </p>

            {/* Email form */}
            <form onSubmit={handleCustomLogin} className="mt-6 space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-brand-700 hover:to-emerald-700 transition"
              >
                Sign In / Sign Up
              </button>
            </form>

            {/* Quick Demo Account Selector for Data Isolation Verification */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Or Select a Demo Account to Verify Data Isolation:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchUser('user_alice', 'alice@ecoscan.app', 'Alice Sustainable')}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:border-brand-500 hover:bg-brand-50/50 transition"
                >
                  <span className="text-xs font-bold text-slate-900 block">Alice</span>
                  <span className="text-[10px] text-slate-500 truncate block">alice@ecoscan.app</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchUser('user_bob', 'bob@ecoscan.app', 'Bob Eco')}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:border-brand-500 hover:bg-brand-50/50 transition"
                >
                  <span className="text-xs font-bold text-slate-900 block">Bob</span>
                  <span className="text-[10px] text-slate-500 truncate block">bob@ecoscan.app</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userStats = dashboardData?.stats;
  const recentScans = dashboardData?.recent_scans || [];
  const offersList = dashboardData?.offers || [];
  const dbMode = dashboardData?.database_mode || 'persistent_storage';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-900 text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-in slide-in-from-bottom duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Production Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              title="Return to EcoScan Home"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Landing</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 text-base">EcoScan</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                Production
              </span>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Database indicator */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 font-medium">
              <Database className="h-3 w-3 text-emerald-600" />
              <span>{dbMode === 'mongodb_cluster' ? 'MongoDB Cluster' : 'Persistent Storage'}</span>
            </div>

            {/* Auth indicator */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 font-medium">
              <ShieldCheck className="h-3 w-3 text-slate-500" />
              <span>{isClerkAvailable ? 'Clerk Live' : 'Demo Auth'}</span>
            </div>

            {/* Persistent Wallet Balance */}
            <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{userStats?.current_points ?? 50} EcoPoints</span>
            </div>

            {/* User profile & Switcher */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-none">{activeUser.name}</span>
                <span className="text-[10px] text-slate-400">{activeUser.email}</span>
              </div>

              {/* Data Isolation Fast-Switcher */}
              <select
                aria-label="Switch User"
                value={activeUser.id}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'user_alice') handleSwitchUser('user_alice', 'alice@ecoscan.app', 'Alice Sustainable');
                  else if (val === 'user_bob') handleSwitchUser('user_bob', 'bob@ecoscan.app', 'Bob Eco');
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700"
                title="Switch user to verify MongoDB data isolation"
              >
                <option value="user_alice">Alice (User A)</option>
                <option value="user_bob">Bob (User B)</option>
              </select>

              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex justify-center border-t border-slate-100 bg-slate-50/70 px-4 py-2">
          <nav className="inline-flex rounded-xl bg-slate-200/70 p-1 gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'scan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Scan Apparel</span>
            </button>
            <button
              onClick={() => setActiveTab('redeem')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'redeem'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="h-3.5 w-3.5" />
              <span>Redeem Rewards</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>MongoDB History</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Dashboard View */}
        {activeTab === 'dashboard' && (
          isLoading ? (
            <div className="py-16 text-center text-xs font-semibold text-slate-500">
              Loading persistent MongoDB dashboard...
            </div>
          ) : (
          <div className="space-y-6">
            {/* User Hero Banner */}
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="green" size="md">
                      Authenticated Account
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      User ID: {activeUser.id}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                    Welcome back, {activeUser.name}!
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 max-w-md">
                    Your scans, carbon reductions, and earned reward points are persistently tracked in MongoDB.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-white/95 p-4 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Wallet Balance
                    </span>
                    <span className="text-2xl font-black text-amber-900 leading-none">
                      {userStats?.current_points ?? 50}{' '}
                      <span className="text-sm font-semibold text-amber-700">EcoPts</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifetime Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Lifetime Scans"
                value={userStats?.total_scans ?? 0}
                subtext={`${userStats?.total_items_scanned ?? 0} garments scanned`}
                icon={<Camera className="h-4 w-4" />}
              />
              <StatCard
                label="CO₂ Monitored"
                value={userStats?.total_co2_kg ?? 0}
                unit="kg"
                subtext="Cradle-to-grave footprint"
                icon={<Leaf className="h-4 w-4" />}
              />
              <StatCard
                label="CO₂ Saved"
                value={userStats?.total_co2_saved_kg ?? 0}
                unit="kg"
                variant="highlight"
                subtext="Vs fast-fashion benchmark"
                icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
              />
              <StatCard
                label="Points Redeemed"
                value={userStats?.total_points_spent ?? 0}
                unit="pts"
                variant="accent"
                subtext={`${userStats?.lifetime_points_earned ?? 50} pts earned`}
                icon={<Gift className="h-4 w-4 text-amber-500" />}
              />
            </div>

            {/* Recent Scans Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent MongoDB Scans ({recentScans.length})
                </h3>
                <button
                  onClick={() => setActiveTab('scan')}
                  className="text-xs font-bold text-brand-700 hover:text-brand-800 transition"
                >
                  + New Scan
                </button>
              </div>

              {recentScans.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No scans saved yet for this account. Tap "Scan Apparel" to audit your first clothing item!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentScans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="green" size="sm">
                            Grade {scan.overall_eco_rating}
                          </Badge>
                          <span className="font-bold text-slate-800">
                            {scan.items.map((i) => i.name).join(', ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(scan.timestamp).toLocaleDateString()} • {scan.total_co2_kg} kg CO₂e
                        </span>
                      </div>
                      <span className="font-bold text-amber-700">+{scan.points_awarded} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Redeemable Offers Strip */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Featured Circular Rewards
                </h3>
                <button
                  onClick={() => setActiveTab('redeem')}
                  className="text-xs font-bold text-brand-700 hover:text-brand-800 transition"
                >
                  View All Offers →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {offersList.slice(0, 3).map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    currentPoints={userStats?.current_points ?? 50}
                    onRedeem={handleRedeemOffer}
                    onViewCode={(o) => setActiveModalOffer(o)}
                    isRedeeming={isRedeeming}
                  />
                ))}
              </div>
            </div>
          </div>
          )
        )}

        {/* 2. Scanner View */}
        {activeTab === 'scan' && (
          <ScannerView
            onScanSuccess={handleScanSuccess}
            onNavigateToRedeem={() => setActiveTab('redeem')}
            onCustomScan={(params) => productionScanImage({ ...params, ...getAuthParams() })}
          />
        )}

        {/* 3. Redeem Offers View */}
        {activeTab === 'redeem' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Redeem Circular Rewards</h2>
                <p className="text-xs text-slate-500">
                  Deductions update your persistent MongoDB wallet atomically.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>{userStats?.current_points ?? 50} EcoPoints</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offersList.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  currentPoints={userStats?.current_points ?? 50}
                  onRedeem={handleRedeemOffer}
                  onViewCode={(o) => setActiveModalOffer(o)}
                  isRedeeming={isRedeeming}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. History View */}
        {activeTab === 'history' && (
          <HistoryView
            history={dashboardData ? {
              stats: dashboardData.stats,
              scans: dashboardData.recent_scans,
              redeemed_offers: [],
            } : null}
            onNavigateToScan={() => setActiveTab('scan')}
          />
        )}

        {/* Modal */}
        {activeModalOffer && (
          <RedeemModal
            offer={activeModalOffer}
            onClose={() => setActiveModalOffer(null)}
          />
        )}
      </main>

      {/* Production Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>EcoScan Production Build</span>
            <span>•</span>
            <span className="font-normal text-slate-500">Persistent MongoDB Storage & Clerk Auth</span>
          </div>
          <button
            onClick={onSwitchToTestBuild}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition underline"
          >
            Switch to Test Build (In-Memory)
          </button>
        </div>
      </footer>
    </div>
  );
};
