'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import InputField from './InputField';
import ResultItem from './ResultItem';
import ScenarioCard from './ScenarioCard';
import ForecastChart from './ForecastChart';

interface ForecastResult {
  cumInvest: number;
  cumProfit: number;  // Can be profit or revenue depending on mode
  net: number;
}

interface ForecastScenario {
  results: ForecastResult[];
  year1Profit: number;  // Can be profit or revenue depending on mode
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
  months: number,
  useRevenueMode: boolean = false  // true = show revenue, false = show profit
): ForecastScenario {
  const results: ForecastResult[] = [];
  let cumInvest = 0;
  let cumIncrementalRevenue = 0;

  // Realistic CRO ramp-up model:
  // - Month 1: Research/audit period (0% lift)
  // - Months 2-12: Linear ramp from 0% to target lift
  //
  // Year 1 produces ~6 months worth of full target lift
  // This reflects the reality that CRO programs take time to build momentum

  for (let m = 1; m <= months; m++) {
    cumInvest += investment;

    // Ramp with 1-month research/setup phase
    // M1 = 0%, then linear ramp to target by M12
    let rampProgress = 0;
    if (m <= 1) {
      rampProgress = 0; // Research/audit phase
    } else {
      // Linear ramp from month 2 to 12 (11 testing months)
      rampProgress = (m - 1) / 11; // 0.091, 0.182, ... 1.0
    }
    const currentLift = targetLift * rampProgress;

    // Calculate incremental revenue for THIS month based on current lift
    const monthlyIncrementalRevenue = revenue * (currentLift / 100);
    cumIncrementalRevenue += monthlyIncrementalRevenue;

    // cumProfit = cumulative gross profit from incremental revenue, minus cumulative investment
    // In revenue mode, cumProfit = cumulative incremental revenue (no margin applied)
    const cumGrossProfit = useRevenueMode
      ? cumIncrementalRevenue
      : cumIncrementalRevenue * (margin / 100);
    const netProfit = cumGrossProfit - cumInvest;

    results.push({ cumInvest, cumProfit: cumGrossProfit, net: netProfit });
  }

  // Year 1 net profit (or net revenue in revenue mode) = gross profit - total investment
  const year1Net = results[11]?.net || 0;
  const totalInvest = results[11]?.cumInvest || 0;

  // ROI = net return / total investment * 100
  const year1ROI = totalInvest > 0 ? (year1Net / totalInvest) * 100 : 0;

  return { results, year1Profit: year1Net, year1ROI };
}

export default function Calculator() {
  const searchParams = useSearchParams();
  const reportRef = useRef<HTMLDivElement>(null);
  const forecastRef = useRef<HTMLDivElement>(null);

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
  const [forecastMode, setForecastMode] = useState<'net' | 'gross'>('net');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);

  // Track if forecast is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollButton(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (forecastRef.current) {
      observer.observe(forecastRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load from URL params on mount
  useEffect(() => {
    const paramMap: Record<string, (v: number) => void> = {
      sessions: setSessions,
      cr: setCr,
      lift: setLift,
      revenue: setRevenue,
      sales: setSales,
      margin: setMargin,
      cac: setCac,
      investment: setInvest,
    };

    let loaded = false;
    Object.entries(paramMap).forEach(([param, setter]) => {
      const value = searchParams.get(param);
      if (value) {
        loaded = true;
        setter(parseFloat(value));
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

  // Confidence intervals (conservative: -20%, optimistic: +30%)
  const incRevLow = incRev * 0.8;
  const incRevHigh = incRev * 1.3;
  const incProfitLow = incProfit * 0.8;
  const incProfitHigh = incProfit * 1.3;

  const improvedCAC = cac > 0 ? cac / (1 + lift / 100) : 0;
  const cacReduction = cac - improvedCAC;
  const cacReductionPct = cac > 0 ? (cacReduction / cac) * 100 : 0;

  // Break-even calculation
  const breakEvenLift = invest > 0 && margin > 0 && sessions > 0 && cr > 0 && aov > 0
    ? (invest / (margin / 100)) / (sessions * (cr / 100) * aov) * 100
    : 0;

  // Forecast calculations
  // If margin is not provided, force gross revenue mode
  // Otherwise, respect the user's toggle between net profit and gross revenue
  const useRevenueMode = margin <= 0 || forecastMode === 'gross';
  const conservativeForecast = calculateForecastScenario(revenue, margin, invest, 10, 12, useRevenueMode);
  const targetForecast = calculateForecastScenario(revenue, margin, invest, 20, 12, useRevenueMode);
  const bestForecast = calculateForecastScenario(revenue, margin, invest, 40, 12, useRevenueMode);

  // Always show forecast (works with or without investment/margin)
  const showForecast = revenue > 0;

  // Generate shareable link
  const generateShareableLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const params = new URLSearchParams({
      sessions: sessions.toString(),
      cr: cr.toString(),
      lift: lift.toString(),
      revenue: revenue.toString(),
      margin: margin.toString(),
      cac: cac.toString(),
      investment: invest.toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const copyShareableLink = () => {
    navigator.clipboard.writeText(generateShareableLink()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const copyResults = () => {
    const forecastSection = showForecast ? `
12-MONTH FORECAST (Year 1 ${useRevenueMode ? 'Revenue' : 'Net Profit'})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Conservative (10% lift): ${formatProfit(conservativeForecast.year1Profit)}${invest > 0 && !useRevenueMode ? ` · ${conservativeForecast.year1ROI.toFixed(0)}% ROI` : ''}
Target (20% lift): ${formatProfit(targetForecast.year1Profit)}${invest > 0 && !useRevenueMode ? ` · ${targetForecast.year1ROI.toFixed(0)}% ROI` : ''}
Best Case (40% lift): ${formatProfit(bestForecast.year1Profit)}${invest > 0 && !useRevenueMode ? ` · ${bestForecast.year1ROI.toFixed(0)}% ROI` : ''}
` : '';

    const text = `CRO ROI CALCULATOR RESULTS
Powered by IMPACT.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR INPUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monthly Sessions: ${sessions.toLocaleString()}
Conversion Rate: ${cr.toFixed(2)}%
Target Lift: ${lift}%
Monthly Revenue: ${formatCurrency(revenue)}
${margin > 0 ? `Gross Margin: ${margin}%` : ''}
${invest > 0 ? `Monthly CRO Investment: ${formatCurrency(invest)}` : ''}

${period.toUpperCase()} IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Revenue: ${formatCurrency(revenue * mult)}
Projected Revenue: ${formatCurrency((revenue + incRev) * mult)}
Incremental Revenue: +${formatCurrency(incRev * mult)}
  └ Range: ${formatCurrency(incRevLow * mult)} - ${formatCurrency(incRevHigh * mult)}
${margin > 0 ? `Incremental Profit: ${formatCurrency(incProfit * mult)}
  └ Range: ${formatCurrency(incProfitLow * mult)} - ${formatCurrency(incProfitHigh * mult)}` : ''}
${cac > 0 ? `
CAC Impact: ${formatCAC(cac)} → ${formatCAC(improvedCAC)} (-${cacReductionPct.toFixed(1)}%)` : ''}
${invest > 0 && margin > 0 ? `
Break-even Lift Required: ${breakEvenLift.toFixed(1)}%${lift >= breakEvenLift ? ' ✓ Target exceeds this!' : ''}` : ''}
${forecastSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Book your free CRO audit: https://www.impactconversion.com/#book`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // PDF Export
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      // Create canvas with specific options for better compatibility
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f2efe6',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // If content is taller than one page, handle multi-page
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('CRO-ROI-Report-IMPACT.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again or use Copy Results instead.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with IMPACT Branding */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl font-black text-[#10222b] tracking-tight">IMPACT.</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#10222b] mb-4 tracking-tight">
          CRO ROI Calculator
        </h1>
        <p className="text-[#565656] text-lg max-w-2xl mx-auto">
          See exactly how much revenue you could unlock through conversion rate optimization.
          Fields auto-sync as you type.
        </p>
      </div>

      <div ref={reportRef}>
        {/* Main Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Inputs Panel */}
          <div className="lg:col-span-2 bg-white border-2 border-[#9abbd8]/20 rounded-2xl p-6 card-shadow animate-fade-in-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#4e7597]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#4e7597]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#10222b]">Your Metrics</h2>
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

              <div className="border-t border-[#9abbd8]/20 my-5" />

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

              <div className="border-t border-[#9abbd8]/20 my-5" />

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
            {/* Comparison View - Without CRO vs With CRO */}
            <div className="grid md:grid-cols-2 gap-4 animate-fade-in-right">
              {/* Without CRO */}
              <div className="bg-white border-2 border-[#bfbfbf]/30 rounded-2xl p-5 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-[#bfbfbf]/20 rounded-lg">
                    <svg className="w-4 h-4 text-[#565656]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#565656]">Without CRO</h3>
                </div>
                <div className="text-3xl font-bold text-[#565656] mb-1">
                  {formatCurrency(revenue * mult)}
                </div>
                <div className="text-sm text-[#bfbfbf]">{period} Revenue</div>
                <div className="mt-3 pt-3 border-t border-[#bfbfbf]/20">
                  <div className="text-sm text-[#565656]">
                    <span className="font-medium">{(sales * mult).toLocaleString()}</span> sales
                  </div>
                  <div className="text-sm text-[#565656]">
                    <span className="font-medium">{cr.toFixed(2)}%</span> conversion rate
                  </div>
                </div>
              </div>

              {/* With CRO */}
              <div className="bg-gradient-to-br from-[#243e42]/5 to-[#72ab7f]/10 border-2 border-[#72ab7f]/30 rounded-2xl p-5 card-shadow hover-lift">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-[#72ab7f]/20 rounded-lg">
                    <svg className="w-4 h-4 text-[#72ab7f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#243e42]">With CRO</h3>
                </div>
                <div className="text-3xl font-bold text-[#72ab7f] mb-1">
                  {formatCurrency((revenue + incRev) * mult)}
                </div>
                <div className="text-sm text-[#565656]">{period} Revenue</div>
                <div className="mt-3 pt-3 border-t border-[#72ab7f]/20">
                  <div className="text-sm text-[#243e42]">
                    <span className="font-medium">{((sales * (1 + lift / 100)) * mult).toLocaleString()}</span> sales
                  </div>
                  <div className="text-sm text-[#243e42]">
                    <span className="font-medium">{(cr * (1 + lift / 100)).toFixed(2)}%</span> conversion rate
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Impact Card */}
            <div className="bg-white border-2 border-[#9abbd8]/20 rounded-2xl p-6 card-shadow animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#72ab7f]/10 rounded-lg">
                    <svg className="w-5 h-5 text-[#72ab7f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-[#10222b]">Revenue Impact</h2>
                </div>

                {/* Period Toggle */}
                <div className="flex items-center bg-[#f2efe6] rounded-lg p-1">
                  <button
                    onClick={() => setYearly(false)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      !yearly
                        ? 'bg-[#4e7597] text-white shadow-md'
                        : 'text-[#565656] hover:text-[#10222b]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setYearly(true)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      yearly
                        ? 'bg-[#4e7597] text-white shadow-md'
                        : 'text-[#565656] hover:text-[#10222b]'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <ResultItem
                label={`Incremental ${period} Revenue`}
                value={`+${formatCurrency(incRev * mult)}`}
                subValue={`Range: ${formatCurrency(incRevLow * mult)} - ${formatCurrency(incRevHigh * mult)}`}
                variant="highlight"
                highlighted
                animationDelay={100}
              />
              <ResultItem
                label={`Incremental ${period} Profit`}
                value={margin > 0 ? formatCurrency(incProfit * mult) : '—'}
                subValue={margin > 0 ? `Range: ${formatCurrency(incProfitLow * mult)} - ${formatCurrency(incProfitHigh * mult)}` : undefined}
                variant={margin > 0 ? 'default' : 'muted'}
                animationDelay={200}
              />

              {/* Break-even indicator */}
              {invest > 0 && margin > 0 && (
                <div className="mt-4 p-4 bg-[#f4faff] border border-[#9abbd8]/30 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#4e7597]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-[#10222b]">Break-even Analysis</span>
                  </div>
                  <p className="text-sm text-[#565656]">
                    You need a <span className="font-bold text-[#4e7597]">{breakEvenLift.toFixed(1)}%</span> conversion lift to break even on your investment.
                    {lift >= breakEvenLift ? (
                      <span className="ml-1 text-[#72ab7f] font-medium">
                        Your target lift of {lift}% exceeds this!
                      </span>
                    ) : (
                      <span className="ml-1 text-[#e57373] font-medium">
                        Consider increasing your target lift.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* CAC Impact Card */}
            {cac > 0 && (
              <div className="bg-white border-2 border-[#9abbd8]/20 rounded-2xl p-6 card-shadow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#4e7597]/10 rounded-lg">
                    <svg className="w-5 h-5 text-[#4e7597]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-[#10222b]">CAC Impact</h2>
                </div>

                <ResultItem
                  label="Current CAC"
                  value={formatCAC(cac)}
                  variant="baseline"
                  animationDelay={100}
                />
                <ResultItem
                  label="Improved CAC"
                  value={formatCAC(improvedCAC)}
                  variant="highlight"
                  animationDelay={200}
                />
                <ResultItem
                  label="CAC Reduction"
                  value={`-${formatCAC(cacReduction)} (${cacReductionPct.toFixed(1)}%)`}
                  variant="highlight"
                  highlighted
                  animationDelay={300}
                />
              </div>
            )}
          </div>
        </div>


        {/* Forecast Section */}
        {showForecast && (
          <div ref={forecastRef} className="mt-4 bg-white border-2 border-[#9abbd8]/20 rounded-2xl p-6 card-shadow animate-slide-up scroll-mt-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#7e84e5]/10 rounded-lg">
                  <svg className="w-5 h-5 text-[#7e84e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#10222b]">12-Month Forecast</h2>
                  <p className="text-sm text-[#565656]">Projected outcomes across different scenarios</p>
                </div>
              </div>
              {margin > 0 && (
                <div className="flex items-center gap-1 bg-[#f4faff] border border-[#9abbd8]/30 rounded-lg p-1">
                  <button
                    onClick={() => setForecastMode('net')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      forecastMode === 'net'
                        ? 'bg-white text-[#10222b] shadow-sm'
                        : 'text-[#565656] hover:text-[#10222b]'
                    }`}
                  >
                    Net Profit
                  </button>
                  <button
                    onClick={() => setForecastMode('gross')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      forecastMode === 'gross'
                        ? 'bg-white text-[#10222b] shadow-sm'
                        : 'text-[#565656] hover:text-[#10222b]'
                    }`}
                  >
                    Gross Revenue
                  </button>
                </div>
              )}
              {margin <= 0 && (
                <div className="flex items-center gap-2 bg-[#f4faff] border border-[#9abbd8]/30 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-[#4e7597]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-[#4e7597] font-medium">Add margin for profit view</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <ScenarioCard
                title="Conservative"
                profit={formatProfit(conservativeForecast.year1Profit)}
                detail={invest > 0 && !useRevenueMode ? `10% lift · ${conservativeForecast.year1ROI.toFixed(0)}% ROI` : '10% lift target'}
                variant="conservative"
                animationDelay={100}
                isRevenueMode={useRevenueMode}
              />
              <ScenarioCard
                title="Target"
                profit={formatProfit(targetForecast.year1Profit)}
                detail={invest > 0 && !useRevenueMode ? `20% lift · ${targetForecast.year1ROI.toFixed(0)}% ROI` : '20% lift target'}
                variant="target"
                animationDelay={200}
                isRevenueMode={useRevenueMode}
              />
              <ScenarioCard
                title="Best Case"
                profit={formatProfit(bestForecast.year1Profit)}
                detail={invest > 0 && !useRevenueMode ? `40% lift · ${bestForecast.year1ROI.toFixed(0)}% ROI` : '40% lift target'}
                variant="best"
                animationDelay={300}
                isRevenueMode={useRevenueMode}
              />
            </div>

            <ForecastChart
              conservativeData={conservativeForecast.results}
              targetData={targetForecast.results}
              bestData={bestForecast.results}
              isRevenueMode={useRevenueMode}
            />

            <div className="mt-4 p-4 bg-[#f4faff] border border-[#9abbd8]/20 rounded-xl">
              <div className="flex items-start gap-2 text-xs text-[#565656]">
                <svg className="w-4 h-4 text-[#9abbd8] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-1">
                  <p className="font-medium text-[#10222b]">Forecast assumptions:</p>
                  <ul className="space-y-0.5 text-[#565656]">
                    <li>• <strong>Month 1:</strong> Research period (audit, strategy) — no lift yet</li>
                    <li>• <strong>Months 2-12:</strong> Linear ramp from 0% to target lift</li>
                    <li>• Full target lift achieved by end of Year 1</li>
                    <li>• Year 1 cumulative equals ~6 months of full lift impact</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 no-print animate-fade-in-up">
        <button
          onClick={copyResults}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-[#f4faff] border-2 border-[#9abbd8]/30 rounded-xl text-sm font-semibold text-[#10222b] transition-all hover-lift"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied!' : 'Copy Results'}
        </button>

        <button
          onClick={copyShareableLink}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-[#f4faff] border-2 border-[#9abbd8]/30 rounded-xl text-sm font-semibold text-[#10222b] transition-all hover-lift"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {linkCopied ? 'Link Copied!' : 'Share Link'}
        </button>

        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-3 bg-[#10222b] hover:bg-[#243e42] text-white rounded-xl text-sm font-semibold transition-all hover-lift disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isExporting ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* CTA Section */}
      <div className="mt-12 text-center bg-gradient-to-r from-[#10222b] to-[#243e42] rounded-2xl p-8 card-shadow-lg animate-fade-in-up no-print">
        <h3 className="text-2xl font-bold text-white mb-3">
          Ready to unlock this revenue?
        </h3>
        <p className="text-[#9abbd8] mb-6 max-w-xl mx-auto">
          Get a free CRO audit from IMPACT and discover exactly where your conversion opportunities are hiding.
        </p>
        <a
          href="https://www.impactconversion.com/#book"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#72ab7f] hover:bg-[#4caf50] text-white font-bold rounded-xl transition-all hover-lift"
        >
          Get Your Free CRO Audit
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[#565656] text-sm no-print">
        <p className="flex items-center justify-center gap-2">
          Powered by
          <span className="font-black text-[#10222b]">IMPACT.</span>
        </p>
      </div>

      {/* Floating Scroll to Forecast Button */}
      {showForecast && showScrollButton && (
        <button
          onClick={() => forecastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#7e84e5] to-[#757bd6] hover:from-[#757bd6] hover:to-[#7e84e5] text-white rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all z-50 no-print"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>View 12-Month Forecast</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}
