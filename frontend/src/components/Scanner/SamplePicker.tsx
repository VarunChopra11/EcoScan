import React from 'react';
import { Sparkles, Shirt, Footprints, Layers } from 'lucide-react';

interface SampleItem {
  id: string;
  title: string;
  category: string;
  expectedCo2: string;
  icon: React.ReactNode;
  tag: string;
}

interface SamplePickerProps {
  onSelectSample: (sampleHint: string) => void;
  isLoading: boolean;
}

export const SamplePicker: React.FC<SamplePickerProps> = ({
  onSelectSample,
  isLoading,
}) => {
  const samples: SampleItem[] = [
    {
      id: 'organic-tee',
      title: 'Organic Cotton Crewneck',
      category: 'T-Shirt',
      expectedCo2: '~3.5 kg CO₂e',
      icon: <Shirt className="h-4 w-4 text-emerald-600" />,
      tag: 'High Eco-Savings',
    },
    {
      id: 'denim-jacket',
      title: 'Classic Denim Trucker',
      category: 'Jacket',
      expectedCo2: '~15.0 kg CO₂e',
      icon: <Layers className="h-4 w-4 text-blue-600" />,
      tag: 'Heavy Outerwear',
    },
    {
      id: 'running-shoes',
      title: 'Recycled Road Runners',
      category: 'Shoes',
      expectedCo2: '~4.0 kg CO₂e',
      icon: <Footprints className="h-4 w-4 text-purple-600" />,
      tag: 'Recycled rPET',
    },
  ];

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Or Test Drive with Instant Apparel Presets
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {samples.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectSample(s.id)}
            className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50/40 hover:shadow-sm"
          >
            <div className="flex w-full items-center justify-between mb-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-xs">
                {s.icon}
              </div>
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-100">
                {s.tag}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-brand-800">
              {s.title}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>{s.category}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{s.expectedCo2}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
