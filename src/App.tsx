import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_HISTORICAL_SUMMARIES,
  INITIAL_SHARED_EXPENSES,
  INITIAL_RECIPES,
  INITIAL_DOCUMENTS,
  INITIAL_USERS,
} from './data/migratedData';
import {
  Transaction,
  MonthSummary,
  SharedExpense,
  Recipe,
  KitchenDocument,
  UserSession,
  NotificationItem,
} from './types';
import { calculateMonthSummary } from './utils/finance';
import { useOnlineStatus } from './utils/useOnlineStatus';
import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { FinanceDashboard } from './components/FinanceDashboard';
import { QuickEntryModal } from './components/QuickEntryModal';
import { SharedExpensesModal } from './components/SharedExpensesModal';
import { ReportsView } from './components/ReportsView';
import { RecipeSection } from './components/RecipeSection';
import { MercadoPagoSync } from './components/MercadoPagoSync';
import { DocumentsAndVault } from './components/DocumentsAndVault';
import { AdminPanel } from './components/AdminPanel';
import { Bell, CheckCircle, WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Persistent States with localStorage fallback
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cantina_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>(() => {
    const saved = localStorage.getItem('cantina_shared_expenses');
    return saved ? JSON.parse(saved) : INITIAL_SHARED_EXPENSES;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('cantina_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [documents, setDocuments] = useState<KitchenDocument[]>(() => {
    const saved = localStorage.getItem('cantina_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [users, setUsers] = useState<UserSession[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserSession>(INITIAL_USERS[0]);

  // Configurations
  const [percentageDecana, setPercentageDecana] = useState<number>(0.10);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [activeTab, setActiveTab] = useState<ActiveTab>('finance');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cantina_dark_mode');
    return saved !== null ? saved === 'true' : true; // Default dark mode for refined culinary palette
  });

  // Modal States
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);

  // In-app Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Datos Migrados con Éxito',
      message: 'Se cargaron los 88 registros históricos de Abril a Octubre de 2026 desde tu archivo de Excel.',
      timestamp: 'Hoy',
      type: 'system',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Espacio Decana: 10% Activo',
      message: 'El porcentaje acordado se descuenta automáticamente del subtotal mensual de la cantina.',
      timestamp: 'Hoy',
      type: 'decana',
      read: false,
    },
  ]);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cantina_dark_mode', String(darkMode));
  }, [darkMode]);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('cantina_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('cantina_shared_expenses', JSON.stringify(sharedExpenses));
  }, [sharedExpenses]);

  useEffect(() => {
    localStorage.setItem('cantina_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('cantina_documents', JSON.stringify(documents));
  }, [documents]);

  // Push notification helper
  const triggerNotification = (title: string, message: string, type: NotificationItem['type'] = 'transaction') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(`${title}: ${message}`);
    setTimeout(() => setActiveToast(null), 4500);

    // Browser Web Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/pwa-192x192.png',
        });
      } catch {
        // Ignored if blocked in iframe
      }
    }
  };

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Available Months for picker
  const availableMonths = [
    { key: '2026-10', name: 'Octubre 2026' },
    { key: '2026-09', name: 'Septiembre 2026' },
    { key: '2026-08', name: 'Agosto 2026' },
    { key: '2026-07', name: 'Julio 2026' },
    { key: '2026-06', name: 'Junio 2026' },
    { key: '2026-05', name: 'Mayo 2026' },
    { key: '2026-04', name: 'Abril 2026' },
    { key: '2026-11', name: 'Noviembre 2026' },
    { key: '2026-12', name: 'Diciembre 2026' },
  ];

  // Filter transactions by selected month
  const currentPeriodTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const selectedMonthName = useMemo(() => {
    if (selectedMonth === 'all') return 'Todos los Períodos';
    return availableMonths.find((m) => m.key === selectedMonth)?.name || selectedMonth;
  }, [selectedMonth]);

  // Current Month Summary calculation
  const currentSummary = useMemo(() => {
    return calculateMonthSummary(
      selectedMonth,
      selectedMonthName,
      currentPeriodTransactions,
      percentageDecana
    );
  }, [selectedMonth, selectedMonthName, currentPeriodTransactions, percentageDecana]);

  // All months summaries for reports
  const allMonthsSummaries = useMemo(() => {
    const list = availableMonths.map((m) => {
      const monthTxs = transactions.filter((t) => t.date.startsWith(m.key));
      return calculateMonthSummary(m.key, m.name, monthTxs, percentageDecana);
    });
    // Sort chronologically April to December
    return list.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [transactions, percentageDecana]);

  // Transaction Handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTransaction.id ? { ...txData, id: t.id, createdAt: t.createdAt } : t))
      );
      triggerNotification('Movimiento Modificado', `${txData.concept}: $${txData.amount}`);
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
      triggerNotification(
        txData.type === 'ingreso' ? 'Ingreso Registrado' : 'Gasto Registrado',
        `${txData.concept} ($${txData.amount}) - ${txData.notes || txData.paymentMethod}`,
        txData.syncedWithMP ? 'mercadopago' : 'transaction'
      );
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (confirm(`¿Seguro que deseas eliminar el movimiento de ${tx?.concept} ($${tx?.amount})?`)) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      triggerNotification('Movimiento Eliminado', `${tx?.concept || 'Registro'}`);
    }
  };

  // Shared Expenses Handlers
  const handleAddSharedExpense = (expData: Omit<SharedExpense, 'id'>) => {
    const newExp: SharedExpense = {
      ...expData,
      id: `se-${Date.now()}`,
    };
    setSharedExpenses((prev) => [newExp, ...prev]);
    triggerNotification('Gasto Compartido Agregado', `${expData.concept} ($${expData.amount}) pagado por ${expData.paidBy}`, 'decana');
  };

  const handleDeleteSharedExpense = (id: string) => {
    setSharedExpenses((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSettled = (id: string) => {
    setSharedExpenses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, settled: !s.settled } : s))
    );
  };

  // Recipe Handlers
  const handleAddRecipe = (recipeData: Omit<Recipe, 'id'>) => {
    const newRec: Recipe = {
      ...recipeData,
      id: `rec-${Date.now()}`,
    };
    setRecipes((prev) => [newRec, ...prev]);
    triggerNotification('Receta Guardada', `${newRec.title} agregada al recetario`);
  };

  const handleUpdateRecipe = (recipe: Recipe) => {
    setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)));
    triggerNotification('Receta Actualizada', recipe.title);
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  // Document Handlers
  const handleAddDocument = (docData: Omit<KitchenDocument, 'id' | 'updatedAt'>) => {
    const newDoc: KitchenDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    triggerNotification('Documento Guardado', newDoc.title);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Backup & Restore Handlers
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      transactions,
      sharedExpenses,
      recipes,
      documents,
      percentageDecana,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cantina_Coqui_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerNotification('Backup Exportado', 'Archivo JSON generado');
  };

  const handleRestoreBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.sharedExpenses) setSharedExpenses(data.sharedExpenses);
        if (data.recipes) setRecipes(data.recipes);
        if (data.documents) setDocuments(data.documents);
        if (data.percentageDecana) setPercentageDecana(data.percentageDecana);
        triggerNotification('Copia Restaurada', 'Todos los datos se actualizaron con éxito');
      } catch {
        alert('El archivo no tiene un formato JSON válido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'} flex flex-col font-sans transition-colors selection:bg-amber-600/20 selection:text-amber-800`}>
      {/* Top Header */}
      <Header
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        availableMonths={availableMonths}
        privacyMode={privacyMode}
        onTogglePrivacy={() => setPrivacyMode(!privacyMode)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={setCurrentUser}
        notifications={notifications}
        onMarkNotificationRead={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        }
        isOnline={isOnline}
        percentageDecana={percentageDecana}
      />

      {/* In-app Toast Banner */}
      {activeToast && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-stone-900 text-white shadow-2xl border border-stone-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-medium">{activeToast}</span>
        </div>
      )}

      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed bottom-18 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-lg">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Modo Offline: tus registros se guardan en el dispositivo</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {activeTab === 'finance' && (
          <FinanceDashboard
            summary={currentSummary}
            transactions={currentPeriodTransactions}
            allTransactions={transactions}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            availableMonths={availableMonths}
            onOpenQuickEntry={(initial) => {
              setEditingTransaction(initial || null);
              setIsQuickEntryOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenSharedModal={() => setIsSharedModalOpen(true)}
            sharedExpenses={sharedExpenses}
            privacyMode={privacyMode}
            selectedMonthName={selectedMonthName}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            summaries={allMonthsSummaries}
            currentSummary={currentSummary}
            transactions={currentPeriodTransactions}
            privacyMode={privacyMode}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeSection
            recipes={recipes}
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            privacyMode={privacyMode}
          />
        )}

        {activeTab === 'mercadopago' && (
          <MercadoPagoSync
            onSyncNewTransaction={(tx) => handleSaveTransaction(tx)}
            privacyMode={privacyMode}
          />
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <AdminPanel
              currentUser={currentUser}
              allUsers={users}
              onSwitchUser={setCurrentUser}
              language={language}
              onToggleLanguage={setLanguage}
              transactionsCount={transactions.length}
              recipesCount={recipes.length}
              decanaPercentage={percentageDecana}
              onChangeDecanaPercentage={setPercentageDecana}
              onExportBackup={handleExportBackup}
              onRestoreBackup={handleRestoreBackup}
            />

            <DocumentsAndVault
              documents={documents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              privacyMode={privacyMode}
            />
          </div>
        )}
      </main>

      {/* Quick Entry Modal (Voice + Form) */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => {
          setIsQuickEntryOpen(false);
          setEditingTransaction(null);
        }}
        onSaveTransaction={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Shared Expenses "TUKI" Modal */}
      <SharedExpensesModal
        isOpen={isSharedModalOpen}
        onClose={() => setIsSharedModalOpen(false)}
        sharedExpenses={sharedExpenses}
        onAddExpense={handleAddSharedExpense}
        onDeleteExpense={handleDeleteSharedExpense}
        onToggleSettled={handleToggleSettled}
        privacyMode={privacyMode}
      />

      {/* Mobile-first Handheld Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenVoiceModal={() => {
          setEditingTransaction(null);
          setIsQuickEntryOpen(true);
        }}
      />
    </div>
  );
}
