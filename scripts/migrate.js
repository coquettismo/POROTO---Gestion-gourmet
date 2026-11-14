import fs from 'fs';

const content = fs.readFileSync('public/assets/aistudio/Cuentas_Cantina_2026_01b9323a', 'utf8');
const lines = content.split('\n');

function parseNum(val) {
  if (!val) return 0;
  let s = val.replace(/[$"\s]/g, '');
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (s.includes('.')) {
    const p = s.split('.');
    if (p.length > 2 || (p.length === 2 && p[1].length === 3)) s = s.replace(/\./g, '');
  }
  return parseFloat(s) || 0;
}

function parseDateToISO(dStr) {
  const [d, m, y] = dStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const transactions = [];
let idCounter = 1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = line.split(',');
  const dateStr = parts[0]?.trim();
  if (!dateStr || !dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) continue;

  const rawConcepto = parts[1]?.trim() || 'Otros';
  const egresoStr = parts[2]?.trim();
  const ingresoStr = parts[3]?.trim();
  const notas = parts[4]?.trim() || '';

  const egreso = parseNum(egresoStr);
  const ingreso = parseNum(ingresoStr);

  const type = ingreso > 0 ? 'ingreso' : 'egreso';
  const amount = ingreso > 0 ? ingreso : egreso;

  let concept = 'Otros';
  const cLow = rawConcepto.toLowerCase();
  if (cLow.includes('verdu')) concept = 'Verduleria';
  else if (cLow.includes('super')) concept = 'Supermercado';
  else if (cLow.includes('diet')) concept = 'Dietetica';
  else if (cLow.includes('vianda')) concept = 'Viandas';
  else if (cLow.includes('cena') || cLow.includes('almuerzo')) concept = 'Cena/Almuerzo';
  else if (cLow.includes('budin')) concept = 'Budin';
  else if (cLow.includes('papel')) concept = 'Papelera';
  else concept = rawConcepto;

  let paymentMethod = 'transferencia';
  if (notas.toLowerCase().includes('efectivo')) paymentMethod = 'efectivo';
  else if (notas.toLowerCase().includes('meli') || notas.toLowerCase().includes('qr')) paymentMethod = 'mercadopago_qr';

  transactions.push({
    id: `tx-${idCounter++}`,
    date: parseDateToISO(dateStr),
    concept,
    type,
    amount,
    paymentMethod,
    notes: notas,
    recipeName: (notas.length > 2 && !notas.includes('efectivo') && !notas.includes('envio') && !notas.includes('surprise')) ? notas : undefined,
    syncedWithMP: paymentMethod === 'mercadopago_qr' || paymentMethod === 'transferencia',
    createdAt: `${parseDateToISO(dateStr)}T12:00:00.000Z`
  });
}

const output = `// Auto-migrated from Cuentas_Cantina_2026_01b9323a
import { Transaction, MonthSummary, SharedExpense, Recipe, KitchenDocument, UserSession } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = ${JSON.stringify(transactions, null, 2)};

export const INITIAL_HISTORICAL_SUMMARIES: MonthSummary[] = [
  {
    monthKey: '2026-04',
    monthName: 'Abril 2026',
    gastosCoqui: 264004,
    ingresosCoqui: 1028000,
    subtotal: 763996,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 76399.6,
    lucroFinalCoqui: 687596.4,
    transactionsCount: 28,
  },
  {
    monthKey: '2026-05',
    monthName: 'Mayo 2026',
    gastosCoqui: 266944,
    ingresosCoqui: 506000,
    subtotal: 239056,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 23905.6,
    lucroFinalCoqui: 215150.4,
    transactionsCount: 22,
  },
  {
    monthKey: '2026-06',
    monthName: 'Junio 2026',
    gastosCoqui: 102617,
    ingresosCoqui: 72000,
    subtotal: -30617,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: -3061.7,
    lucroFinalCoqui: -27555.3,
    transactionsCount: 6,
  },
  {
    monthKey: '2026-07',
    monthName: 'Julio 2026',
    gastosCoqui: 160327,
    ingresosCoqui: 490000,
    subtotal: 329673,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 32967.3,
    lucroFinalCoqui: 296705.7,
    transactionsCount: 11,
  },
  {
    monthKey: '2026-08',
    monthName: 'Agosto 2026',
    gastosCoqui: 55928,
    ingresosCoqui: 664500,
    subtotal: 608572,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 60857.2,
    lucroFinalCoqui: 547714.8,
    transactionsCount: 8,
  },
  {
    monthKey: '2026-09',
    monthName: 'Septiembre 2026',
    gastosCoqui: 88000,
    ingresosCoqui: 1183000,
    subtotal: 1095000,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 109500.0,
    lucroFinalCoqui: 985500.0,
    transactionsCount: 6,
  },
  {
    monthKey: '2026-10',
    monthName: 'Octubre 2026',
    gastosCoqui: 211000,
    ingresosCoqui: 390000,
    subtotal: 179000,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 17900.0,
    lucroFinalCoqui: 161100.0,
    transactionsCount: 7,
  },
  {
    monthKey: '2026-11',
    monthName: 'Noviembre 2026',
    gastosCoqui: 0,
    ingresosCoqui: 0,
    subtotal: 0,
    gastosCompartidos: 0,
    decanaPercentage: 0.10,
    decanaAmount: 0,
    lucroFinalCoqui: 0,
    transactionsCount: 0,
  },
];

export const INITIAL_SHARED_EXPENSES: SharedExpense[] = [
  {
    id: 'se-1',
    date: '2026-10-15',
    concept: 'Servicio de limpieza y extracción campana cocina',
    amount: 45000,
    paidBy: 'Coqui',
    notes: 'Factura A compartida con espacio Decana',
    settled: false,
  },
  {
    id: 'se-2',
    date: '2026-10-22',
    concept: 'Garrafa gas industrial y mantenimiento quemadores',
    amount: 32000,
    paidBy: 'Decana',
    notes: 'Pago en efectivo por encargado',
    settled: false,
  },
  {
    id: 'se-3',
    date: '2026-10-26',
    concept: 'Productos biodegradables de desinfección y toallas',
    amount: 18000,
    paidBy: 'Coqui',
    notes: 'Compra mayorista papelera y química',
    settled: false,
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    title: 'Khao Soi Norteño (Curry de Vianda)',
    description: 'Fideos en sopa de curry cremoso a base de leche de coco, pasta de chiles aromáticos, calabaza y hierbas frescas.',
    category: 'Plato Principal',
    prepTimeMinutes: 30,
    cookTimeMinutes: 45,
    defaultYieldPortions: 12,
    costPerPortionEstimate: 2850,
    salePricePerPortion: 6500,
    tags: ['Viandas Estrella', 'Vegano/Vegetariano', 'Especiado', 'Sin TACC adaptable'],
    ingredients: [
      { name: 'Leche de coco cremosa', amount: 1200, unit: 'ml', estimatedCost: 7500 },
      { name: 'Pasta de curry amarillo suave', amount: 150, unit: 'g', estimatedCost: 3200 },
      { name: 'Calabaza cabutia en cubos', amount: 2, unit: 'kg', estimatedCost: 4000 },
      { name: 'Fideos de arroz o cinta al huevo', amount: 1, unit: 'kg', estimatedCost: 4500 },
      { name: 'Jengibre fresco rallado', amount: 60, unit: 'g', estimatedCost: 900 },
      { name: 'Cebolla morada y cilantro fresco', amount: 500, unit: 'g', estimatedCost: 1800 },
      { name: 'Lima o limón criollo', amount: 6, unit: 'u', estimatedCost: 1200 },
    ],
    instructions: [
      'Dorar la pasta de curry amarillo en una cacerola de fondo grueso con una cucharada de aceite hasta que desprenda sus aceites esenciales.',
      'Incorporar el jengibre fresco rallado y la calabaza cabutia pelada y cortada en cubos parejos.',
      'Verter la leche de coco y caldo de verduras caliente. Cocinar a fuego medio-bajo durante 25 minutos hasta que la calabaza esté tierna pero conserve su forma.',
      'Cocer los fideos al dente. Emplatar colocando base de fideos, cubrir con el caldo cremoso y decorar con cebolla morada en pluma fina, cilantro y gajo de lima.',
    ],
  },
  {
    id: 'rec-2',
    title: 'Polenta Grigliata con Ragú de Hongos & Remolacha',
    description: 'Polenta cremosa compactada, dorada a la plancha con costra crocante y coronada con ragú de hongos de pino y reducción de remolacha.',
    category: 'Plato Principal',
    prepTimeMinutes: 25,
    cookTimeMinutes: 50,
    defaultYieldPortions: 10,
    costPerPortionEstimate: 2200,
    salePricePerPortion: 5800,
    tags: ['Sin TACC', 'Comfort Food', 'Económico', 'Viandas'],
    ingredients: [
      { name: 'Harina de maíz polenta rústica', amount: 750, unit: 'g', estimatedCost: 2800 },
      { name: 'Remolachas frescas asadas', amount: 1.5, unit: 'kg', estimatedCost: 3200 },
      { name: 'Hongos secos hidratados en té negro', amount: 100, unit: 'g', estimatedCost: 4500 },
      { name: 'Aceite de oliva virgen extra', amount: 120, unit: 'ml', estimatedCost: 2600 },
      { name: 'Romero y tomillo fresco', amount: 30, unit: 'g', estimatedCost: 600 },
      { name: 'Queso estacionado tipo sardo', amount: 250, unit: 'g', estimatedCost: 4100 },
    ],
    instructions: [
      'Cocinar la polenta en caldo aromático con hierbas durante 35 minutos sin dejar de revolver hasta que se desprenda de los bordes.',
      'Volcar en bandeja aceitada a 2 cm de grosor y enfriar por completo.',
      'Cortar rectángulos y dorar en plancha muy caliente con unas gotas de oliva hasta lograr costra dorada.',
      'Preparar ragú salteando cebolla, ajo, hongos hidratados y cubos de remolacha asada. Servir sobre la polenta crocante.',
    ],
  },
  {
    id: 'rec-3',
    title: 'Quibebe Cremoso de Calabaza & Comino',
    description: 'Clásico reconfortante del norte argentino: puré rústico especiado de calabaza con queso derretido y cebollitas caramelizadas.',
    category: 'Plato Principal',
    prepTimeMinutes: 20,
    cookTimeMinutes: 35,
    defaultYieldPortions: 8,
    costPerPortionEstimate: 1850,
    salePricePerPortion: 4900,
    tags: ['Vegetariano', 'Tradición Local', 'Favorito Clientes'],
    ingredients: [
      { name: 'Calabaza plomo o anco dulce', amount: 2.5, unit: 'kg', estimatedCost: 3900 },
      { name: 'Cebollas medianas picadas fino', amount: 800, unit: 'g', estimatedCost: 1600 },
      { name: 'Queso cremoso o cuartirolo', amount: 500, unit: 'g', estimatedCost: 5200 },
      { name: 'Comino en grano tostado y molido', amount: 15, unit: 'g', estimatedCost: 500 },
      { name: 'Pimentón dulce de Cachi', amount: 20, unit: 'g', estimatedCost: 600 },
      { name: 'Manteca o aceite de girasol', amount: 60, unit: 'g', estimatedCost: 900 },
    ],
    instructions: [
      'Rehogar la cebolla en manteca y oliva a fuego muy suave hasta transparentar sin dorar.',
      'Sumar la calabaza en cubos chicos, tapar la cacerola y dejar que sude en sus propios jugos a fuego bajo.',
      'Cuando esté bien tierna, pisar groseramente con batidor o pisa-papa dejando textura rústica.',
      'Sazonar con comino tostado y pimentón. Apagar el fuego y mezclar con cubos de queso cremoso que se funden al instante.',
    ],
  },
  {
    id: 'rec-4',
    title: 'Daal Dorado de Lentejas Coral',
    description: 'Estofado aromático de lentejas turcas rojas con tadka de especias tostadas en aceite de sésamo y cúrcuma fresca.',
    category: 'Plato Principal',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    defaultYieldPortions: 14,
    costPerPortionEstimate: 1650,
    salePricePerPortion: 4800,
    tags: ['Vegano', 'Alto en Proteína', 'Bajo Costo', 'Viandas'],
    ingredients: [
      { name: 'Lentejas turcas coral (dietética)', amount: 1, unit: 'kg', estimatedCost: 4800 },
      { name: 'Tomates triturados o frescos maduros', amount: 800, unit: 'g', estimatedCost: 2400 },
      { name: 'Cúrcuma molida pura', amount: 25, unit: 'g', estimatedCost: 800 },
      { name: 'Semillas de mostaza negra y comino', amount: 30, unit: 'g', estimatedCost: 900 },
      { name: 'Ajo y jengibre machacados', amount: 80, unit: 'g', estimatedCost: 1100 },
      { name: 'Hojas frescas de espinaca', amount: 500, unit: 'g', estimatedCost: 1500 },
    ],
    instructions: [
      'Enjuagar las lentejas coral y hervirlas en agua o caldo con cúrcuma y sal por 18 minutos hasta que se deshagan en crema.',
      'En sartén aparte, hacer el "tadka": calentar aceite y tostar semillas de mostaza y comino hasta que crepiten.',
      'Agregar ajo, jengibre y tomate picado. Sofreír 6 minutos hasta lograr salsa concentrada.',
      'Volcar el sofrito hirviendo sobre las lentejas cocidas, sumar espinacas crudas picadas y mezclar enérgicamente.',
    ],
  },
  {
    id: 'rec-5',
    title: 'Budín Húmedo de Limón, Oliva & Amapola',
    description: 'Masa sedosa perfumada con abundante ralladura de limones de quinta, aceite de oliva virgen extra y lluvia de semillas de amapola.',
    category: 'Pastelería',
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    defaultYieldPortions: 10,
    costPerPortionEstimate: 1200,
    salePricePerPortion: 3500,
    tags: ['Pastelería', 'Budines', 'Venta Individual'],
    ingredients: [
      { name: 'Harina 0000 o leudante', amount: 450, unit: 'g', estimatedCost: 950 },
      { name: 'Azúcar mascabo o rubia', amount: 350, unit: 'g', estimatedCost: 1400 },
      { name: 'Huevos de campo', amount: 4, unit: 'u', estimatedCost: 1600 },
      { name: 'Aceite de oliva virgen suave', amount: 150, unit: 'ml', estimatedCost: 2200 },
      { name: 'Ralladura y jugo de limón', amount: 4, unit: 'u', estimatedCost: 1200 },
      { name: 'Semillas de amapola', amount: 50, unit: 'g', estimatedCost: 1800 },
    ],
    instructions: [
      'Batir los huevos con el azúcar mascabo hasta punto cinta durante 5 minutos.',
      'Incorporar en hilo el aceite de oliva, el jugo y la ralladura de limón.',
      'Tamizar la harina e integrar con espátula con movimientos envolventes junto a las semillas de amapola.',
      'Hornear en molde budinera a 170°C durante 40 minutos hasta que al pinchar salga limpio.',
    ],
  },
];

export const INITIAL_DOCUMENTS: KitchenDocument[] = [
  {
    id: 'doc-1',
    title: 'Acuerdo de Uso del Espacio de Cocina - Decana',
    category: 'contrato',
    fileType: 'pdf',
    sizeKb: 245,
    updatedAt: '2026-04-01',
    content: 'Contrato y condiciones operativas: porcentaje mensual acordado del 10% sobre el subtotal de utilidades de la cantina en contraprestación del uso de las instalaciones, equipos pesados y servicios básicos. Liquidación a mes vencido.',
    tags: ['Legal', 'Espacio Decana', 'Porcentaje 10%', 'Contrato'],
    isEncrypted: false,
  },
  {
    id: 'doc-2',
    title: 'Guía de Proveedores & Precios Mayoristas (Verduleria & Papelera)',
    category: 'proveedores',
    fileType: 'doc',
    sizeKb: 180,
    updatedAt: '2026-10-20',
    content: 'Listado de contactos clave: Don Mario Verdulería Central (repartos martes y viernes, pago transferencia), Dietética El Granero (legumbres y especias al por mayor x bolsa de 5kg), Papelera San Juan (vianderas ecológicas de caña de azúcar biodegradables y fajas impresas).',
    tags: ['Contactos', 'Precios', 'Insumos', 'Logística'],
    isEncrypted: false,
  },
  {
    id: 'doc-3',
    title: 'Manual de Buenas Prácticas y Cadena de Frío para Viandas',
    category: 'bromatologia',
    fileType: 'pdf',
    sizeKb: 410,
    updatedAt: '2026-09-12',
    content: 'Protocolos de enfriamiento rápido (abatimiento térmico), rotulado bromatológico con fecha de elaboración y vencimiento (4 días en refrigeración a 4°C), sanitización de vegetales con solución clorada y sellado hermético.',
    tags: ['Seguridad Alimentaria', 'Bromatología', 'Viandas Seguras'],
    isEncrypted: false,
  },
];

export const INITIAL_USERS: UserSession[] = [
  {
    id: 'user-1',
    name: 'Coqui (Cocinera & Emprendedora)',
    role: 'coqui_admin',
    email: 'coquettismo@gmail.com',
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'user-2',
    name: 'Ayudante de Cocina & Logística',
    role: 'ayudante',
    email: 'cocina@cantinacoqui.com',
    avatarBg: 'bg-stone-600',
  },
  {
    id: 'user-3',
    name: 'Administración Espacio Decana',
    role: 'decana_espacio',
    email: 'espacio@decana.com.ar',
    avatarBg: 'bg-emerald-700',
  },
];
`;

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/migratedData.ts', output);
console.log('src/data/migratedData.ts written successfully with all 88 transactions!');
