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
      // Recalculate derived values
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

  const netProfit = (incProfit - invest) * mult;
  const roi = invest > 0 ? (netProfit / (invest * mult)) * 100 : 0;
  const payback = invest > 0 && incProfit > 0 ? invest / incProfit : 0;

  const getPaybackString = () => {
    if (payback < 1) return `${(payback * 30).toFixed(0)} days`;
    if (payback < 12) return `${payback.toFixed(1)} months`;
    return `${(payback / 12).toFixed(1)} years`;
  };

  // Forecast calculations
  const conservativeForecast = calculateForecastScenario(revenue, margin, invest, 10, 12);
  const targetForecast = calculateForecastScenario(revenue, margin, invest, 20, 12);
  const bestForecast = calculateForecastScenario(revenue, margin, invest, 40, 12);

  const showForecast = invest > 0 && margin > 0;

  const copyResults = () => {
    const text = `Current ${period} Revenue: ${formatCurrency(revenue * mult)}
Projected ${period} Revenue: ${formatCurrency((revenue + incRev) * mult)}
Incremental ${period} Revenue: +${formatCurrency(incRev * mult)}
Incremental ${period} Profit: ${formatCurrency(incProfit * mult)}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          CRO ROI Calculator
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>Smart Auto-Sync:</strong> Change any field and related values update automatically
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-1">
        <InputField
          label="Monthly Sessions"
          value={sessions}
          onChange={syncFromSessions}
        />
        <InputField
          label="Baseline Conversion Rate"
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
          hint="auto-calculated"
          value={aov.toFixed(2)}
          onChange={() => {}}
          readOnly
          prefix="$"
        />
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
          label="CRO Investment (Monthly)"
          hint="optional"
          value={invest || ''}
          onChange={setInvest}
          prefix="$"
        />
      </div>

      {/* Results */}
      <div className="mt-8 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Results</h2>

        <ResultItem
          label={`Current ${period} Revenue:`}
          value={formatCurrency(revenue * mult)}
          variant="baseline"
        />
        <ResultItem
          label={`Projected ${period} Revenue:`}
          value={formatCurrency((revenue + incRev) * mult)}
          variant="highlight"
        />
        <ResultItem
          label={`Incremental ${period} Revenue:`}
          value={`+${formatCurrency(incRev * mult)}`}
          variant="highlight"
          highlighted
        />
        <ResultItem
          label={`Incremental ${period} Profit:`}
          value={margin > 0 ? formatCurrency(incProfit * mult) : '—'}
          variant={margin > 0 ? 'highlight' : 'muted'}
        />

        {/* CAC Section */}
        {cac > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">CAC Impact</h3>
            <ResultItem
              label="Current CAC:"
              value={formatCAC(cac)}
              variant="baseline"
            />
            <ResultItem
              label="Improved CAC:"
              value={formatCAC(improvedCAC)}
              variant="highlight"
            />
            <ResultItem
              label="Reduction:"
              value={`-${formatCAC(cacReduction)} (${cacReductionPct.toFixed(1)}%)`}
              variant="highlight"
              highlighted
            />
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setYearly(!yearly)}
            className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all
              ${yearly
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            Switch to {yearly ? 'Monthly' : 'Yearly'}
          </button>
          <button
            onClick={copyResults}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-sm bg-white text-gray-700 hover:bg-gray-50 transition-all"
          >
            Copy Results
          </button>
          {copied && (
            <span className="text-emerald-600 text-sm font-medium self-center">
              Copied!
            </span>
          )}
        </div>
      </div>

      {/* Forecast Section */}
      {showForecast && (
        <div className="mt-8 p-6 bg-slate-100 border-2 border-slate-300 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-5">12-Month Forecast</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ScenarioCard
              title="Conservative Scenario"
              profit={formatProfit(conservativeForecast.year1Profit)}
              detail={`10% conversion lift · ${conservativeForecast.year1ROI.toFixed(1)}% ROI`}
              variant="conservative"
            />
            <ScenarioCard
              title="Target Scenario"
              profit={formatProfit(targetForecast.year1Profit)}
              detail={`20% conversion lift · ${targetForecast.year1ROI.toFixed(1)}% ROI`}
              variant="target"
            />
            <ScenarioCard
              title="Best Case Scenario"
              profit={formatProfit(bestForecast.year1Profit)}
              detail={`40% conversion lift · ${bestForecast.year1ROI.toFixed(1)}% ROI`}
              variant="best"
            />
          </div>

          <ForecastChart
            conservativeData={conservativeForecast.results}
            targetData={targetForecast.results}
            bestData={bestForecast.results}
          />

          <p className="mt-4 text-xs text-slate-500 italic">
            Forecast assumes Month 1 research only, Month 2 ramping (75% velocity), Month 3+ full testing. Each win compounds permanently.
          </p>
        </div>
      )}
    </div>
  );
}
