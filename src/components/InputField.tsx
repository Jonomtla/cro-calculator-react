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
}: InputFieldProps) {
  return (
    <div className="group">
      <label className="flex items-center gap-2 mb-2 text-sm font-medium text-[#10222b]">
        {label}
        {hint && (
          <span className="font-normal text-[#4e7597] text-xs px-2 py-0.5 bg-[#4e7597]/10 rounded-full">
            {hint}
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4e7597] font-medium">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          readOnly={readOnly}
          className={`w-full py-3.5 bg-white border-2 border-[#9abbd8]/30 rounded-xl text-base text-[#10222b]
            placeholder:text-[#9abbd8]
            focus:outline-none focus:border-[#4e7597] focus:ring-4 focus:ring-[#4e7597]/10
            hover:border-[#9abbd8] hover:bg-[#f4faff]
            transition-all duration-200
            ${prefix ? 'pl-10 pr-4' : 'px-4'}
            ${suffix ? 'pr-12' : ''}
            ${readOnly ? 'bg-[#f2efe6] text-[#565656] cursor-not-allowed border-[#bfbfbf]/30' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4e7597] font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
