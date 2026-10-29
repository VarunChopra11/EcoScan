import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'accent';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  variant = 'default',
}) => {
  const borderVariants = {
    default: 'border-slate-200/80 bg-white',
    highlight: 'border-emerald-200 bg-emerald-50/50',
    accent: 'border-amber-200 bg-amber-50/40',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${borderVariants[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};
