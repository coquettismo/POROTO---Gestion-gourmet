import React, { useState } from 'react';
import {
  Shield,
  Users,
  Activity,
  Globe,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { UserSession, UserRole, Transaction, Recipe, KitchenDocument } from '../types';
import { PorotoIcon } from './PorotoIcon';

interface AdminPanelProps {
  currentUser: UserSession;
  allUsers: UserSession[];
  onSwitchUser: (user: UserSession) => void;
  language: 'es' | 'en';
  onToggleLanguage: (lang: 'es' | 'en') => void;
  transactionsCount: number;
  recipesCount: number;
  decanaPercentage: number;
  onChangeDecanaPercentage: (pct: number) => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  language,
  onToggleLanguage,
  transactionsCount,
  recipesCount,
  decanaPercentage,
  onChangeDecanaPercentage,
  onExportBackup,
  onRestoreBackup,
}) => {
  const [decanaInput, setDecanaInput] = useState(String(decanaPercentage * 100));
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleUpdateDecana = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(decanaInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      onChangeDecanaPercentage(val / 100);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreBackup(file);
    }
  };

  const rolesMatrix: Record<
    UserRole,
    { label: string; badge: string; permissions: string[] }
  > = {
    coqui_admin: {
      label: 'Titular & Chef Principal (POROTO)',
      badge: 'Acceso Total',
      permissions: [
        'Registro y edición de porotos (ingresos y egresos)',
        'Visualización de Lucro Final y Márgenes',
        'Compensación de Gastos Compartidos (TUKI)',
        'Gestión y creación en el Recetario Culinario',
        'Configuración de Retención Espacio Decana',
        'Sincronización con Mercado Pago QR y Transferencias',
        'Exportación multiformato (PDF, Excel, Word)',
      ],
    },
    ayudante: {
      label: 'Ayudante de Cocina & Logística',
      badge: 'Operativo',
      permissions: [
        'Registro rápido por voz y compras (Verdulería / Super)',
        'Consulta de recetas y escalador de cantidades de viandas',
        'Subida de fotos de platos y notas de compras',
        'Restringido: no visualiza lucro personal ni liquidación general',
      ],
    },
    decana_espacio: {
      label: 'Administración Espacio Decana',
      badge: 'Espacio Compartido',
      permissions: [
        'Consulta de Subtotal mensual del emprendimiento',
        'Liquidación de la retención del espacio acordada (10%)',
        'Participación y aprobación en la compensación TUKI',
        'Visualización del acuerdo de comodato y bromatología',
      ],
    },
  };

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-4 sm:px-6 pt-2">
      {/* Floating Header */}
      <div className="rounded-[32px] p-5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center shadow-md flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <span>Administración &amp; Ajustes</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Control de roles, porcentaje del espacio de cocina y copias de seguridad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 bg-stone-100/60 dark:bg-stone-800/60 text-xs font-semibold text-stone-700 dark:text-stone-200"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span>Idioma: {language.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics & Operational Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">
            <span>Porotos Registrados</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-numeric font-bold text-stone-900 dark:text-white">
            {transactionsCount}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Base sincronizada</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">
            <span>Recetario Activo</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-numeric font-bold text-stone-900 dark:text-white">
            {recipesCount} recetas
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Con escalador dinámico</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">
            <span>IA Gemini 3.8 Flash</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-numeric font-bold text-stone-900 dark:text-white">
            &lt; 650 ms
          </div>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">Latencia media en vivo</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">
            <span>Seguridad Bóveda</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-numeric font-bold text-amber-700 dark:text-amber-400">
            AES-256
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Encriptación local activa</p>
        </div>
      </div>

      {/* Percentage Decana Kitchen Space Configuration */}
      <div className="p-6 rounded-[32px] bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
              Porcentaje Mensual Destinado al Espacio (% Decana)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Actualmente configurado en {decanaPercentage * 100}% sobre el subtotal mensual de utilidades.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateDecana} className="flex items-center gap-3 max-w-sm pt-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={decanaInput}
              onChange={(e) => setDecanaInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-stone-100/60 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 font-numeric font-bold text-sm text-stone-900 dark:text-white"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">%</span>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs transition"
          >
            Actualizar %
          </button>

          {saveFeedback && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Guardado
            </span>
          )}
        </form>
      </div>

      {/* Roles & Permissions Matrix */}
      <div className="p-6 rounded-[32px] bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/40 dark:border-stone-800/50">
          <Users className="w-5 h-5 text-stone-700 dark:text-stone-300" />
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
              Control de Accesos por Perfil (RBAC)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Permisos asignados según el perfil activo en POROTO
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(rolesMatrix) as UserRole[]).map((roleKey) => {
            const roleData = rolesMatrix[roleKey];
            const isCurrent = currentUser.role === roleKey;
            const matchingUser = allUsers.find((u) => u.role === roleKey);

            return (
              <div
                key={roleKey}
                className={`p-5 rounded-3xl border text-xs space-y-3 transition-all ${
                  isCurrent
                    ? 'border-amber-500/60 bg-amber-500/5 shadow-sm'
                    : 'border-stone-200/50 dark:border-stone-800/50 bg-stone-100/40 dark:bg-stone-800/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">{roleData.label}</h4>
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                      {roleData.badge}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[9px] uppercase">
                      Activo
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5 text-stone-600 dark:text-stone-400 text-[11px]">
                  {roleData.permissions.map((perm, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && matchingUser && (
                  <button
                    onClick={() => onSwitchUser(matchingUser)}
                    className="w-full py-2 rounded-2xl border border-stone-200/70 dark:border-stone-700/70 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 text-[11px] font-semibold transition"
                  >
                    Cambiar a este Rol
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup & Data Persistence */}
      <div className="p-6 rounded-[32px] bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
            Copia de Seguridad &amp; Resguardo Local
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Descarga un respaldo en JSON de todos tus porotos, recetas y documentos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold transition active:scale-95"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Descargar Backup JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer transition active:scale-95">
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
