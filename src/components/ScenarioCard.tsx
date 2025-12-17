'use client';

interface ScenarioCardProps {
  title: string;
  profit: string;
  detail: string;
  variant: 'conservative' | 'target' | 'best';
}

export default function ScenarioCard({
  title,
  profit,
  detail,
  variant,
}: ScenarioCardProps) {
  const variants = {
    conservative: 'border-indigo-300 bg-indigo-50',
    target: 'border-emerald-400 bg-emerald-50',
    best: 'border-slate-500 bg-slate-50',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${variants[variant]}`}>
      <div className="text-xs font-bold text-gray-500 tracking-wide mb-2 uppercase">
        {title}
      </div>
      <div className="text-2xl font-extrabold text-gray-900 mb-1">{profit}</div>
      <div className="text-sm text-gray-500 mb-3">Year 1 Net Profit</div>
      <div className="text-xs text-gray-600">{detail}</div>
    </div>
  );
}
