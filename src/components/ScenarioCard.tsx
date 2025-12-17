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
    conservative: {
      gradient: 'from-blue-500/10 to-indigo-500/10',
      border: 'border-blue-500/30',
      title: 'text-blue-400',
      profit: 'text-blue-300',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    target: {
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/30',
      title: 'text-emerald-400',
      profit: 'text-emerald-300',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    best: {
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30',
      title: 'text-amber-400',
      profit: 'text-amber-300',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  };

  const v = variants[variant];

  return (
    <div className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${v.gradient} border ${v.border} backdrop-blur-sm hover:scale-[1.02] transition-transform cursor-default`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className={`flex items-center gap-2 text-xs font-bold tracking-wider mb-3 uppercase ${v.title}`}>
        {v.icon}
        {title}
      </div>

      <div className={`text-3xl font-extrabold mb-1 ${v.profit}`}>
        {profit}
      </div>

      <div className="text-sm text-slate-400 mb-3">
        Year 1 Net Profit
      </div>

      <div className="text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
        {detail}
      </div>
    </div>
  );
}
