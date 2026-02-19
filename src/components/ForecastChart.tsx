'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface ForecastResult {
  cumInvest: number;
  cumProfit: number;
  net: number;
}

interface ForecastChartProps {
  conservativeData: ForecastResult[];
  targetData: ForecastResult[];
  bestData: ForecastResult[];
  isRevenueMode?: boolean;
}

const formatValue = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-[#9abbd8]/30 rounded-xl p-4 shadow-lg">
        <p className="text-[#10222b] font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#565656]">{entry.name}:</span>
            <span className="text-[#10222b] font-semibold">{formatValue(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ForecastChart({
  conservativeData,
  targetData,
  bestData,
  isRevenueMode = false,
}: ForecastChartProps) {
  // Show cumulative net profit/revenue (after investment) over 12 months
  // Lines crossing $0 = break-even point. M12 values match the scenario cards.
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    fullMonth: `Month ${i + 1}`,
    conservative: conservativeData[i]?.net || 0,
    target: targetData[i]?.net || 0,
    best: bestData[i]?.net || 0,
  }));

  return (
    <div className="bg-white border-2 border-[#9abbd8]/20 p-6 rounded-2xl card-shadow animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-[#10222b]">Cumulative Net {isRevenueMode ? 'Revenue' : 'Profit'} (After Investment)</h4>
          {isRevenueMode && (
            <span className="text-[10px] font-semibold bg-[#9abbd8]/20 text-[#4e7597] px-2 py-1 rounded">
              TOPLINE REVENUE
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#4e7597]" />
            <span className="text-[#565656]">Conservative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#72ab7f]" />
            <span className="text-[#565656]">Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#7e84e5]" />
            <span className="text-[#565656]">Best Case</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4e7597" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4e7597" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#72ab7f" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#72ab7f" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7e84e5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7e84e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(154, 187, 216, 0.2)" />
            <ReferenceLine y={0} stroke="#bfbfbf" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Break-even', position: 'right', fontSize: 10, fill: '#999' }} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#565656' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: '#565656' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="conservative"
              stroke="#4e7597"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConservative)"
              name="Conservative (10%)"
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="#72ab7f"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTarget)"
              name="Target (20%)"
            />
            <Area
              type="monotone"
              dataKey="best"
              stroke="#7e84e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBest)"
              name="Best Case (40%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
