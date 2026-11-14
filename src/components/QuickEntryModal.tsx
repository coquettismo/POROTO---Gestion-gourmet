import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  FileText,
  Check,
  Loader2,
  Volume2,
} from 'lucide-react';
import { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '../types';
import { parseVoiceInputText, formatCurrency } from '../utils/finance';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialData?: Transaction | null;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'egreso');
  const [amountStr, setAmountStr] = useState<string>(initialData?.amount ? String(initialData.amount) : '');
  const [concept, setConcept] = useState<TransactionCategory>(initialData?.concept || 'Verduleria');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'transferencia');
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [recipeName, setRecipeName] = useState<string>(initialData?.recipeName || '');

  // Voice recording state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(String(initialData.amount));
      setConcept(initialData.concept);
      setPaymentMethod(initialData.paymentMethod);
      setDate(initialData.date);
      setNotes(initialData.notes || '');
      setRecipeName(initialData.recipeName || '');
    } else {
      // Reset form
      setType('egreso');
      setAmountStr('');
      setConcept('Verduleria');
      setPaymentMethod('transferencia');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setRecipeName('');
      setTranscript('');
      setVoiceFeedback('');
    }
  }, [initialData, isOpen]);

  // Voice Speech Recognition Setup
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop: () => void }).stop();
      }
      setIsListening(false);
      return;
    }

    // Check Web Speech API support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceFeedback('El reconocimiento de voz no está soportado en este navegador. Escribe la frase en el campo.');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Escuchando tu voz... (Ej: "Gasté 45 mil pesos en verdulería compré tomates y albahaca")');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedback('No se detectó audio. Pulsa el micrófono para intentar de nuevo.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          processTranscriptWithGemini(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setVoiceFeedback('Error accediendo al micrófono.');
    }
  };

  // Process transcript with Gemini 3.8 Flash (with instant local fallback)
  const processTranscriptWithGemini = async (text: string) => {
    if (!text.trim()) return;
    setIsAiProcessing(true);
    setVoiceFeedback('Gemini AI analizando el movimiento...');

    try {
      const res = await fetch('/api/gemini/parse-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioTranscript: text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.amount) setAmountStr(String(data.amount));
        if (data.type) setType(data.type);
        if (data.concept) setConcept(data.concept);
        if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
        if (data.notes) setNotes(data.notes);
        if (data.recipeName) setRecipeName(data.recipeName);
        setVoiceFeedback(`¡Detectado con Gemini! ${data.type === 'ingreso' ? 'Ingreso' : 'Egreso'} de $${data.amount} en ${data.concept}`);
      } else {
        throw new Error('Fallback to local parser');
      }
    } catch {
      // Local regex fallback
      const parsed = parseVoiceInputText(text);
      if (parsed.amount) setAmountStr(String(parsed.amount));
      if (parsed.type) setType(parsed.type);
      if (parsed.concept) setConcept(parsed.concept);
      if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      if (parsed.notes) setNotes(parsed.notes);
      setVoiceFeedback(`Comando procesado: ${parsed.type === 'ingreso' ? 'Ingreso' : 'Egreso'} de $${parsed.amount}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyShortcut = (
    c: TransactionCategory,
    t: TransactionType,
    a: number,
    n: string,
    pm: PaymentMethod
  ) => {
    setConcept(c);
    setType(t);
    setAmountStr(String(a));
    setNotes(n);
    setPaymentMethod(pm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    onSaveTransaction({
      date,
      concept,
      type,
      amount: Math.round(parsedAmount),
      paymentMethod,
      notes: notes.trim(),
      recipeName: recipeName.trim() || undefined,
      syncedWithMP: paymentMethod === 'mercadopago_qr' || paymentMethod === 'transferencia',
    });

    onClose();
  };

  if (!isOpen) return null;

  const categories: { id: TransactionCategory; label: string; icon: string }[] = [
    { id: 'Verduleria', label: 'Verdulería', icon: '🥬' },
    { id: 'Supermercado', label: 'Supermercado', icon: '🛒' },
    { id: 'Dietetica', label: 'Dietética', icon: '🌰' },
    { id: 'Papelera', label: 'Papelera / Packaging', icon: '📦' },
    { id: 'Viandas', label: 'Viandas', icon: '🍱' },
    { id: 'Cena/Almuerzo', label: 'Cena / Almuerzo', icon: '🍽️' },
    { id: 'Budin', label: 'Budín / Dulce', icon: '🍋' },
    { id: 'Espacio/Decana', label: 'Espacio Decana', icon: '🏢' },
    { id: 'Otros', label: 'Otros Gastos', icon: '🏷️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg rounded-[36px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/50 dark:border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {initialData ? 'Editar Poroto' : 'Anotar Poroto'}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Por comando de voz con Gemini o carga directa
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

        {/* Voice Command Banner */}
        <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <Mic className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Dictar por Voz a Gemini</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 truncate mt-0.5">
                {voiceFeedback || 'Presiona el mic y habla naturalmente para autocompletar'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isListening
                  ? 'bg-red-500 text-white animate-bounce'
                  : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
              }`}
              title={isListening ? 'Detener grabación' : 'Iniciar dictado por voz'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Transcript input for manual edit or if speech is speaking */}
          {(transcript || isAiProcessing) && (
            <div className="mt-2.5 pt-2 border-t border-amber-500/15 flex items-center gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Frase reconocida..."
                className="flex-1 bg-white/80 dark:bg-stone-800/80 rounded-xl px-2.5 py-1 text-xs border border-amber-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => processTranscriptWithGemini(transcript)}
                disabled={isAiProcessing || !transcript}
                className="px-2.5 py-1 rounded-xl bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-amber-700 disabled:opacity-50"
              >
                {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Analizar
              </button>
            </div>
          )}
        </div>

        {/* Quick Shortcuts */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-stone-400 font-medium whitespace-nowrap text-[10px] uppercase">Rápidos:</span>
          <button
            type="button"
            onClick={() => handleApplyShortcut('Verduleria', 'egreso', 42000, 'Verdulería central', 'transferencia')}
            className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-950 transition"
          >
            🥬 Verdu $42k
          </button>
          <button
            type="button"
            onClick={() => handleApplyShortcut('Viandas', 'ingreso', 60000, 'Viandas semanales', 'mercadopago_qr')}
            className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-950 transition"
          >
            🍱 Viandas $60k QR
          </button>
          <button
            type="button"
            onClick={() => handleApplyShortcut('Dietetica', 'egreso', 18000, 'Especias y legumbres', 'transferencia')}
            className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-950 transition"
          >
            🌰 Dietética $18k
          </button>
          <button
            type="button"
            onClick={() => handleApplyShortcut('Budin', 'ingreso', 10000, 'Budín de limón', 'efectivo')}
            className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-950 transition"
          >
            🍋 Budín $10k cash
          </button>
        </div>

        {/* Direct Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Type Toggle: Ingreso vs Egreso */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('egreso')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'egreso'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Egreso (Gasto de Cocina)
            </button>
            <button
              type="button"
              onClick={() => setType('ingreso')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'ingreso'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Ingreso (Venta / Cobro)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Monto en Pesos ($ ARS) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">
                $
              </span>
              <input
                type="number"
                step="1"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xl font-numeric font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((c) => {
                const isSelected = concept === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConcept(c.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium border text-left transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {[
                { id: 'transferencia' as PaymentMethod, label: 'Transferencia', icon: Banknote },
                { id: 'mercadopago_qr' as PaymentMethod, label: 'Mercado Pago QR', icon: QrCode },
                { id: 'efectivo' as PaymentMethod, label: 'Efectivo', icon: DollarSign },
                { id: 'debito' as PaymentMethod, label: 'Débito / Tarjeta', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Recipe/Notes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Receta Vinculada (Opcional)
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Ej: Khao Soi, Daal, Quibebe..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Notas / Proveedor / Cliente
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Isa viandas 10u, Don Mario verdulería tomates y albahaca..."
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-xs font-bold text-white shadow-md active:scale-95 transition"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
