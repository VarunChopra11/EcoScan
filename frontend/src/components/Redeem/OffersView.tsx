import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, Filter, AlertCircle } from 'lucide-react';
import { Offer } from '../../types';
import { OfferCard } from './OfferCard';
import { RedeemModal } from './RedeemModal';
import { redeemOffer } from '../../services/api';

interface OffersViewProps {
  offers: Offer[];
  currentPoints: number;
  onRefreshData: () => void;
}

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  currentPoints,
  onRefreshData,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'redeemed'>('all');
  const [activeModalOffer, setActiveModalOffer] = useState<Offer | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRedeem = async (offer: Offer) => {
    setIsRedeeming(true);
    setErrorMessage(null);
    try {
      const result = await redeemOffer(offer.id);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#f59e0b', '#3b82f6'],
        });
      } catch (e) {}

      // Update offer with code and open modal
      setActiveModalOffer({
        ...offer,
        is_redeemed: true,
        redemption_code: result.code,
      });
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not redeem offer. Please check your points balance.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const filteredOffers = offers.filter((o) => {
    if (filter === 'unlocked') return o.is_unlocked && !o.is_redeemed;
    if (filter === 'locked') return !o.is_unlocked && !o.is_redeemed;
    if (filter === 'redeemed') return o.is_redeemed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <Gift className="h-4 w-4 text-amber-600" />
              <span>Sustainable Partner Rewards</span>
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Redeem Your Eco-Reward Points
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-md">
              Every scan and sustainable choice avoids carbon emissions and earns EcoPoints.
              Exchange points for certified circular fashion vouchers and conservation initiatives.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Available Balance
              </span>
              <span className="text-2xl font-black text-amber-900 leading-none">
                {currentPoints} <span className="text-sm font-semibold text-amber-700">pts</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {(['all', 'unlocked', 'locked', 'redeemed'] as const).map((key) => {
            const labelMap = {
              all: `All (${offers.length})`,
              unlocked: `Unlocked (${offers.filter((o) => o.is_unlocked && !o.is_redeemed).length})`,
              locked: `Locked (${offers.filter((o) => !o.is_unlocked && !o.is_redeemed).length})`,
              redeemed: `Redeemed (${offers.filter((o) => o.is_redeemed).length})`,
            };
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labelMap[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            currentPoints={currentPoints}
            onRedeem={handleRedeem}
            onViewCode={(o) => setActiveModalOffer(o)}
            isRedeeming={isRedeeming}
          />
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-xs font-semibold text-slate-500">
            No offers match the selected "{filter}" filter.
          </p>
        </div>
      )}

      {/* Modal */}
      {activeModalOffer && (
        <RedeemModal
          offer={activeModalOffer}
          onClose={() => setActiveModalOffer(null)}
        />
      )}
    </div>
  );
};
