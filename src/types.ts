export type TransactionType = 'ingreso' | 'egreso';

export type TransactionCategory =
  | 'Verduleria'
  | 'Supermercado'
  | 'Dietetica'
  | 'Papelera'
  | 'Viandas'
  | 'Cena/Almuerzo'
  | 'Budin'
  | 'Espacio/Decana'
  | 'Otros';

export type PaymentMethod =
  | 'mercadopago_qr'
  | 'transferencia'
  | 'efectivo'
  | 'debito';

export interface Transaction {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  concept: TransactionCategory;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  recipeName?: string;
  customer?: string;
  receiptUrl?: string;
  syncedWithMP?: boolean;
  isShared?: boolean;
  createdAt?: string;
}

export interface SharedExpense {
  id: string;
  date: string;
  concept: string;
  amount: number;
  paidBy: 'Coqui' | 'Decana' | string;
  notes?: string;
  settled: boolean;
}

export interface MonthSummary {
  monthKey: string; // '2026-04'
  monthName: string; // 'Abril 2026'
  gastosCoqui: number;
  ingresosCoqui: number;
  subtotal: number;
  gastosCompartidos: number;
  decanaPercentage: number; // default 0.10 (10%)
  decanaAmount: number;
  lucroFinalCoqui: number;
  transactionsCount: number;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  estimatedCost?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: 'Plato Principal' | 'Sopa/Entrada' | 'Pastelería' | 'Guarnición' | 'Bebida';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  defaultYieldPortions: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  photoUrl?: string;
  notes?: string;
  costPerPortionEstimate?: number;
  salePricePerPortion?: number;
  tags: string[];
  lastCookedDate?: string;
}

export interface KitchenDocument {
  id: string;
  title: string;
  category: 'contrato' | 'proveedores' | 'bromatologia' | 'recetario' | 'manual';
  fileType: 'pdf' | 'doc' | 'text' | 'image';
  sizeKb: number;
  updatedAt: string;
  content: string;
  tags: string[];
  isEncrypted: boolean;
}

export type UserRole = 'coqui_admin' | 'ayudante' | 'decana_espacio';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatarBg: string;
}

export interface MercadoPagoPayment {
  id: string;
  date: string;
  amount: number;
  payerName: string;
  payerEmail?: string;
  status: 'approved' | 'pending' | 'rejected';
  description: string;
  paymentType: 'qr' | 'transfer' | 'card';
  synced: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'transaction' | 'mercadopago' | 'system' | 'decana';
  read: boolean;
}
