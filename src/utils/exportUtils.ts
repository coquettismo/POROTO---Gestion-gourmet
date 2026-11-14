import { Transaction, MonthSummary, Recipe } from '../types';
import { formatCurrency } from './finance';

/**
 * Exports transactions to CSV/Excel format with UTF-8 BOM for perfect Excel accent/currency support
 */
export function exportToCSV(transactions: Transaction[], monthName: string) {
  const headers = ['ID', 'Fecha', 'Concepto', 'Tipo', 'Monto ($ ARS)', 'Medio de Pago', 'Notas / Receta', 'Sincronizado MP'];
  
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.concept,
    t.type === 'ingreso' ? 'Ingreso' : 'Egreso',
    t.type === 'ingreso' ? t.amount : -t.amount,
    t.paymentMethod,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    t.syncedWithMP ? 'Sí' : 'No',
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map((r) => r.join(';')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Cantina_Coqui_${monthName.replace(/\s+/g, '_')}_Finanzas.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports financial report to Word (.doc) format with clean editorial styling
 */
export function exportToDoc(summary: MonthSummary, transactions: Transaction[]) {
  const tableRows = transactions
    .map(
      (t) => `
    <tr>
      <td style="padding: 6px 10px; border-bottom: 1px solid #ddd;">${t.date}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${t.concept}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; color: ${t.type === 'ingreso' ? '#16a34a' : '#dc2626'};">
        ${t.type === 'ingreso' ? 'INGRESO' : 'EGRESO'}
      </td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">
        ${formatCurrency(t.amount)}
      </td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #ddd;">${t.paymentMethod}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #ddd;">${t.notes || '-'}</td>
    </tr>`
    )
    .join('');

  const htmlDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Reporte Financiero - POROTO</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1c1917; padding: 24px; line-height: 1.5; }
        h1 { color: #ea580c; font-size: 24px; margin-bottom: 4px; }
        .meta { color: #78716c; font-size: 14px; margin-bottom: 20px; }
        .kpi-container { display: flex; gap: 16px; margin-bottom: 24px; }
        .kpi-box { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px 18px; margin-bottom: 16px; }
        .kpi-title { font-size: 12px; text-transform: uppercase; color: #78716c; }
        .kpi-val { font-size: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th { background: #292524; color: #ffffff; padding: 8px 10px; text-align: left; }
      </style>
    </head>
    <body>
      <h1>POROTO - REPORTE DE GESTIÓN Y FINANZAS</h1>
      <div class="meta">Período: ${summary.monthName} | Generado: ${new Date().toLocaleDateString('es-AR')}</div>

      <div class="kpi-box">
        <div><strong>Ingresos Totales:</strong> ${formatCurrency(summary.ingresosCoqui)}</div>
        <div><strong>Gastos Operativos:</strong> ${formatCurrency(summary.gastosCoqui)}</div>
        <div><strong>Subtotal de Operación:</strong> ${formatCurrency(summary.subtotal)}</div>
        <div><strong>Retención Espacio Decana (10%):</strong> ${formatCurrency(summary.decanaAmount)}</div>
        <div style="font-size: 18px; color: #ea580c; margin-top: 8px;">
          <strong>LUCRO FINAL POROTO:</strong> ${formatCurrency(summary.lucroFinalCoqui)}
        </div>
      </div>

      <h3>Detalle de Movimientos (${transactions.length} registros)</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Tipo</th>
            <th style="text-align: right;">Monto</th>
            <th>Método</th>
            <th>Notas / Receta</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + htmlDoc], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `POROTO_${summary.monthName.replace(/\s+/g, '_')}_Reporte.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports single recipe to DOC document with portion scaling
 */
export function exportRecipeToDoc(recipe: Recipe, currentPortions: number) {
  const factor = currentPortions / recipe.defaultYieldPortions;
  const ingredientsHtml = recipe.ingredients
    .map(
      (ing) => `
    <li>
      <strong>${(ing.amount * factor).toFixed(ing.unit === 'u' ? 0 : 1)} ${ing.unit}</strong> ${ing.name}
      ${ing.estimatedCost ? ` - Est: ${formatCurrency(Math.round(ing.estimatedCost * factor))}` : ''}
    </li>`
    )
    .join('');

  const stepsHtml = recipe.instructions
    .map((step, idx) => `<li><strong>Paso ${idx + 1}:</strong> ${step}</li>`)
    .join('');

  const html = `
    <html>
    <head><meta charset="utf-8"><title>${recipe.title}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1c1917; }
      h1 { color: #c2410c; margin-bottom: 4px; }
      .badge { background: #ffedd5; color: #9a3412; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 12px; margin-bottom: 12px; }
    </style>
    </head>
    <body>
      <h1>${recipe.title}</h1>
      <div class="badge">Porciones: ${currentPortions} viandas | Categoría: ${recipe.category}</div>
      <p><em>${recipe.description}</em></p>
      
      <h3>Ingredientes Necesarios:</h3>
      <ul>${ingredientsHtml}</ul>

      <h3>Paso a Paso de Elaboración:</h3>
      <ol>${stepsHtml}</ol>
      
      <p style="margin-top: 30px; font-size: 11px; color: #78716c;">
        POROTO - Sistema Culinario & Recetario | ${new Date().toLocaleDateString('es-AR')}
      </p>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Receta_${recipe.title.replace(/\s+/g, '_')}_${currentPortions}p.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers clean browser print dialog which automatically applies @media print styling
 */
export function triggerPrint() {
  window.print();
}
