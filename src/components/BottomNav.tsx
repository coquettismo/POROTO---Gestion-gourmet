import React from 'react';
import {
  Wallet,
  Mic,
  BarChart3,
  BookOpen,
  CreditCard,
  Settings,
} from 'lucide-react';

export type ActiveTab = 'finance' | 'quick_entry' | 'reports' | 'recipes' | 'mercadopago' | 'admin';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenVoiceModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenVoiceModal,
}) => {
  const tabs = [
    { id: 'finance' as ActiveTab, label: 'Porotos', icon: Wallet },
    { id: 'reports' as ActiveTab, label: 'Reportes', icon: BarChart3 },
    { id: 'quick_entry' as ActiveTab, label: 'Anotar', icon: Mic, isFab: true },
    { id: 'recipes' as ActiveTab, label: 'Recetas', icon: BookOpen },
    { id: 'mercadopago' as ActiveTab, label: 'Mercado Pago', icon: CreditCard },
    { id: 'admin' as ActiveTab, label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-5 inset-x-0 mx-auto max-w-md px-3 z-40 bottom-nav no-print">
      <nav className="rounded-3xl bg-stone-900/90 dark:bg-stone-950/90 text-stone-300 backdrop-blur-2xl border border-stone-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.35)] py-1.5 px-2 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isFab) {
            return (
              <button
                key={tab.id}
                onClick={onOpenVoiceModal}
                className="relative -top-3 flex flex-col items-center group focus:outline-none px-1"
                aria-label="Registrar movimiento por voz o formulario"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:scale-105 active:scale-95 transition-all border-2 border-stone-900 dark:border-stone-950">
                  <Icon className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-amber-500 mt-0.5 tracking-tight">
                  + Anotar
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-4.5 h-4.5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-2.5 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
