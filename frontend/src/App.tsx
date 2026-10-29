import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TabNavigation } from './components/TabNavigation';
import { ScannerView } from './components/Scanner/ScannerView';
import { OffersView } from './components/Redeem/OffersView';
import { HistoryView } from './components/History/HistoryView';
import { TabType, Offer, UserHistoryResponse, ScanResponse } from './types';
import { getOffers, getHistory, resetHistory, checkHealth } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [history, setHistory] = useState<UserHistoryResponse | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number>(50);
  const [visionMode, setVisionMode] = useState<string>('EcoScan Engine');
  const [isAzure, setIsAzure] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      const [offersData, historyData, healthData] = await Promise.all([
        getOffers().catch(() => []),
        getHistory().catch(() => null),
        checkHealth().catch(() => null),
      ]);

      setOffers(offersData);
      if (historyData) {
        setHistory(historyData);
        setCurrentPoints(historyData.stats.current_points);
      }
      if (healthData) {
        setIsAzure(healthData.azure_openai_configured);
        setVisionMode(healthData.vision_mode);
      }
    } catch (e) {
      console.warn('Initial data load error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScanSuccess = (scan: ScanResponse) => {
    showToast(`🎉 +${scan.points_awarded} EcoPoints earned!`);
    loadData();
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset demo session, point balances, and history back to defaults?')) {
      await resetHistory();
      await loadData();
      showToast('Demo session reset successfully.');
    }
  };

  const unlockedCount = offers.filter((o) => o.is_unlocked && !o.is_redeemed).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-900 text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-in slide-in-from-bottom duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentPoints={currentPoints}
        visionMode={visionMode}
        isAzure={isAzure}
        onResetDemo={handleResetDemo}
        onNavigateToRedeem={() => setActiveTab('redeem')}
      />

      {/* Segmented Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        unlockedOffersCount={unlockedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {activeTab === 'scan' && (
          <ScannerView
            onScanSuccess={handleScanSuccess}
            onNavigateToRedeem={() => setActiveTab('redeem')}
          />
        )}

        {activeTab === 'redeem' && (
          <OffersView
            offers={offers}
            currentPoints={currentPoints}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onNavigateToScan={() => setActiveTab('scan')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span>EcoScan</span>
            <span>•</span>
            <span className="font-normal text-slate-500">Clothing Carbon Footprint Scanner</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Built for Reewild Take-Home Challenge • Certified Cradle-to-Grave LCA Accounting
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
