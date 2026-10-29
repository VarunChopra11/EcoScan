import React, { useState } from 'react';
import { Copy, Check, ExternalLink, X, Sparkles } from 'lucide-react';
import { Offer } from '../../types';

interface RedeemModalProps {
  offer: Offer;
  onClose: () => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({ offer, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (offer.redemption_code) {
      navigator.clipboard.writeText(offer.redemption_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
            <Sparkles className="h-7 w-7 text-brand-600" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
            {offer.brand} Voucher Claimed!
          </span>

          <h3 className="mt-1 text-lg font-black text-slate-900">{offer.title}</h3>

          <p className="mt-1.5 text-xs text-slate-600 max-w-xs">{offer.description}</p>

          {/* Promo code display */}
          <div className="mt-5 w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Your Exclusive Promo Code
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-black tracking-widest text-emerald-950">
                {offer.redemption_code || 'ECO-CLAIMED'}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs border border-emerald-200 hover:bg-emerald-50 transition"
                title="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Apply this code at checkout on {offer.brand}. Code is permanently saved in your Impact History.
          </p>

          <div className="mt-6 flex w-full items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Done
            </button>
            {offer.partner_url && (
              <a
                href={offer.partner_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition"
              >
                <span>Visit Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
