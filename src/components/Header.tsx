import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Bell,
  Check,
  WifiOff,
} from 'lucide-react';
import { UserSession, NotificationItem } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { PorotoIcon } from './PorotoIcon';

interface HeaderProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: { key: string; name: string }[];
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: UserSession;
  allUsers: UserSession[];
  onSwitchUser: (user: UserSession) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  isOnline: boolean;
  percentageDecana: number;
}

export const Header: React.FC<HeaderProps> = ({
  privacyMode,
  onTogglePrivacy,
  darkMode,
  onToggleDarkMode,
  currentUser,
  allUsers,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  isOnline,
  percentageDecana,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-2xl border-b border-stone-200/50 dark:border-stone-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand: POROTO */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/25 dark:from-amber-500/20 dark:to-orange-500/10 flex items-center justify-center shadow-sm flex-shrink-0 border border-amber-500/20">
            <PorotoIcon className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0 flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 font-brand">
              POROTO
            </h1>
            <span className="hidden sm:inline text-xs text-stone-400 dark:text-stone-500 tracking-tight font-medium">
              cuentas de cocina
            </span>
          </div>
        </div>

        {/* Quiet status indicators & Action triggers */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Decana Space Retention */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 font-medium">
            <span>Espacio Decana:</span>
            <span className="text-stone-700 dark:text-stone-300 font-semibold">{percentageDecana * 100}%</span>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Privacy Toggle (Hide / Show numbers for kitchen privacy) */}
          <button
            onClick={onTogglePrivacy}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              privacyMode
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
            title={privacyMode ? 'Modo Privacidad activo (cifras ocultas)' : 'Ocultar cifras de la pantalla'}
            aria-label="Alternar privacidad de cifras"
          >
            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-all"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar modo oscuro"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-all"
              title="Notificaciones de movimientos"
              aria-label="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/70 dark:border-stone-800/70 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800 mb-3">
                  <h4 className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                    Notificaciones
                  </h4>
                  <span className="text-[11px] text-stone-400 font-mono">{unreadCount} pendientes</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">No hay notificaciones nuevas</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-3 rounded-2xl text-xs transition cursor-pointer flex items-start gap-2.5 ${
                          n.read
                            ? 'bg-stone-100/40 dark:bg-stone-800/30 text-stone-400'
                            : 'bg-amber-500/10 text-stone-800 dark:text-stone-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center justify-between">
                            <span className="truncate">{n.title}</span>
                            <span className="text-[10px] text-stone-400 font-normal">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <span title="Marcar como leída">
                            <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition"
              title="Cambiar usuario o rol"
              aria-label="Perfil de usuario"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-stone-800 dark:text-stone-200 max-w-[90px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/70 dark:border-stone-800/70 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 mb-1.5">
                  <div className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">{currentUser.email}</div>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    {currentUser.role === 'coqui_admin'
                      ? 'Dueña & Chef Principal'
                      : currentUser.role === 'ayudante'
                      ? 'Ayudante de Cocina'
                      : 'Administrador Decana'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-stone-400 px-3 pt-1 uppercase">
                    Cambiar Perfil
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs text-left transition ${
                        u.id === currentUser.id
                          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg ${u.avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate flex-1">
                        <div>{u.name.split('(')[0].trim()}</div>
                        <div className="text-[9px] text-stone-400 capitalize">{u.role.replace('_', ' ')}</div>
                      </div>
                      {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
