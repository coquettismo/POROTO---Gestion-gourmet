import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Scale,
  Plus,
  Trash2,
  Edit2,
  QrCode,
  Banknote,
  DollarSign,
  CreditCard,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Transaction,
  MonthSummary,
  SharedExpense,
} from '../types';
import { formatCurrency, calculateSharedExpensesSettlement } from '../utils/finance';
import { PorotoIcon } from './PorotoIcon';

interface FinanceDashboardProps {
  summary: MonthSummary;
  transactions: Transaction[];
  allTransactions: Transaction[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: { key: string; name: string }[];
  onOpenQuickEntry: (initial?: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenSharedModal: () => void;
  sharedExpenses: SharedExpense[];
  privacyMode: boolean;
  selectedMonthName: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  summary,
  transactions,
  allTransactions,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  onOpenQuickEntry,
  onDeleteTransaction,
  onOpenSharedModal,
  sharedExpenses,
  privacyMode,
  selectedMonthName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc'>('date_desc');

  const mask = (val: string) => (privacyMode ? '••••••' : val);

  // Trigger celebratory confetti on profit milestone / "anotarse un poroto"
  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.55 },
      colors: ['#ea580c', '#fb923c', '#10b981', '#f59e0b'],
    });
  };

  const settlement = useMemo(() => {
    return calculateSharedExpensesSettlement(sharedExpenses);
  }, [sharedExpenses]);

  // Filter & sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const searchMatch =
          searchTerm === '' ||
          t.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (t.recipeName && t.recipeName.toLowerCase().includes(searchTerm.toLowerCase()));

        const categoryMatch = selectedCategory === 'all' || t.concept === selectedCategory;
        const typeMatch = selectedType === 'all' || t.type === selectedType;
        const methodMatch = selectedMethod === 'all' || t.paymentMethod === selectedMethod;

        return searchMatch && categoryMatch && typeMatch && methodMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        return b.date.localeCompare(a.date);
      });
  }, [transactions, searchTerm, selectedCategory, selectedType, selectedMethod, sortBy]);

  // Margin calculation
  const profitMarginPercent =
    summary.ingresosCoqui > 0
      ? ((summary.lucroFinalCoqui / summary.ingresosCoqui) * 100).toFixed(1)
      : '0';

  const categoryIcons: Record<string, string> = {
    Verduleria: '🥬',
    Supermercado: '🛒',
    Dietetica: '🌰',
    Papelera: '📦',
    Viandas: '🍱',
    'Cena/Almuerzo': '🍽️',
    Budin: '🍋',
    'Espacio/Decana': '🏢',
    Otros: '🏷️',
  };

  // Month contributions calculation for the Total view
  const monthContributionList = useMemo(() => {
    return availableMonths.map((m) => {
      const monthTxs = allTransactions.filter((t) => t.date.startsWith(m.key));
      const ingresos = monthTxs.filter((t) => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
      const gastos = monthTxs.filter((t) => t.type === 'egreso').reduce((acc, t) => acc + t.amount, 0);
      const subtotal = Math.max(0, ingresos - gastos);
      const decana = Math.round(subtotal * 0.10);
      const lucro = subtotal - decana;
      return {
        key: m.key,
        name: m.name.split(' ')[0], // "Octubre", "Septiembre", etc.
        lucro,
        count: monthTxs.length,
      };
    });
  }, [availableMonths, allTransactions]);

  const isTotalView = selectedMonth === 'all';

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-4 sm:px-6 pt-2">
      {/* 1. Floating Period Ribbon: Total & Monthly Sectioning */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1.5 scrollbar-none">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-200/50 dark:bg-stone-900/60 backdrop-blur-xl border border-stone-200/40 dark:border-stone-800/40 shadow-inner">
          <button
            onClick={() => onSelectMonth('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 ${
              isTotalView
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] scale-100'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <PorotoIcon className="w-3.5 h-3.5" />
            <span>Total Acumulado</span>
          </button>

          <div className="w-px h-4 bg-stone-300 dark:bg-stone-700/60 mx-0.5" />

          {availableMonths.map((m) => {
            const isSelected = selectedMonth === m.key;
            const shortName = m.name.split(' ')[0]; // E.g. "Octubre"
            return (
              <button
                key={m.key}
                onClick={() => onSelectMonth(m.key)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 font-medium'
                }`}
              >
                {shortName}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onOpenQuickEntry()}
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
        >
          <Plus className="w-4 h-4" />
          <span>Anotar Poroto</span>
        </button>
      </div>

      {/* 2. Floating Hero Canvas (Efecto Flotante, Sin Bordes Duros) */}
      <div className="relative rounded-[36px] bg-gradient-to-b from-white/90 via-white/80 to-white/70 dark:from-stone-900/90 dark:via-stone-900/80 dark:to-stone-900/70 backdrop-blur-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-9 overflow-hidden transition-all">
        {/* Soft atmospheric gradient glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-amber-400/10 via-orange-500/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-orange-400/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Kicker & Celebration */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <PorotoIcon className="w-4 h-4" />
                {isTotalView ? 'Porotos Totales Acumulados' : `Porotos de ${selectedMonthName}`}
              </span>
              <span className="text-xs text-stone-300 dark:text-stone-700">·</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                Lucro Final Coqui
              </span>
            </div>

            <button
              onClick={triggerConfetti}
              className="px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
              title="¡Anotarse un poroto!"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>¡Anotate un poroto!</span>
            </button>
          </div>

          {/* Large Clean Numerical Figure */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="text-4xl sm:text-6xl font-numeric font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              {mask(formatCurrency(summary.lucroFinalCoqui, true))}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {profitMarginPercent}% margen neto
            </div>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
            {isTotalView
              ? `Ganancia neta acumulada de todos los períodos tras retener el 10% del espacio Decana.`
              : `Ganancia neta del período ${selectedMonthName} tras retener el 10% del espacio Decana.`}
          </p>

          {/* Sub-metrics Floating Triad (Ingresos / Gastos / Retención) */}
          <div className="mt-8 pt-6 border-t border-stone-200/50 dark:border-stone-800/60 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Ingresos */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ingresos / Ventas</span>
              </div>
              <div className="text-xl sm:text-2xl font-numeric font-bold text-stone-900 dark:text-stone-100">
                {mask(formatCurrency(summary.ingresosCoqui))}
              </div>
              <div className="text-[11px] text-stone-400">Viandas, cenas &amp; eventos</div>
            </div>

            {/* Gastos de Cocina */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-600" />
                <span>Gastos de Cocina</span>
              </div>
              <div className="text-xl sm:text-2xl font-numeric font-bold text-stone-900 dark:text-stone-100">
                {mask(formatCurrency(summary.gastosCoqui))}
              </div>
              <div className="text-[11px] text-stone-400">Verdulería, super &amp; dietética</div>
            </div>

            {/* Espacio Decana 10% */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Retención Decana (10%)</span>
              </div>
              <div className="text-xl sm:text-2xl font-numeric font-bold text-purple-700 dark:text-purple-400">
                {mask(formatCurrency(summary.decanaAmount, true))}
              </div>
              <div className="text-[11px] text-stone-400">
                Subtotal base: <strong>{mask(formatCurrency(summary.subtotal))}</strong>
              </div>
            </div>
          </div>

          {/* Month Contribution Micro-Strip when Total is selected */}
          {isTotalView && (
            <div className="mt-8 pt-5 border-t border-stone-200/50 dark:border-stone-800/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Desglose mensual de porotos
                </span>
                <span className="text-[11px] text-stone-400">Toca un mes para seccionar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {monthContributionList.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => onSelectMonth(m.key)}
                    className="p-2.5 rounded-2xl bg-stone-100/60 dark:bg-stone-800/40 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-stone-200/40 dark:border-stone-800/40 transition-all text-left group"
                  >
                    <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                      {m.name}
                    </div>
                    <div className="text-xs font-numeric font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      {mask(formatCurrency(m.lucro))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Floating TUKI Shared Expenses Card (Regla del Espacio Decana) */}
      <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-purple-500/5 via-amber-500/5 to-transparent dark:from-purple-950/20 dark:via-amber-950/10 dark:to-transparent border border-purple-500/15 dark:border-purple-500/20 shadow-[0_10px_30px_rgba(168,85,247,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/15 text-purple-700 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Compensación TUKI (Gastos del Espacio)
              </span>
              <span className="text-[11px] text-stone-400">fuera del lucro personal</span>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
              {settlement.settlementMessage}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSharedModal}
          className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/10 flex items-center gap-1.5 transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ver TUKI &amp; Saldos</span>
        </button>
      </div>

      {/* 4. Filter & Search Bar (Floating & Sleek) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por plato, ingrediente, verdulería, cliente..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 text-stone-700 dark:text-stone-300 focus:outline-none font-medium cursor-pointer shadow-sm"
            >
              <option value="all">Ingresos y Egresos</option>
              <option value="ingreso">Solo Ingresos (Ventas)</option>
              <option value="egreso">Solo Egresos (Compras)</option>
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 text-stone-700 dark:text-stone-300 focus:outline-none font-medium cursor-pointer shadow-sm"
            >
              <option value="all">Cualquier Método</option>
              <option value="mercadopago_qr">Mercado Pago QR</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="debito">Débito</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date_desc' | 'date_asc' | 'amount_desc')}
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 text-stone-700 dark:text-stone-300 focus:outline-none font-medium cursor-pointer shadow-sm"
            >
              <option value="date_desc">Más recientes</option>
              <option value="date_asc">Más antiguos</option>
              <option value="amount_desc">Mayor monto</option>
            </select>
          </div>
        </div>

        {/* Category Filters: Minimal Floating Triggers */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-2xl transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-medium'
            }`}
          >
            Todas ({transactions.length})
          </button>
          {[
            'Verduleria',
            'Supermercado',
            'Dietetica',
            'Viandas',
            'Cena/Almuerzo',
            'Budin',
            'Papelera',
            'Otros',
          ].map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = transactions.filter((t) => t.concept === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-2xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-medium'
                }`}
              >
                <span>{categoryIcons[cat] || '🏷️'}</span>
                <span>{cat}</span>
                <span className="text-[10px] opacity-60 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Floating Movements Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="text-xs font-semibold text-stone-400 dark:text-stone-500">
            Movimientos ({filteredTransactions.length} de {transactions.length})
          </div>
          <button
            onClick={() => onOpenQuickEntry()}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Movimiento</span>
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="rounded-3xl p-12 text-center bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl border border-stone-200/40 dark:border-stone-800/40">
            <PorotoIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
              No hay movimientos con los filtros actuales
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
              Prueba cambiando el mes o ajustando la categoría seleccionada.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'ingreso';
              return (
                <div
                  key={tx.id}
                  className="group rounded-3xl p-3.5 sm:p-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/40 dark:border-stone-800/40 hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all duration-200 flex items-center justify-between gap-4"
                >
                  {/* Left: Category Icon & Metadata */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-stone-100/90 dark:bg-stone-800/90 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                      {categoryIcons[tx.concept] || '🏷️'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-50 truncate">
                          {tx.concept}
                        </span>
                        {tx.recipeName && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-[140px]">
                            🍲 {tx.recipeName}
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-stone-200/50 dark:bg-stone-800 text-stone-500'
                          }`}
                        >
                          {isIncome ? 'Ingreso' : 'Gasto'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                        <span className="font-mono">{tx.date}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 capitalize">
                          {tx.paymentMethod === 'mercadopago_qr' && <QrCode className="w-3 h-3 text-sky-500" />}
                          {tx.paymentMethod === 'transferencia' && <Banknote className="w-3 h-3 text-emerald-500" />}
                          {tx.paymentMethod === 'efectivo' && <DollarSign className="w-3 h-3 text-amber-500" />}
                          {tx.paymentMethod === 'debito' && <CreditCard className="w-3 h-3 text-purple-500" />}
                          {tx.paymentMethod.replace('_', ' ')}
                        </span>
                        {tx.notes && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline italic truncate max-w-[200px]">
                              "{tx.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-numeric font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {mask(formatCurrency(tx.amount))}
                      </div>
                      {tx.syncedWithMP && (
                        <span className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold block">
                          ✓ MP Sync
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenQuickEntry(tx)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="Editar movimiento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
