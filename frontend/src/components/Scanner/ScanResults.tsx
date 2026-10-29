import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { ScanResponse } from '../../types';
import { GarmentCard } from './GarmentCard';
import { Badge } from '../common/Badge';

interface ScanResultsProps {
  results: ScanResponse;
  onScanAnother: () => void;
  onGoToRedeem: () => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({
  results,
  onScanAnother,
  onGoToRedeem,
}) => {
  // Launch celebration confetti when results render
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#f59e0b', '#3b82f6'],
      });
    } catch (e) {
      // safe fallback if confetti fails in headless env
    }
  }, []);

  const getOverallRatingVariant = (rating: string): 'green' | 'blue' | 'amber' | 'red' => {
    if (rating === 'A+' || rating === 'A') return 'green';
    if (rating === 'B') return 'blue';
    if (rating === 'C') return 'amber';
    return 'red';
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={getOverallRatingVariant(results.overall_eco_rating)} size="md">
                Eco-Grade {results.overall_eco_rating}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {results.items.length} {results.items.length === 1 ? 'garment' : 'garments'} identified
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {results.total_co2_kg}{' '}
              <span className="text-base font-semibold text-slate-500">kg CO₂e Total</span>
            </h2>

            <p className="mt-1 text-xs text-slate-600 max-w-md">
              {results.summary_tip}
            </p>
          </div>

          {/* Points Award Card */}
          <div className="flex flex-col items-center rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:min-w-[220px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>EcoPoints Awarded</span>
            </div>
            <div className="mt-1 text-3xl font-black text-amber-700">
              +{results.points_awarded}
            </div>

            {/* Breakdown details */}
            <div className="mt-2 w-full space-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Base scan bonus:</span>
                <span className="font-semibold text-slate-700">+{results.points_breakdown.base_scan}</span>
              </div>
              <div className="flex justify-between">
                <span>Eco-savings avoided:</span>
                <span className="font-semibold text-emerald-600">
                  +{results.points_breakdown.eco_savings}
                </span>
              </div>
              {results.points_breakdown.low_impact_bonus > 0 && (
                <div className="flex justify-between">
                  <span>Low-footprint bonus:</span>
                  <span className="font-semibold text-brand-600">
                    +{results.points_breakdown.low_impact_bonus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identified Garments List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Garment Carbon Footprint Breakdown
          </h3>
          <span className="text-xs text-slate-500">
            Source: {results.vision_source === 'azure_openai_gpt4o' ? 'Azure GPT-4o' : 'EcoScan Engine'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.items.map((item, idx) => (
            <GarmentCard key={idx} item={item} />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          onClick={onScanAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Scan Another Outfit</span>
        </button>

        <button
          onClick={onGoToRedeem}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-700 hover:to-emerald-700 transition"
        >
          <Tag className="h-4 w-4" />
          <span>Redeem Sustainable Offers</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
