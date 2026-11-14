import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCurrencyString,
  formatCurrency,
  calculateMonthSummary,
  calculateSharedExpensesSettlement,
  scaleRecipeIngredients,
  parseVoiceInputText,
} from './finance';
import { Transaction, SharedExpense, RecipeIngredient } from '../types';

test('parseCurrencyString handles Argentine formats correctly', () => {
  assert.equal(parseCurrencyString('$41.600'), 41600);
  assert.equal(parseCurrencyString('150000'), 150000);
  assert.equal(parseCurrencyString(' $1.028.000,00'), 1028000);
  assert.equal(parseCurrencyString('- $27.555,30'), -27555.3);
  assert.equal(parseCurrencyString(''), 0);
  assert.equal(parseCurrencyString(null), 0);
});

test('formatCurrency formats to Argentine locale properly', () => {
  const formatted = formatCurrency(1028000);
  assert.ok(formatted.includes('1.028.000') || formatted.includes('1028000'));
  const neg = formatCurrency(-27555.3, true);
  assert.ok(neg.startsWith('- $'));
});

test('calculateMonthSummary correctly computes Subtotal, 10% Decana, and Lucro Final Coqui', () => {
  // Test with Abril 2026 data from Excel:
  // Gastos: 264.004, Ingresos: 1.028.000 -> Subtotal: 763.996 -> % Decana (10%): 76.399,60 -> Lucro Final Coqui: 687.596,40
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      date: '2026-04-01',
      concept: 'Cena/Almuerzo',
      type: 'ingreso',
      amount: 1028000,
      paymentMethod: 'transferencia',
    },
    {
      id: '2',
      date: '2026-04-01',
      concept: 'Verduleria',
      type: 'egreso',
      amount: 264004,
      paymentMethod: 'efectivo',
    },
  ];

  const summary = calculateMonthSummary('2026-04', 'Abril 2026', sampleTransactions, 0.10);
  assert.equal(summary.ingresosCoqui, 1028000);
  assert.equal(summary.gastosCoqui, 264004);
  assert.equal(summary.subtotal, 763996);
  assert.equal(Math.round(summary.decanaAmount), 76400); // 76.399,6
  assert.equal(Math.round(summary.lucroFinalCoqui), 687596); // 687.596,4
});

test('calculateSharedExpensesSettlement correctly determines who owes whom in "TUKI"', () => {
  const expenses: SharedExpense[] = [
    {
      id: 'e1',
      date: '2026-04-10',
      concept: 'Limpieza profunda campana y cocina',
      amount: 50000,
      paidBy: 'Coqui',
      settled: false,
    },
    {
      id: 'e2',
      date: '2026-04-15',
      concept: 'Bolsas compostables y detergente',
      amount: 20000,
      paidBy: 'Decana',
      settled: false,
    },
  ];

  // Total: 70.000. Fair share: 35.000.
  // Coqui paid 50.000 (balance +15.000). Decana paid 20.000 (balance -15.000 -> in red).
  // Decana must pay 15.000 to Coqui.
  const settlement = calculateSharedExpensesSettlement(expenses);
  assert.equal(settlement.totalExpenses, 70000);
  assert.equal(settlement.fairShare, 35000);
  assert.equal(settlement.debtor, 'Decana');
  assert.equal(settlement.creditor, 'Coqui');
  assert.equal(settlement.amountToTransfer, 15000);
});

test('scaleRecipeIngredients accurately scales ingredients and costs', () => {
  const ingredients: RecipeIngredient[] = [
    { name: 'Calabaza cabutia', amount: 2, unit: 'kg', estimatedCost: 4000 },
    { name: 'Leche de coco', amount: 500, unit: 'ml', estimatedCost: 3500 },
    { name: 'Jengibre fresco', amount: 50, unit: 'g', estimatedCost: 800 },
  ];

  // Scale from 4 portions to 20 portions (factor = 5)
  const scaled = scaleRecipeIngredients(ingredients, 4, 20);
  assert.equal(scaled[0].amount, 10);
  assert.equal(scaled[0].estimatedCost, 20000);
  assert.equal(scaled[1].amount, 2500);
  assert.equal(scaled[2].amount, 250);
});

test('parseVoiceInputText accurately detects voice commands for expenses and incomes', () => {
  const voiceExpense = parseVoiceInputText('gasté 45 mil pesos en la verduleria compré tomates y albahaca');
  assert.equal(voiceExpense.type, 'egreso');
  assert.equal(voiceExpense.concept, 'Verduleria');
  assert.equal(voiceExpense.amount, 45000);

  const voiceIncome = parseVoiceInputText('cobré 60000 de viandas por mercado pago qr');
  assert.equal(voiceIncome.type, 'ingreso');
  assert.equal(voiceIncome.concept, 'Viandas');
  assert.equal(voiceIncome.amount, 60000);
  assert.equal(voiceIncome.paymentMethod, 'mercadopago_qr');
});
