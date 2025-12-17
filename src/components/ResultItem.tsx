'use client';

interface ResultItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'baseline' | 'highlight' | 'muted';
  highlighted?: boolean;
  icon?: React.ReactNode;
}

export default function ResultItem({
  label,
  value,
  variant = 'default',
  highlighted = false,
  icon,
}: ResultItemProps) {
  const variants = {
    default: {
      value: 'text-emerald-400',
      bg: '',
    },
    baseline: {
      value: 'text-slate-400',
      bg: '',
    },
    highlight: {
      value: 'text-emerald-400 font-extrabold text-xl',
      bg: '',
    },
    muted: {
      value: 'text-slate-500',
      bg: '',
    },
  };

  if (highlighted) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 my-3">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent" />
        <div className="relative flex justify-between items-center">
          <span className="font-medium text-emerald-300 flex items-center gap-2">
            {icon}
            {label}
          </span>
          <span className="text-2xl font-bold text-emerald-400 tracking-tight">
            {value}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-b-0">
      <span className="font-medium text-slate-400 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-lg font-semibold ${variants[variant].value}`}>
        {value}
      </span>
    </div>
  );
}
