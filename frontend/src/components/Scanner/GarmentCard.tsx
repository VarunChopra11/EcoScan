import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { GarmentItem } from '../../types';
import { Badge } from '../common/Badge';

interface GarmentCardProps {
  item: GarmentItem;
}

export const GarmentCard: React.FC<GarmentCardProps> = ({ item }) => {
  const getRatingVariant = (rating: string): 'green' | 'blue' | 'amber' | 'red' => {
    if (rating === 'A+' || rating === 'A') return 'green';
    if (rating === 'B') return 'blue';
    if (rating === 'C') return 'amber';
    return 'red';
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
            <Badge variant={getRatingVariant(item.eco_rating)} size="sm">
              Grade {item.eco_rating}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 capitalize">
            {item.category} • {item.material} {item.color ? `(${item.color})` : ''}
          </p>
        </div>

        {/* Confidence metric */}
        <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-100">
          <ShieldCheck className="h-3 w-3 text-slate-400" />
          <span>{Math.round(item.confidence * 100)}% match</span>
        </div>
      </div>

      {item.description && (
        <p className="mt-2 text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
          {item.description}
        </p>
      )}

      {/* Carbon Metrics Grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center">
        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            Actual Footprint
          </span>
          <span className="text-sm font-bold text-slate-900">
            {item.estimated_co2_kg}{' '}
            <span className="text-[10px] font-normal text-slate-500">kg</span>
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            Baseline
          </span>
          <span className="text-sm font-medium text-slate-600">
            {item.baseline_co2_kg}{' '}
            <span className="text-[10px] font-normal text-slate-400">kg</span>
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            Eco-Savings
          </span>
          <span
            className={`text-sm font-bold ${
              item.co2_saved_kg > 0 ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {item.co2_saved_kg > 0 ? `-${item.co2_saved_kg}` : '0.0'}{' '}
            <span className="text-[10px] font-normal text-slate-500">kg</span>
          </span>
        </div>
      </div>

      {/* Care tip */}
      {item.care_recommendation && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/40 p-2.5 text-[11px] text-brand-950">
          <Sparkles className="h-3.5 w-3.5 text-brand-600 shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-brand-900">Care Advice:</strong>{' '}
            {item.care_recommendation}
          </span>
        </div>
      )}
    </div>
  );
};
