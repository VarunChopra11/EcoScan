import React from 'react';
import {
  History,
  Layers,
  Leaf,
  Sparkles,
  Tag,
  Camera,
  Calendar,
} from 'lucide-react';
import { UserHistoryResponse } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface HistoryViewProps {
  history: UserHistoryResponse | null;
  onNavigateToScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onNavigateToScan,
}) => {
  const stats = history?.stats;
  const scans = history?.scans || [];
  const redemptions = history?.redeemed_offers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <History className="h-4 w-4 text-brand-600" />
          <span>Sustainability Ledger</span>
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Your Lifetime Impact Summary
        </h2>
        <p className="mt-1 text-xs text-slate-600 max-w-xl">
          Tracking every apparel scan, lifecycle emissions footprint, carbon savings avoided
          through conscious choices, and circular partner redemptions.
        </p>
      </div>

      {/* Lifetime Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Scans"
          value={stats?.total_scans || 0}
          subtext={`${stats?.total_items_scanned || 0} items analyzed`}
          icon={<Camera className="h-4 w-4" />}
        />
        <StatCard
          label="CO₂ Monitored"
          value={stats?.total_co2_kg || 0}
          unit="kg"
          subtext="Total footprint evaluated"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="CO₂ Saved"
          value={stats?.total_co2_saved_kg || 0}
          unit="kg"
          variant="highlight"
          subtext="Vs conventional benchmark"
          icon={<Leaf className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          label="EcoPoints Balance"
          value={stats?.current_points || 0}
          unit="pts"
          variant="accent"
          subtext={`${stats?.lifetime_points_earned || 0} pts lifetime`}
          icon={<Sparkles className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Redeemed Offers Section */}
      {redemptions.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Claimed Partner Promo Codes ({redemptions.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {redemptions.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-white p-3 shadow-xs"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {r.brand}
                  </span>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {r.title}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="font-mono text-xs font-black text-emerald-700">
                    {r.code}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.redeemed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan History Timeline */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Chronological Scan History
        </h3>

        {scans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
              <Camera className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Clothing Scanned Yet</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              Scan your first clothing item or test drive a preset to start building your sustainability ledger.
            </p>
            <button
              onClick={onNavigateToScan}
              className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition"
            >
              Scan an Outfit Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const formattedDate = new Date(scan.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={scan.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="green" size="sm">
                        Grade {scan.overall_eco_rating}
                      </Badge>
                      <span className="text-xs font-bold text-slate-800">
                        {scan.total_co2_kg} kg CO₂e Total
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Garments tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {scan.items.map((item, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-medium"
                        >
                          {item.name} ({item.estimated_co2_kg} kg)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Points Earned
                      </span>
                      <span className="text-sm font-black text-amber-700">
                        +{scan.points_awarded} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
