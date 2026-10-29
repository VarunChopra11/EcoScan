import React from 'react';
import { Sparkles, Check, Lock, ExternalLink, Tag } from 'lucide-react';
import { Offer } from '../../types';
import { Badge } from '../common/Badge';

interface OfferCardProps {
  offer: Offer;
  currentPoints: number;
  onRedeem: (offer: Offer) => void;
  onViewCode: (offer: Offer) => void;
  isRedeeming: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  currentPoints,
  onRedeem,
  onViewCode,
  isRedeeming,
}) => {
  const pointsRemaining = Math.max(0, offer.points_cost - currentPoints);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
        offer.is_redeemed
          ? 'border-emerald-200 bg-emerald-50/30'
          : offer.is_unlocked
          ? 'border-brand-300 bg-white'
          : 'border-slate-200 bg-white/70 opacity-90'
      }`}
    >
      <div>
        {/* Brand & Badge Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {offer.brand}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {offer.category}
            </span>
            {offer.badge && (
              <Badge variant={offer.is_unlocked ? 'green' : 'amber'} size="sm">
                {offer.badge}
              </Badge>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h4 className="mt-2 text-sm font-bold text-slate-900 leading-snug">
          {offer.title}
        </h4>
        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
          {offer.description}
        </p>

        {/* Cost & Progress */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1 font-bold text-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{offer.points_cost} EcoPoints</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {offer.is_redeemed
                ? 'Claimed'
                : offer.is_unlocked
                ? 'Goal Met!'
                : `${pointsRemaining} pts needed`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                offer.is_redeemed
                  ? 'bg-emerald-500'
                  : offer.is_unlocked
                  ? 'bg-brand-500'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${offer.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {offer.partner_url && (
          <a
            href={offer.partner_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
          >
            <span>Brand website</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {offer.is_redeemed ? (
          <button
            onClick={() => onViewCode(offer)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100/70 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>View Voucher Code</span>
          </button>
        ) : offer.is_unlocked ? (
          <button
            onClick={() => onRedeem(offer)}
            disabled={isRedeeming}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-brand-500/20 hover:from-brand-700 hover:to-emerald-700 transition"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Redeem Now</span>
          </button>
        ) : (
          <div className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Locked</span>
          </div>
        )}
      </div>
    </div>
  );
};
