import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'amber' | 'slate' | 'blue' | 'purple' | 'red';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
