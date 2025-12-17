'use client';

interface ResultItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'baseline' | 'highlight' | 'muted';
  highlighted?: boolean;
  subValue?: string;
  animationDelay?: number;
}

export default function ResultItem({
  label,
  value,
  variant = 'default',
  highlighted = false,
  subValue,
  animationDelay = 0,
}: ResultItemProps) {
  const variants = {
    default: {
      value: 'text-[#72ab7f]',
    },
    baseline: {
      value: 'text-[#565656]',
    },
    highlight: {
      value: 'text-[#72ab7f] font-extrabold text-xl',
    },
    muted: {
      value: 'text-[#bfbfbf]',
    },
  };

  if (highlighted) {
    return (
      <div
        className="relative overflow-hidden bg-gradient-to-r from-[#243e42]/10 to-[#72ab7f]/10 border-2 border-[#72ab7f]/30 rounded-xl p-4 my-3 hover-lift animate-scale-in"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#72ab7f]/5 to-transparent" />
        <div className="relative flex justify-between items-center">
          <span className="font-medium text-[#243e42]">
            {label}
          </span>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#72ab7f] tracking-tight animate-count-up">
              {value}
            </span>
            {subValue && (
              <div className="text-xs text-[#4e7597] mt-0.5">{subValue}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-between items-center py-3 border-b border-[#9abbd8]/20 last:border-b-0 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <span className="font-medium text-[#565656]">
        {label}
      </span>
      <div className="text-right">
        <span className={`text-lg font-semibold ${variants[variant].value}`}>
          {value}
        </span>
        {subValue && (
          <div className="text-xs text-[#4e7597]">{subValue}</div>
        )}
      </div>
    </div>
  );
}
