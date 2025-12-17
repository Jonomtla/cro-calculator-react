'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import InputField from './InputField';
import ResultItem from './ResultItem';
import ScenarioCard from './ScenarioCard';
import ForecastChart from './ForecastChart';

interface ForecastResult {
  cumInvest: number;
  cumProfit: number;
  net: number;
}

interface ForecastScenario {
  results: ForecastResult[];
  year1Profit: number;
  year1ROI: number;
}

const formatCurrency = (n: number) => '$' + Math.round(n).toLocaleString();
const formatCAC = (n: number) => '$' + n.toFixed(2);
const formatProfit = (n: number) => {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k';
  return '$' + n.toFixed(0);
};

function calculateForecastScenario(
  revenue: number,
  margin: number,
  investment: number,
  targetLift: number,
  months: number
): ForecastScenario {
  const results: ForecastResult[] = [];
  let cumInvest = 0;
  let cumProfit = 0;
  let cumulativeLift = 0;

  const liftCurve: Record<number, number> = {
    1: 0, 2: 0.08, 3: 0.20, 4: 0.35, 5: 0.50,
    6: 0.63, 7: 0.73, 8: 0.81, 9: 0.88, 10: 0.93, 11: 0.97, 12: 1
  };

  for (let m = 1; m <= months; m++) {
    cumInvest += investment;
    cumulativeLift = targetLift * (liftCurve[m] || 1);

    const improvedRevenue = revenue * (1 + cumulativeLift / 100);
    const monthlyProfit = (improvedRevenue - revenue) * (margin / 100);
    cumProfit += monthlyProfit;

    results.push({ cumInvest, cumProfit, net: cumProfit - cumInvest });
  }

  const year1Profit = results[11]?.net || 0;
  const year1ROI = cumInvest > 0 ? (year1Profit / cumInvest) * 100 : 0;

  return { results, year1Profit, year1ROI };
}

export default function Calculator() {
  const searchParams = useSearchParams();

  const [sessions, setSessions] = useState(350000);
  const [cr, setCr] = useState(2);
  const [lift, setLift] = useState(20);
  const [revenue, setRevenue] = useState(420000);
  const [sales, setSales] = useState(7000);
  const [aov, setAov] = useState(60);
  const [margin, setMargin] = useState(45);
  const [cac, setCac] = useState(25);
  const [invest, setInvest] = useState(0);
  const [yearly, setYearly] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load from URL params on mount
  useEffect(() => {
    const params: Record<string, string> = {
      sessions: 'sessions',
      cr: 'cr',
      lift: 'lift',
      revenue: 'revenue',
      sales: 'sales',
      margin: 'margin',
      cac: 'cac',
      investment: 'invest',
    };

    let loaded = false;
    Object.entries(params).forEach(([param, _]) => {
      const value = searchParams.get(param);
      if (value) {
        loaded = true;
        const numValue = parseFloat(value);
        switch (param) {
          case 'sessions': setSessions(numValue); break;
          case 'cr': setCr(numValue); break;
          case 'lift': setLift(numValue); break;
          case 'revenue': setRevenue(numValue); break;
          case 'sales': setSales(numValue); break;
          case 'margin': setMargin(numValue); break;
          case 'cac': setCac(numValue); break;
          case 'investment': setInvest(numValue); break;
        }
      }
    });

    if (loaded) {
      const s = parseFloat(searchParams.get('sessions') || String(sessions));
      const c = parseFloat(searchParams.get('cr') || String(cr));
      if (s > 0 && c > 0) {
        setSales(Math.round(s * (c / 100)));
      }
    }
  }, [searchParams]);

  // Auto-calculate AOV
  useEffect(() => {
    if (sales > 0 && revenue > 0) {
      setAov(revenue / sales);
    }
  }, [sales, revenue]);

  // Sync functions
  const syncFromSessions = useCallback((newSessions: number) => {
    setSessions(newSessions);
    if (newSessions > 0 && cr > 0) {
      const newSales = Math.round(newSessions * (cr / 100));
      setSales(newSales);
      if (aov > 0) {
        setRevenue(Math.round(newSales * aov));
      }
    }
  }, [cr, aov]);

  const syncFromCr = useCallback((newCr: number) => {
    setCr(newCr);
    if (sessions > 0 && newCr > 0) {
      const newSales = Math.round(sessions * (newCr / 100));
      setSales(newSales);
      if (aov > 0) {
        setRevenue(Math.round(newSales * aov));
      }
    }
  }, [sessions, aov]);

  const syncFromSales = useCallback((newSales: number) => {
    setSales(newSales);
    if (sessions > 0 && newSales > 0) {
      setCr((newSales / sessions) * 100);
    }
    if (aov > 0 && newSales > 0) {
      setRevenue(Math.round(newSales * aov));
    }
  }, [sessions, aov]);

  // Calculations
  const mult = yearly ? 12 : 1;
  const period = yearly ? 'Yearly' : 'Monthly';

  const incRev = sessions * (cr / 100) * (lift / 100) * aov;
  const incProfit = incRev * (margin / 100);

  const improvedCAC = cac > 0 ? cac / (1 + lift / 100) : 0;
  const cacReduction = cac - improvedCAC;
  const cacReductionPct = cac > 0 ? (cacReduction / cac) * 100 : 0;

  // Forecast calculations
  const conservativeForecast = calculateForecastScenario(revenue, margin, invest, 10, 12);
  const targetForecast = calculateForecastScenario(revenue, margin, invest, 20, 12);
  const bestForecast = calculateForecastScenario(revenue, margin, invest, 40, 12);

  const showForecast = invest > 0 && margin > 0;

  const copyResults = () => {
    const text = `CRO ROI Calculator Results
━━━━━━━━━━━━━━━━━━━━━━━━━
Current ${period} Revenue: ${formatCurrency(revenue * mult)}
Projected ${period} Revenue: ${formatCurrency((revenue + incRev) * mult)}
Incremental ${period} Revenue: +${formatCurrency(incRev * mult)}
Incremental ${period} Profit: ${formatCurrency(incProfit * mult)}
${cac > 0 ? `\nCAC Reduction: -${formatCAC(cacReduction)} (${cacReductionPct.toFixed(1)}%)` : ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Conversion Rate Optimization
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          CRO ROI Calculator
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Calculate your potential revenue gains from conversion rate optimization.
          Fields auto-sync as you type for seamless calculations.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs Panel */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Your Metrics</h2>
          </div>

          <div className="space-y-4">
            <InputField
              label="Monthly Sessions"
              value={sessions}
              onChange={syncFromSessions}
            />
            <InputField
              label="Conversion Rate"
              hint="auto-syncs"
              value={cr}
              onChange={syncFromCr}
              step="0.01"
              suffix="%"
            />
            <InputField
              label="Target Lift"
              value={lift}
              onChange={setLift}
              step="0.1"
              suffix="%"
            />

            <div className="border-t border-slate-700/50 my-5" />

            <InputField
              label="Monthly Revenue"
              hint="auto-syncs"
              value={revenue}
              onChange={setRevenue}
              prefix="$"
            />
            <InputField
              label="Monthly Sales"
              hint="auto-syncs"
              value={sales}
              onChange={syncFromSales}
            />
            <InputField
              label="AOV"
              hint="calculated"
              value={aov.toFixed(2)}
              onChange={() => {}}
              readOnly
              prefix="$"
            />

            <div className="border-t border-slate-700/50 my-5" />

            <InputField
              label="Gross Margin"
              hint="optional"
              value={margin}
              onChange={setMargin}
              step="0.01"
              suffix="%"
            />
            <InputField
              label="Current CAC"
              hint="optional"
              value={cac}
              onChange={setCac}
              prefix="$"
            />
            <InputField
              label="CRO Investment"
              hint="monthly"
              value={invest || ''}
              onChange={setInvest}
              prefix="$"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Revenue Impact Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">Revenue Impact</h2>
              </div>

              {/* Period Toggle */}
              <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setYearly(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    !yearly
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setYearly(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    yearly
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <ResultItem
              label={`Current ${period} Revenue`}
              value={formatCurrency(revenue * mult)}
              variant="baseline"
            />
            <ResultItem
              label={`Projected ${period} Revenue`}
              value={formatCurrency((revenue + incRev) * mult)}
              variant="highlight"
            />
            <ResultItem
              label={`Incremental ${period} Revenue`}
              value={`+${formatCurrency(incRev * mult)}`}
              variant="highlight"
              highlighted
            />
            <ResultItem
              label={`Incremental ${period} Profit`}
              value={margin > 0 ? formatCurrency(incProfit * mult) : '—'}
              variant={margin > 0 ? 'default' : 'muted'}
            />

            {/* Copy Button */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={copyResults}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Results
              </button>
              {copied && (
                <span className="flex items-center gap-1 text-emerald-400 text-sm animate-fade-in">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              )}
            </div>
          </div>

          {/* CAC Impact Card */}
          {cac > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">CAC Impact</h2>
              </div>

              <ResultItem
                label="Current CAC"
                value={formatCAC(cac)}
                variant="baseline"
              />
              <ResultItem
                label="Improved CAC"
                value={formatCAC(improvedCAC)}
                variant="highlight"
              />
              <ResultItem
                label="CAC Reduction"
                value={`-${formatCAC(cacReduction)} (${cacReductionPct.toFixed(1)}%)`}
                variant="highlight"
                highlighted
              />
            </div>
          )}
        </div>
      </div>

      {/* Forecast Section */}
      {showForecast && (
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">12-Month Forecast</h2>
              <p className="text-sm text-slate-400">Projected outcomes across different scenarios</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <ScenarioCard
              title="Conservative"
              profit={formatProfit(conservativeForecast.year1Profit)}
              detail={`10% lift · ${conservativeForecast.year1ROI.toFixed(0)}% ROI`}
              variant="conservative"
            />
            <ScenarioCard
              title="Target"
              profit={formatProfit(targetForecast.year1Profit)}
              detail={`20% lift · ${targetForecast.year1ROI.toFixed(0)}% ROI`}
              variant="target"
            />
            <ScenarioCard
              title="Best Case"
              profit={formatProfit(bestForecast.year1Profit)}
              detail={`40% lift · ${bestForecast.year1ROI.toFixed(0)}% ROI`}
              variant="best"
            />
          </div>

          <ForecastChart
            conservativeData={conservativeForecast.results}
            targetData={targetForecast.results}
            bestData={bestForecast.results}
          />

          <p className="mt-4 text-xs text-slate-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Forecast assumes Month 1 research, Month 2 ramping (75% velocity), Month 3+ full testing. Each win compounds permanently.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>Built for marketers and CRO professionals</p>
      </div>
    </div>
  );
}
