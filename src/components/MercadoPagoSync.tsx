import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  RefreshCw,
  CheckCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  ArrowDownLeft,
  ShieldCheck,
  Smartphone,
  Send,
  Plus,
} from 'lucide-react';
import { MercadoPagoPayment, Transaction } from '../types';
import { formatCurrency } from '../utils/finance';
import { PorotoIcon } from './PorotoIcon';

interface MercadoPagoSyncProps {
  onSyncNewTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  privacyMode: boolean;
}

export const MercadoPagoSync: React.FC<MercadoPagoSyncProps> = ({
  onSyncNewTransaction,
  privacyMode,
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('es-AR'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick Charge Generator State
  const [chargeDescription, setChargeDescription] = useState('Viandas Semanales x 5');
  const [chargeAmount, setChargeAmount] = useState('30000');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showQrPreview, setShowQrPreview] = useState(false);

  // Simulated live feed of MP transactions
  const [payments, setPayments] = useState<MercadoPagoPayment[]>([
    {
      id: 'MP-948271',
      date: '2026-10-28 13:45',
      amount: 150000,
      payerName: 'Empresa Consultoría (Almuerzos)',
      status: 'approved',
      description: 'Viandas corporativas mensuales',
      paymentType: 'transfer',
      synced: true,
    },
    {
      id: 'MP-948190',
      date: '2026-10-28 11:20',
      amount: 24000,
      payerName: 'Martina Rodríguez',
      status: 'approved',
      description: 'Pack viandas saludables x4',
      paymentType: 'qr',
      synced: true,
    },
    {
      id: 'MP-947812',
      date: '2026-10-27 18:30',
      amount: 10000,
      payerName: 'Federico Gómez',
      status: 'approved',
      description: 'Budín cítrico y vianda Khao Soi',
      paymentType: 'qr',
      synced: true,
    },
  ]);

  const mask = (val: string) => (privacyMode ? '••••••' : val);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('es-AR'));
    }, 1200);
  };

  const handleGeneratePaymentLink = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(chargeAmount);
    if (!amountNum || amountNum <= 0) return;

    const mockCheckoutUrl = `https://mpago.la/poroto/pay?desc=${encodeURIComponent(
      chargeDescription
    )}&amount=${amountNum}`;

    setGeneratedLink(mockCheckoutUrl);
    setShowQrPreview(true);
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Simulate an incoming live Mercado Pago Webhook / QR payment
  const handleSimulateIncomingPayment = () => {
    const mockAmounts = [24000, 36000, 48000, 15000];
    const mockNames = ['Camila Bianchi', 'Santiago Rossi', 'Estudio Jurídico Viandas', 'Lucía Peralta'];
    const mockDescs = ['Viandas vegetarianas x4', 'Catering reunión de equipo', 'Viandas Daal x6', 'Budines para evento'];

    const chosenAmount = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
    const chosenName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const chosenDesc = mockDescs[Math.floor(Math.random() * mockDescs.length)];
    const newId = `MP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPayment: MercadoPagoPayment = {
      id: newId,
      date: 'Recién',
      amount: chosenAmount,
      payerName: chosenName,
      status: 'approved',
      description: chosenDesc,
      paymentType: 'qr',
      synced: true,
    };

    setPayments([newPayment, ...payments]);

    // If auto-sync is active, push to POROTO transactions!
    if (autoSyncEnabled) {
      onSyncNewTransaction({
        date: new Date().toISOString().split('T')[0],
        concept: chosenDesc.includes('Budin') ? 'Budin' : 'Viandas',
        type: 'ingreso',
        amount: chosenAmount,
        paymentMethod: 'mercadopago_qr',
        notes: `Cobro MP QR #${newId}: ${chosenName} (${chosenDesc})`,
        customer: chosenName,
        syncedWithMP: true,
      });
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-4 sm:px-6 pt-2">
      {/* Mercado Pago Floating Hero Bar */}
      <div className="rounded-[36px] p-6 sm:p-7 bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white shadow-[0_20px_50px_rgba(2,132,199,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Mercado Pago &amp; Cobros Digitales
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider">
                En Vivo
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-1">
              Sincronización instantánea de transferencias y QR con acreditación en POROTO
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>

          <button
            onClick={handleSimulateIncomingPayment}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 text-xs font-bold shadow-md transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Simular Cobro Entrante</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="rounded-[28px] p-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-stone-700 dark:text-stone-300">
            Conexión activa con cuenta <strong>poroto.cantina@mpago.ar</strong>
          </span>
          <span className="text-stone-300 dark:text-stone-700">·</span>
          <span className="text-stone-400">Última sincro: {lastSyncTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-500 dark:text-stone-400 font-medium">Sincronización automática:</span>
          <button
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              autoSyncEnabled ? 'bg-sky-500' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Two Columns: Payment Link & QR Generator vs Recent Payments Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Instant QR & Link Generator for Customers */}
        <div className="lg:col-span-5 rounded-[36px] p-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/40 dark:border-stone-800/50">
            <QrCode className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Generador de Cobro QR
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Cobro presencial en cocina o link para WhatsApp
              </p>
            </div>
          </div>

          <form onSubmit={handleGeneratePaymentLink} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Concepto o Vianda *
              </label>
              <input
                type="text"
                required
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="Ej: Viandas Semanales x 5..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-100/60 dark:bg-stone-800/60 border border-stone-200/40 dark:border-stone-700/40 text-stone-800 dark:text-stone-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Monto a Cobrar ($ ARS) *
              </label>
              <input
                type="number"
                required
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="30000"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-100/60 dark:bg-stone-800/60 border border-stone-200/40 dark:border-stone-700/40 text-base font-numeric font-bold text-stone-900 dark:text-stone-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-900/15 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Generar QR y Link de Pago</span>
            </button>
          </form>

          {/* QR Display Card */}
          {showQrPreview && (
            <div className="mt-4 p-5 rounded-3xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-800/50 text-center animate-in fade-in">
              <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl shadow-md border border-stone-200 flex items-center justify-center">
                {/* SVG QR Code Simulation */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-stone-900">
                  <path d="M10 10 h30 v30 h-30 z M15 15 v20 h20 v-20 z M22 22 h6 v6 h-6 z" fill="currentColor"/>
                  <path d="M60 10 h30 v30 h-30 z M65 15 v20 h20 v-20 z M72 22 h6 v6 h-6 z" fill="currentColor"/>
                  <path d="M10 60 h30 v30 h-30 z M15 65 v20 h20 v-20 z M22 72 h6 v6 h-6 z" fill="currentColor"/>
                  <circle cx="50" cy="50" r="10" fill="#0284c7" />
                  <rect x="52" y="15" width="5" height="15" fill="currentColor"/>
                  <rect x="15" y="52" width="15" height="5" fill="currentColor"/>
                  <rect x="65" y="65" width="20" height="20" fill="currentColor"/>
                  <rect x="70" y="70" width="10" height="10" fill="#ffffff"/>
                </svg>
              </div>

              <div className="mt-3.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                {chargeDescription}
              </div>
              <div className="text-lg font-numeric font-extrabold text-sky-700 dark:text-sky-400 mt-0.5">
                {mask(formatCurrency(parseFloat(chargeAmount) || 0))}
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-sky-50 shadow-sm"
                >
                  {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? '¡Link Copiado!' : 'Copiar Link WhatsApp'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Mercado Pago Feed */}
        <div className="lg:col-span-7 rounded-[36px] p-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/40 dark:border-stone-800/50">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Movimientos Recibidos en Mercado Pago
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Cobros acreditados y sincronizados con POROTO
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Webhook Activo
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-3xl bg-stone-100/60 dark:bg-stone-800/50 border border-stone-200/40 dark:border-stone-700/40 flex items-center justify-between gap-3 text-xs hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    {p.paymentType === 'qr' ? <QrCode className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {p.payerName}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {p.description} • {p.date}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-numeric font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    +{mask(formatCurrency(p.amount))}
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                    Acreditado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
