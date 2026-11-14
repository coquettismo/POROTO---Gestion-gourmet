import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Sparkles,
  TrendingUp,
  Percent,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { MonthSummary, Transaction } from '../types';
import { formatCurrency } from '../utils/finance';
import { exportToCSV, exportToDoc, triggerPrint } from '../utils/exportUtils';
import { PorotoIcon } from './PorotoIcon';

interface ReportsViewProps {
  summaries: MonthSummary[];
  currentSummary: MonthSummary;
  transactions: Transaction[];
  privacyMode: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summaries,
  currentSummary,
  transactions,
  privacyMode,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const mask = (val: string) => (privacyMode ? '••••••' : val);

  // Calculate Category Breakdown
  const expensesByCategory = React.useMemo(() => {
    const cats: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'egreso') {
        cats[tx.concept] = (cats[tx.concept] || 0) + tx.amount;
      }
    }
    return cats;
  }, [transactions]);

  const totalExpenses = Object.values(expensesByCategory).reduce((acc, curr) => acc + curr, 0);

  // Calculate Incomes Breakdown
  const incomesByCategory = React.useMemo(() => {
    const cats: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'ingreso') {
        cats[tx.concept] = (cats[tx.concept] || 0) + tx.amount;
      }
    }
    return cats;
  }, [transactions]);

  const totalIncomes = Object.values(incomesByCategory).reduce((acc, curr) => acc + curr, 0);

  // Maximum value for bar chart scaling
  const maxBarValue = Math.max(
    ...summaries.map((s) => Math.max(s.ingresosCoqui, s.gastosCoqui, Math.max(0, s.lucroFinalCoqui))),
    1000000
  );

  // Gemini AI Financial Analysis
  const requestAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    setAiAnalysis('');

    const prompt = `Analiza los siguientes datos financieros reales de "POROTO" (emprendimiento culinario de viandas gourmet y cocina artesanal):
- Período analizado: ${currentSummary.monthName}
- Ingresos: ${currentSummary.ingresosCoqui} pesos
- Gastos de insumos: ${currentSummary.gastosCoqui} pesos
- Subtotal: ${currentSummary.subtotal} pesos
- Retención espacio cocina (Decana 10%): ${currentSummary.decanaAmount} pesos
- Lucro final POROTO: ${currentSummary.lucroFinalCoqui} pesos
- Desglose de gastos principales: ${JSON.stringify(expensesByCategory)}
- Desglose de ingresos: ${JSON.stringify(incomesByCategory)}

Por favor proporciona un diagnóstico financiero en 3 secciones claras:
1. Análisis de márgenes de ganancia y salud del negocio gastronómico.
2. Detección de sobrecostos (ej: relación verdulería/dietética/super vs viandas).
3. Tres recomendaciones prácticas para optimizar las ganancias y fijar precios de viandas el próximo mes.`;

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.text);
      } else {
        setAiAnalysis('No se pudo conectar con el asesor financiero de Gemini.');
      }
    } catch {
      setAiAnalysis('Error de red al consultar el asistente.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-4 sm:px-6 pt-2">
      {/* Top Header & Export Toolbar Floating Bar */}
      <div className="rounded-[32px] p-5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <span>Reportes de Porotos &amp; Márgenes</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Evolución histórica, retención del espacio y balance analítico
            </p>
          </div>
        </div>

        {/* Multi-Format Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToCSV(transactions, currentSummary.monthName)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition active:scale-95"
            title="Descargar datos en Excel / CSV con formato de moneda argentino"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => exportToDoc(currentSummary, transactions)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition active:scale-95"
            title="Descargar informe ejecutivo en formato Word (.doc)"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Word (.doc)</span>
          </button>

          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:opacity-90 text-white dark:text-stone-900 text-xs font-bold shadow-md shadow-stone-900/10 transition active:scale-95"
            title="Imprimir o Guardar como PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Monthly Evolution Floating Card */}
      <div className="rounded-[36px] p-6 sm:p-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200/40 dark:border-stone-800/50 mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <PorotoIcon className="w-4 h-4" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Evolución Mensual de Porotos
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Comparativa histórica: Ingresos vs Gastos vs Lucro Neto
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              Gastos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Lucro Final
            </span>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 items-end min-h-[220px] pt-4">
          {summaries.map((m) => {
            const ingresoHeight = Math.max(10, Math.round((m.ingresosCoqui / maxBarValue) * 160));
            const gastoHeight = Math.max(10, Math.round((m.gastosCoqui / maxBarValue) * 160));
            const lucroHeight = Math.max(6, Math.round((Math.max(0, m.lucroFinalCoqui) / maxBarValue) * 160));
            const isNegative = m.lucroFinalCoqui < 0;

            return (
              <div key={m.monthKey} className="flex flex-col items-center gap-2.5 group">
                <div className="flex items-end gap-1.5 h-[170px] w-full justify-center">
                  {/* Ingreso Bar */}
                  <div
                    style={{ height: `${ingresoHeight}px` }}
                    className="w-2.5 sm:w-3.5 bg-emerald-500/90 rounded-t-full group-hover:brightness-110 transition-all"
                    title={`Ingresos: ${formatCurrency(m.ingresosCoqui)}`}
                  />
                  {/* Gasto Bar */}
                  <div
                    style={{ height: `${gastoHeight}px` }}
                    className="w-2.5 sm:w-3.5 bg-rose-400/90 rounded-t-full group-hover:brightness-110 transition-all"
                    title={`Gastos: ${formatCurrency(m.gastosCoqui)}`}
                  />
                  {/* Lucro Bar */}
                  <div
                    style={{ height: `${lucroHeight}px` }}
                    className={`w-2.5 sm:w-3.5 rounded-t-full group-hover:brightness-110 transition-all ${
                      isNegative ? 'bg-stone-300 dark:bg-stone-700' : 'bg-amber-500'
                    }`}
                    title={`Lucro Final: ${formatCurrency(m.lucroFinalCoqui)}`}
                  />
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block">
                    {m.monthName.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] font-numeric font-bold block ${isNegative ? 'text-rose-500' : 'text-amber-700 dark:text-amber-400'}`}>
                    {mask(formatCurrency(m.lucroFinalCoqui))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Breakdown: Expenses vs Incomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Expenses Breakdown */}
        <div className="rounded-[32px] p-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/40 dark:border-stone-800/50 mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-500" />
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Distribución de Gastos
              </h4>
            </div>
            <span className="text-xs font-numeric font-bold text-rose-600 dark:text-rose-400">
              Total: {mask(formatCurrency(totalExpenses))}
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(expensesByCategory).length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">No hay gastos registrados en este período</p>
            ) : (
              Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => {
                  const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-numeric font-bold text-stone-900 dark:text-stone-100">
                            {mask(formatCurrency(amount))}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono w-10 text-right">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Income Sources Breakdown */}
        <div className="rounded-[32px] p-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/40 dark:border-stone-800/50 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Fuentes de Ingresos
              </h4>
            </div>
            <span className="text-xs font-numeric font-bold text-emerald-600 dark:text-emerald-400">
              Total: {mask(formatCurrency(totalIncomes))}
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(incomesByCategory).length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">No hay ingresos registrados en este período</p>
            ) : (
              Object.entries(incomesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => {
                  const percentage = totalIncomes > 0 ? ((amount / totalIncomes) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-numeric font-bold text-stone-900 dark:text-stone-100">
                            {mask(formatCurrency(amount))}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono w-10 text-right">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Gemini AI Financial Diagnostic Floating Surface */}
      <div className="rounded-[36px] p-6 sm:p-7 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/20 dark:via-orange-950/10 dark:to-transparent border border-amber-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-900/15">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Asesor Financiero Gemini AI
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Diagnóstico de márgenes, insumos y optimización de precios para POROTO
              </p>
            </div>
          </div>

          <button
            onClick={requestAiAnalysis}
            disabled={isAiAnalyzing}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/15 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            {isAiAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAiAnalyzing ? 'Analizando...' : 'Generar Diagnóstico Financiero'}
          </button>
        </div>

        {aiAnalysis ? (
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap animate-in fade-in">
            {aiAnalysis}
          </div>
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-400 italic">
            Presiona "Generar Diagnóstico Financiero" para que Gemini evalúe los costos de verdulería, super y dietética frente al volumen de viandas y cenas.
          </p>
        )}
      </div>
    </div>
  );
};
