import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/clerk-react';
import {
  Leaf,
  Sparkles,
  LogOut,
  Camera,
  Gift,
  History,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
  Lock,
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

/**
 * Rendered when Clerk publishable key is not configured in the environment.
 * Informs the user clearly without providing an insecure mock bypass.
 */
const ClerkConfigNotice: React.FC<ProductionAppProps> = ({
  onBackToLanding,
  onSwitchToTestBuild,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
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
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-4 shadow-sm">
            <Lock className="h-7 w-7 text-amber-600" />
          </div>

          <h3 className="text-2xl font-black text-slate-900">
            Clerk Configuration Required
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Production Mode enforces real Clerk email-based authentication and persistent MongoDB data storage.
            To use Production Mode, please add your Clerk publishable key to your environment.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-left font-mono text-xs text-emerald-400 shadow-inner">
            <span className="text-slate-400 block mb-1"># In frontend/.env or root .env:</span>
            <span>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</span>
            <span className="text-slate-400 block mt-2 mb-1"># In backend/.env:</span>
            <span>CLERK_SECRET_KEY=sk_test_...</span>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={onSwitchToTestBuild}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
            >
              <span>Launch Test Build (In-Memory, No Auth Required)</span>
            </button>

            <button
              type="button"
              onClick={onBackToLanding}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Return to EcoScan Home
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        EcoScan Secure Production Build • Clerk Authentication Guard
      </footer>
    </div>
  );
};

/**
 * Clerk Sign-In / Sign-Up Container using Clerk's official components.
 * Guarantees email verification and prevents unauthenticated access.
 */
const ClerkAuthView: React.FC<ProductionAppProps> = ({
  onBackToLanding,
  onSwitchToTestBuild,
}) => {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to EcoScan Home</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
              Production Build
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-3 shadow-md">
            <Leaf className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {authMode === 'sign-in' ? 'Sign In to EcoScan' : 'Create an EcoScan Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Persistent MongoDB carbon accounting with verified email authentication.
          </p>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-4 inline-flex rounded-xl bg-slate-200 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('sign-in')}
              className={`rounded-lg px-4 py-1.5 transition ${
                authMode === 'sign-in'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('sign-up')}
              className={`rounded-lg px-4 py-1.5 transition ${
                authMode === 'sign-up'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Real Clerk Components */}
        <div className="w-full max-w-md flex justify-center">
          {authMode === 'sign-in' ? (
            <SignIn routing="hash" />
          ) : (
            <SignUp routing="hash" />
          )}
        </div>

        <div className="mt-8 text-center space-y-2">
          <button
            type="button"
            onClick={onSwitchToTestBuild}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
          >
            Launch Test Build (Assignment Mode • In-Memory • No Auth)
          </button>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        EcoScan Production Mode • Real Clerk Email Verification
      </footer>
    </div>
  );
};

/**
 * Authenticated Production Workspace.
 * Active strictly when a verified Clerk session exists.
 * Passes the session Bearer token to all backend production API calls.
 */
const ProductionAuthenticatedDashboard: React.FC<ProductionAppProps> = ({
  onBackToLanding,
  onSwitchToTestBuild,
}) => {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<'dashboard' | TabType>('dashboard');
  const [dashboardData, setDashboardData] = useState<ProductionDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Offer modal state
  const [activeModalOffer, setActiveModalOffer] = useState<Offer | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication session token is unavailable. Please sign in again.');
      }
      const data = await getProductionDashboard(token);
      setDashboardData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load production dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleScanSuccess = async (scan: ScanResponse) => {
    showToast(`🎉 +${scan.points_awarded} EcoPoints saved to your persistent MongoDB wallet!`);
    await fetchDashboard();
  };

  const handleCustomScan = async (params: {
    file?: File;
    base64Data?: string;
    sampleHint?: string;
  }): Promise<ScanResponse> => {
    const token = await getToken();
    if (!token) {
      throw new Error('Authentication required to save scans.');
    }
    return productionScanImage({ ...params, token });
  };

  const handleRedeemOffer = async (offer: Offer) => {
    setIsRedeeming(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required to redeem offers.');
      }
      const res = await redeemProductionOffer(offer.id, token);
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

  const userStats = dashboardData?.stats;
  const recentScans = dashboardData?.recent_scans || [];
  const offersList = dashboardData?.offers || [];
  const userDisplayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Member';
  const userEmail = user?.primaryEmailAddress?.emailAddress || '';

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
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Persistent Wallet Balance */}
            <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{userStats?.current_points ?? 0} EcoPoints</span>
            </div>

            {/* Clerk User Button & Details */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-none">{userDisplayName}</span>
                {userEmail && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{userEmail}</span>
                )}
              </div>

              {/* Clerk's official UserButton */}
              <UserButton />

              <button
                type="button"
                onClick={() => signOut()}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title="Sign out of Clerk"
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
              <span>History</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {errorMessage && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchDashboard}
              className="text-xs font-bold text-rose-800 underline ml-3 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Dashboard View */}
        {activeTab === 'dashboard' && (
          isLoading ? (
            <div className="py-16 text-center text-xs font-semibold text-slate-500">
              Loading persistent dashboard...
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Hero Banner */}
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="green" size="md">
                        Clerk Verified
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        MongoDB Persistent Account
                      </span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                      Welcome back, {userDisplayName}!
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 max-w-md">
                      Your apparel carbon footprint calculations and circular points are securely tracked in your account.
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
                        {userStats?.current_points ?? 0}{' '}
                        <span className="text-sm font-semibold text-amber-700">EcoPts</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Scans Completed"
                  value={userStats?.total_scans ?? 0}
                  subtext={`${userStats?.total_items_scanned ?? 0} garments scanned`}
                  icon={<Camera className="h-4 w-4" />}
                />
                <StatCard
                  label="CO₂ Monitored"
                  value={userStats?.total_co2_kg ?? 0}
                  unit="kg"
                  subtext="Total footprint evaluated"
                  icon={<Leaf className="h-4 w-4" />}
                />
                <StatCard
                  label="CO₂ Saved"
                  value={userStats?.total_co2_saved_kg ?? 0}
                  unit="kg"
                  variant="highlight"
                  subtext="Vs benchmark fast fashion"
                  icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
                />
                <StatCard
                  label="Points Spent"
                  value={userStats?.total_points_spent ?? 0}
                  unit="pts"
                  variant="accent"
                  subtext={`${userStats?.lifetime_points_earned ?? 0} pts lifetime`}
                  icon={<Gift className="h-4 w-4 text-amber-500" />}
                />
              </div>

              {/* Recent Scans Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Recent Scans ({recentScans.length})
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
                    No scans saved yet. Tap "Scan Apparel" to analyze your first clothing piece.
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

              {/* Featured Rewards Strip */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Available Circular Rewards
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
                      currentPoints={userStats?.current_points ?? 0}
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
            onCustomScan={handleCustomScan}
          />
        )}

        {/* 3. Redeem Offers View */}
        {activeTab === 'redeem' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Redeem Circular Rewards</h2>
                <p className="text-xs text-slate-500">
                  Points deductions update your persistent wallet atomically.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>{userStats?.current_points ?? 0} EcoPoints</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offersList.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  currentPoints={userStats?.current_points ?? 0}
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

        {/* Offer Code Modal */}
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

/**
 * Top-level Production Mode entrypoint.
 * If Clerk publishable key is present, wraps tree with ClerkProvider.
 * If absent, renders clear configuration guidance without fake mock bypasses.
 */
export const ProductionApp: React.FC<ProductionAppProps> = (props) => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
  const isClerkConfigured = Boolean(clerkPubKey && clerkPubKey.startsWith('pk_'));

  if (!isClerkConfigured) {
    return <ClerkConfigNotice {...props} />;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedOut>
        <ClerkAuthView {...props} />
      </SignedOut>
      <SignedIn>
        <ProductionAuthenticatedDashboard {...props} />
      </SignedIn>
    </ClerkProvider>
  );
};
