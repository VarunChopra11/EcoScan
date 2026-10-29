import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const ScanningLoader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing image contours & clothing silhouettes...',
    'Detecting garment categories & fabric composition...',
    'Calculating cradle-to-grave lifecycle carbon footprint...',
    'Evaluating eco-savings & computing EcoReward points...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-200 bg-brand-50/50 p-8 text-center shadow-md">
      {/* Animated radar/spinner */}
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
        <div className="absolute h-full w-full animate-ping rounded-full bg-brand-400 opacity-20" />
        <div className="absolute h-16 w-16 animate-pulse rounded-full bg-brand-200" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-900">
        Analyzing Garment Sustainability...
      </h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        Our multi-tier vision model is identifying items and cross-referencing global apparel emission benchmarks.
      </p>

      {/* Step progress list */}
      <div className="mt-6 w-full max-w-sm space-y-2.5 text-left">
        {steps.map((text, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all ${
                isCurrent
                  ? 'bg-white font-semibold text-brand-900 shadow-sm border border-brand-200'
                  : isDone
                  ? 'text-slate-700 font-medium'
                  : 'text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
              ) : isCurrent ? (
                <div className="h-2 w-2 rounded-full bg-brand-600 animate-ping shrink-0" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
              )}
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
