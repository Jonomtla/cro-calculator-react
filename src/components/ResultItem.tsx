'use client';

interface ResultItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'baseline' | 'highlight' | 'muted';
  highlighted?: boolean;
}

export default function ResultItem({
  label,
  value,
  variant = 'default',
  highlighted = false,
}: ResultItemProps) {
  const valueColors = {
    default: 'text-emerald-600',
    baseline: 'text-red-600',
    highlight: 'text-emerald-600 font-extrabold',
    muted: 'text-gray-400',
  };

  return (
    <div
      className={`flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0
        ${highlighted ? 'bg-emerald-500/5 -mx-3 px-3 rounded-lg border border-emerald-500/20 my-2' : ''}
      `}
    >
      <span className="font-semibold text-gray-700">{label}</span>
      <span className={`text-lg font-bold ${valueColors[variant]}`}>
        {value}
      </span>
    </div>
  );
}
