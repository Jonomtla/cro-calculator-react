'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

export default function ForecastChart({
  conservativeData,
  targetData,
  bestData,
}: ForecastChartProps) {
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    investment: conservativeData[i]?.cumInvest || 0,
    conservative: conservativeData[i]?.cumProfit || 0,
    target: targetData[i]?.cumProfit || 0,
    best: bestData[i]?.cumProfit || 0,
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatValue(Number(value) || 0)}
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="investment"
            stroke="#264354"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Investment"
          />
          <Line
            type="monotone"
            dataKey="conservative"
            stroke="#959ad7"
            strokeWidth={2}
            dot={false}
            name="Conservative (10%)"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#73af7f"
            strokeWidth={2}
            dot={false}
            name="Target (20%)"
          />
          <Line
            type="monotone"
            dataKey="best"
            stroke="#4d5374"
            strokeWidth={2}
            dot={false}
            name="Best Case (40%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
