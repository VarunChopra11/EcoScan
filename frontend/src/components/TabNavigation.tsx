import React from 'react';
import { Camera, Gift, History } from 'lucide-react';
import { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unlockedOffersCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onChangeTab,
  unlockedOffersCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'scan',
      label: 'Scanner',
      icon: <Camera className="h-4 w-4" />,
    },
    {
      id: 'redeem',
      label: 'Redeem Offers',
      icon: <Gift className="h-4 w-4" />,
      badge: unlockedOffersCount > 0 ? unlockedOffersCount : undefined,
    },
    {
      id: 'history',
      label: 'Impact History',
      icon: <History className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex justify-center border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
      <nav className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
