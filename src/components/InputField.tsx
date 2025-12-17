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
    <div className="mb-5">
      <label className="block mb-1.5 font-semibold text-sm text-gray-700">
        {label}
        {hint && (
          <span className="font-normal italic text-gray-500 text-xs ml-1">
            ({hint})
          </span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          readOnly={readOnly}
          className={`w-full py-3 border-2 border-gray-300 rounded-lg text-base bg-white transition-all duration-200
            focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
            ${prefix ? 'pl-8 pr-4' : 'px-4'}
            ${suffix ? 'pr-12' : ''}
            ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
