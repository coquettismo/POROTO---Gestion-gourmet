import { Transaction, MonthSummary, SharedExpense, RecipeIngredient } from '../types';

/**
 * Parses Latin American / Argentine currency strings like "$41.600", "150000", " $1.028.000,00", "- $27.555,30"
 */
export function parseCurrencyString(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  const isNegative = str.includes('-') || str.startsWith('(');

  // Remove currency signs, whitespace, parentheses
  str = str.replace(/[$\s()\-]/g, '');

  if (!str) return 0;

  // If format is like 1.028.000,00 or 76.399,60
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Only comma: e.g. "76399,60"
    str = str.replace(',', '.');
  } else if (str.includes('.')) {
    // Check if dot is thousands separator like "41.600" or decimal like "41.6"
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Formats a number to Argentine Pesos style: "$ 1.028.000" or "$ 76.399,60"
 */
export function formatCurrency(amount: number, includeDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ 0';
  
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(abs);

  if (amount < 0) {
    return `- $ ${formatted}`;
  }
  return `$ ${formatted}`;
}

/**
 * Calculates monthly financial summary according to POROTO rules
 * Note: % decana is applied to subtotal (10%), and Lucro = subtotal - % decana.
 */
export function calculateMonthSummary(
  monthKey: string,
  monthName: string,
  transactions: Transaction[],
  decanaPercentage = 0.10,
  gastosCompartidosTotal = 0
): MonthSummary {
  let ingresosCoqui = 0;
  let gastosCoqui = 0;

  for (const t of transactions) {
    if (t.isShared) continue; // Shared expenses stay out of personal venture profit
    if (t.type === 'ingreso') {
      ingresosCoqui += t.amount;
    } else {
      gastosCoqui += t.amount;
    }
  }

  const subtotal = ingresosCoqui - gastosCoqui;
  const decanaAmount = subtotal * decanaPercentage;
  const lucroFinalCoqui = subtotal - decanaAmount;

  return {
    monthKey,
    monthName,
    gastosCoqui,
    ingresosCoqui,
    subtotal,
    gastosCompartidos: gastosCompartidosTotal,
    decanaPercentage,
    decanaAmount,
    lucroFinalCoqui,
    transactionsCount: transactions.length,
  };
}

/**
 * Calculates shared expenses compensation ("TUKI" logic from the spreadsheet note)
 * Note from spreadsheet:
 * "Los gastos compartidos deben quedar por fuera del calculo de lucro que tuviste en tu mes.
 * En la compensacion el que esta en rojo debe recibir ese monto del otro."
 */
export function calculateSharedExpensesSettlement(expenses: SharedExpense[]) {
  let totalCoquiPaid = 0;
  let totalDecanaPaid = 0;
  let totalExpenses = 0;

  for (const exp of expenses) {
    if (exp.settled) continue;
    totalExpenses += exp.amount;
    if (exp.paidBy.toLowerCase() === 'coqui') {
      totalCoquiPaid += exp.amount;
    } else {
      totalDecanaPaid += exp.amount;
    }
  }

  // Each party should pay 50% of the shared expenses
  const fairShare = totalExpenses / 2;
  const coquiBalance = totalCoquiPaid - fairShare; // If positive, Coqui paid more than fair share
  const decanaBalance = totalDecanaPaid - fairShare;

  let settlementMessage = 'Las cuentas compartidas están al día.';
  let debtor: 'Coqui' | 'Decana' | null = null;
  let creditor: 'Coqui' | 'Decana' | null = null;
  let amountToTransfer = 0;

  if (coquiBalance < -0.01) {
    debtor = 'Coqui';
    creditor = 'Decana';
    amountToTransfer = Math.abs(coquiBalance);
    settlementMessage = `Coqui está en rojo: debe transferir ${formatCurrency(amountToTransfer)} a Decana.`;
  } else if (decanaBalance < -0.01) {
    debtor = 'Decana';
    creditor = 'Coqui';
    amountToTransfer = Math.abs(decanaBalance);
    settlementMessage = `Decana está en rojo: debe transferir ${formatCurrency(amountToTransfer)} a Coqui.`;
  }

  return {
    totalExpenses,
    totalCoquiPaid,
    totalDecanaPaid,
    fairShare,
    coquiBalance,
    decanaBalance,
    debtor,
    creditor,
    amountToTransfer,
    settlementMessage,
  };
}

/**
 * Scale recipe ingredients for a target number of portions
 */
export function scaleRecipeIngredients(
  ingredients: RecipeIngredient[],
  originalPortions: number,
  targetPortions: number
): RecipeIngredient[] {
  if (!originalPortions || originalPortions <= 0 || !targetPortions || targetPortions <= 0) {
    return ingredients;
  }
  const factor = targetPortions / originalPortions;
  return ingredients.map((ing) => ({
    ...ing,
    amount: Number((ing.amount * factor).toFixed(2)),
    estimatedCost: ing.estimatedCost ? Math.round(ing.estimatedCost * factor) : undefined,
  }));
}

/**
 * Fast client-side natural language parser for voice commands
 * e.g. "Gasté 45 mil pesos en verdulería compré zapallo y remolacha"
 * "Cobré 60000 pesos de viandas por transferencia a Isa"
 */
export function parseVoiceInputText(text: string): Partial<Transaction> {
  const lower = text.toLowerCase();
  
  // Determine Type
  let type: 'ingreso' | 'egreso' = 'egreso';
  if (
    lower.includes('ingreso') ||
    lower.includes('cobro') ||
    lower.includes('cobré') ||
    lower.includes('venta') ||
    lower.includes('vendí') ||
    lower.includes('recibí') ||
    lower.includes('depósito')
  ) {
    type = 'ingreso';
  }

  // Determine Concept
  let concept: Transaction['concept'] = 'Otros';
  if (lower.includes('verdu') || lower.includes('verduleria') || lower.includes('verdulería')) {
    concept = 'Verduleria';
  } else if (lower.includes('super') || lower.includes('supermercado') || lower.includes('coto') || lower.includes('chino')) {
    concept = 'Supermercado';
  } else if (lower.includes('dietetica') || lower.includes('dietética') || lower.includes('legumbre') || lower.includes('especias')) {
    concept = 'Dietetica';
  } else if (lower.includes('papelera') || lower.includes('packaging') || lower.includes('envase') || lower.includes('bolsa')) {
    concept = 'Papelera';
  } else if (lower.includes('vianda') || lower.includes('viandas')) {
    concept = 'Viandas';
  } else if (lower.includes('cena') || lower.includes('almuerzo') || lower.includes('evento')) {
    concept = 'Cena/Almuerzo';
  } else if (lower.includes('budin') || lower.includes('budín') || lower.includes('torta') || lower.includes('pasteleria')) {
    concept = 'Budin';
  } else if (lower.includes('decana') || lower.includes('alquiler') || lower.includes('espacio')) {
    concept = 'Espacio/Decana';
  }

  // Determine Payment Method
  let paymentMethod: Transaction['paymentMethod'] = 'transferencia';
  if (lower.includes('qr') || lower.includes('mercado pago qr') || lower.includes('mp qr')) {
    paymentMethod = 'mercadopago_qr';
  } else if (lower.includes('efectivo') || lower.includes('cash')) {
    paymentMethod = 'efectivo';
  } else if (lower.includes('debito') || lower.includes('débito') || lower.includes('tarjeta')) {
    paymentMethod = 'debito';
  } else if (lower.includes('transferencia') || lower.includes('transfe') || lower.includes('mp') || lower.includes('mercado pago')) {
    paymentMethod = 'transferencia';
  }

  // Extract Amount
  let amount = 0;
  // Look for "45 mil", "45.000", "45000", etc.
  const milMatch = lower.match(/(\d+[\.,]?\d*)\s*(mil|k)\b/);
  if (milMatch) {
    const base = parseFloat(milMatch[1].replace(',', '.'));
    amount = base * 1000;
  } else {
    const numMatch = lower.match(/\$?\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+)/);
    if (numMatch) {
      amount = parseCurrencyString(numMatch[1]);
    }
  }

  // Default to today's date
  const today = new Date().toISOString().split('T')[0];

  return {
    date: today,
    concept,
    type,
    amount: Math.round(amount),
    paymentMethod,
    notes: text,
  };
}
