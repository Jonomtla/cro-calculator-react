'use client';

interface InputFieldProps {
  label: string;
  hint?: string;
  value: number | string;
  onChange: (value: number) => void;
  step?: string;
  readOnly?: boolean;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export default function InputField({
  label,
  hint,
  value,
  onChange,
  step = '1',
  readOnly = false,
  prefix,
  suffix,
  icon,
}: InputFieldProps) {
  return (
    <div className="group">
      <label className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-300">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {hint && (
          <span className="font-normal text-slate-500 text-xs px-2 py-0.5 bg-slate-700/50 rounded-full">
            {hint}
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          readOnly={readOnly}
          className={`w-full py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-base text-white
            placeholder:text-slate-500
            focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-slate-800
            hover:border-slate-500 hover:bg-slate-800/70
            ${prefix ? 'pl-10 pr-4' : 'px-4'}
            ${suffix ? 'pr-12' : ''}
            ${readOnly ? 'bg-slate-800/30 text-slate-400 cursor-not-allowed border-slate-700/50' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
