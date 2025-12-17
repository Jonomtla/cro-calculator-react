'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
}

const formatValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
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
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="text-white font-semibold">{formatValue(entry.value)}</span>
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
}: ForecastChartProps) {
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    fullMonth: `Month ${i + 1}`,
    investment: conservativeData[i]?.cumInvest || 0,
    conservative: conservativeData[i]?.cumProfit || 0,
    target: targetData[i]?.cumProfit || 0,
    best: bestData[i]?.cumProfit || 0,
  }));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-semibold text-slate-300">Cumulative Profit Over Time</h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-slate-400">Conservative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-400">Best Case</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="investment"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorInvest)"
              name="Investment"
            />
            <Area
              type="monotone"
              dataKey="conservative"
              stroke="#60a5fa"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConservative)"
              name="Conservative (10%)"
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="#34d399"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTarget)"
              name="Target (20%)"
            />
            <Area
              type="monotone"
              dataKey="best"
              stroke="#fbbf24"
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
