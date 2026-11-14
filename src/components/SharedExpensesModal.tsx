import React, { useState } from 'react';
import {
  X,
  Plus,
  Scale,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { SharedExpense } from '../types';
import { calculateSharedExpensesSettlement, formatCurrency } from '../utils/finance';

interface SharedExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedExpenses: SharedExpense[];
  onAddExpense: (exp: Omit<SharedExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onToggleSettled: (id: string) => void;
  privacyMode: boolean;
}

export const SharedExpensesModal: React.FC<SharedExpensesModalProps> = ({
  isOpen,
  onClose,
  sharedExpenses,
  onAddExpense,
  onDeleteExpense,
  onToggleSettled,
  privacyMode,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [concept, setConcept] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<'Coqui' | 'Decana'>('Coqui');
  const [notes, setNotes] = useState('');
  const [tukiCelebration, setTukiCelebration] = useState(false);

  if (!isOpen) return null;

  const settlement = calculateSharedExpensesSettlement(sharedExpenses);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!concept || isNaN(amount) || amount <= 0) {
      alert('Ingresa concepto y monto válido');
      return;
    }

    onAddExpense({
      date: new Date().toISOString().split('T')[0],
      concept: concept.trim(),
      amount: Math.round(amount),
      paidBy,
      notes: notes.trim(),
      settled: false,
    });

    setConcept('');
    setAmountStr('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleTriggerTuki = () => {
    setTukiCelebration(true);
    setTimeout(() => setTukiCelebration(false), 3500);
  };

  const mask = (val: string) => (privacyMode ? '••••••' : val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl rounded-[36px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/50 dark:border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span>Gastos Compartidos (TUKI)</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Espacio Decana
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Quedan por fuera del cálculo de lucro de POROTO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-2xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Excel Rule Explanation Callout */}
        <div className="mt-3.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-300 space-y-1">
          <p className="font-medium text-stone-800 dark:text-stone-200">
            📌 Regla del Espacio Decana:
          </p>
          <p className="text-[11px] leading-relaxed">
            "Los gastos compartidos quedan por fuera del lucro de la cantina y se incorporan a la cuenta personal. En la compensación, el que está en rojo debe recibir ese monto del otro."
          </p>
        </div>

        {/* TUKI Calculation Card */}
        <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-purple-900/15 via-amber-500/10 to-stone-100 dark:to-stone-800 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-purple-900 dark:text-purple-300">
              Estado de Liquidación
            </span>
            <button
              onClick={handleTriggerTuki}
              className={`px-3 py-1 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all ${
                tukiCelebration
                  ? 'bg-purple-600 scale-105 ring-4 ring-purple-400/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              ¡Presionar TUKI!
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-stone-200 dark:border-stone-700/60">
            <div className="bg-white/80 dark:bg-stone-900/60 p-2 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase">Total Gastos</span>
              <span className="text-sm font-bold font-numeric text-stone-800 dark:text-stone-200">
                {mask(formatCurrency(settlement.totalExpenses))}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-stone-900/60 p-2 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase">Aportó Coqui</span>
              <span className="text-sm font-bold font-numeric text-amber-700 dark:text-amber-400">
                {mask(formatCurrency(settlement.totalCoquiPaid))}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-stone-900/60 p-2 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase">Aportó Decana</span>
              <span className="text-sm font-bold font-numeric text-purple-700 dark:text-purple-400">
                {mask(formatCurrency(settlement.totalDecanaPaid))}
              </span>
            </div>
          </div>

          {/* Result Alert */}
          <div className="mt-3 flex items-center gap-2.5 text-xs">
            {settlement.debtor ? (
              <div className="w-full p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <span>{settlement.settlementMessage}</span>
                </div>
              </div>
            ) : (
              <div className="w-full p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Las cuentas compartidas entre Coqui y Decana están compensadas al 50%.</span>
              </div>
            )}
          </div>
        </div>

        {/* Expenses List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Movimientos Compartidos ({sharedExpenses.length})
            </h4>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Gasto Compartido
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="mb-3 p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Concepto *</label>
                  <input
                    type="text"
                    required
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Ej: Limpieza de campana..."
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="Monto"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">¿Quién lo pagó? *</label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value as 'Coqui' | 'Decana')}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                  >
                    <option value="Coqui">Coqui</option>
                    <option value="Decana">Espacio Decana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Notas / Factura</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalles"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 rounded-lg border text-stone-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-purple-600 text-white font-semibold"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {sharedExpenses.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No hay gastos compartidos registrados.</p>
            ) : (
              sharedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    exp.settled
                      ? 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {exp.concept}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                      <span>{exp.date}</span>
                      <span>•</span>
                      <span>Pagado por: <strong>{exp.paidBy}</strong></span>
                      {exp.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate">{exp.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-bold text-stone-900 dark:text-white">
                      {mask(formatCurrency(exp.amount))}
                    </span>
                    <button
                      onClick={() => onToggleSettled(exp.id)}
                      className={`p-1 rounded-lg text-xs transition ${
                        exp.settled ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'text-stone-400 hover:text-stone-600'
                      }`}
                      title={exp.settled ? 'Marcado como compensado' : 'Marcar como compensado'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
