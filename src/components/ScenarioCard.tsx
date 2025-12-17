'use client';

interface ScenarioCardProps {
  title: string;
  profit: string;
  detail: string;
  variant: 'conservative' | 'target' | 'best';
  animationDelay?: number;
  isRevenueMode?: boolean;
}

export default function ScenarioCard({
  title,
  profit,
  detail,
  variant,
  animationDelay = 0,
  isRevenueMode = false,
}: ScenarioCardProps) {
  const variants = {
    conservative: {
      gradient: 'from-[#4e7597]/10 to-[#9abbd8]/10',
      border: 'border-[#4e7597]/30',
      title: 'text-[#4e7597]',
      profit: 'text-[#4e7597]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    target: {
      gradient: 'from-[#243e42]/10 to-[#72ab7f]/10',
      border: 'border-[#72ab7f]/30',
      title: 'text-[#243e42]',
      profit: 'text-[#72ab7f]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    best: {
      gradient: 'from-[#7e84e5]/10 to-[#757bd6]/10',
      border: 'border-[#7e84e5]/30',
      title: 'text-[#757bd6]',
      profit: 'text-[#7e84e5]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  };

  const v = variants[variant];

  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${v.gradient} border-2 ${v.border} hover-lift animate-fade-in-up cursor-default`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className={`flex items-center gap-2 text-xs font-bold tracking-wider mb-3 uppercase ${v.title}`}>
        {v.icon}
        {title}
      </div>

      <div className={`text-3xl font-extrabold mb-1 ${v.profit}`}>
        {profit}
      </div>

      <div className="text-sm text-[#565656] mb-3 flex items-center gap-2">
        Year 1 Net {isRevenueMode ? 'Revenue' : 'Profit'}
        {isRevenueMode && (
          <span className="text-[10px] font-semibold bg-[#9abbd8]/20 text-[#4e7597] px-1.5 py-0.5 rounded">
            TOPLINE
          </span>
        )}
      </div>

      <div className="text-xs text-[#4e7597] bg-white/50 rounded-lg px-3 py-2">
        {detail}
      </div>
    </div>
  );
}
