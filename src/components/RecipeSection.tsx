import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Scale,
  Clock,
  Users,
  DollarSign,
  Download,
  FileText,
  Printer,
  FileSpreadsheet,
  Trash2,
  Edit2,
  X,
  ChefHat,
  Search,
  Image as ImageIcon,
  Check,
  Loader2,
  Layers,
} from 'lucide-react';
import { Recipe, RecipeIngredient } from '../types';
import { formatCurrency, scaleRecipeIngredients } from '../utils/finance';
import { exportRecipeToDoc } from '../utils/exportUtils';
import { PorotoIcon } from './PorotoIcon';

interface RecipeSectionProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  privacyMode: boolean;
}

export const RecipeSection: React.FC<RecipeSectionProps> = ({
  recipes,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  privacyMode,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipes[0] || null);
  const [targetPortions, setTargetPortions] = useState<number>(recipes[0]?.defaultYieldPortions || 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // AI Assistant states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Recipe Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<Recipe['category']>('Plato Principal');
  const [formDesc, setFormDesc] = useState('');
  const [formYield, setFormYield] = useState(10);
  const [formPrepTime, setFormPrepTime] = useState(25);
  const [formCookTime, setFormCookTime] = useState(40);
  const [formCostEstimate, setFormCostEstimate] = useState(2000);
  const [formSalePrice, setFormSalePrice] = useState(5500);
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formIngredientsText, setFormIngredientsText] = useState('');
  const [formInstructionsText, setFormInstructionsText] = useState('');

  const mask = (val: string) => (privacyMode ? '••••••' : val);

  // Filter recipes
  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectRecipe = (rec: Recipe) => {
    setSelectedRecipe(rec);
    setTargetPortions(rec.defaultYieldPortions);
  };

  // Open Form for Create or Edit
  const handleOpenForm = (rec?: Recipe) => {
    if (rec) {
      setEditingRecipe(rec);
      setFormTitle(rec.title);
      setFormCategory(rec.category);
      setFormDesc(rec.description);
      setFormYield(rec.defaultYieldPortions);
      setFormPrepTime(rec.prepTimeMinutes);
      setFormCookTime(rec.cookTimeMinutes);
      setFormCostEstimate(rec.costPerPortionEstimate || 2000);
      setFormSalePrice(rec.salePricePerPortion || 5500);
      setFormPhotoUrl(rec.photoUrl || '');
      setFormIngredientsText(
        rec.ingredients.map((i) => `${i.amount} ${i.unit} ${i.name} ($${i.estimatedCost || 0})`).join('\n')
      );
      setFormInstructionsText(rec.instructions.join('\n'));
    } else {
      setEditingRecipe(null);
      setFormTitle('');
      setFormCategory('Plato Principal');
      setFormDesc('');
      setFormYield(10);
      setFormPrepTime(25);
      setFormCookTime(40);
      setFormCostEstimate(2200);
      setFormSalePrice(5500);
      setFormPhotoUrl('');
      setFormIngredientsText('1 kg Calabaza cabutia\n500 ml Leche de coco\n400 g Lentejas coral');
      setFormInstructionsText('Paso 1: Saltear especias aromáticas.\nPaso 2: Cocinar legumbres a fuego lento.\nPaso 3: Servir en caliente.');
    }
    setShowFormModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Parse ingredients lines
    const parsedIngredients: RecipeIngredient[] = formIngredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(.*?)(?:\s*\(\$?(\d+)\))?$/);
        if (parts) {
          return {
            amount: parseFloat(parts[1]) || 1,
            unit: parts[2] || 'u',
            name: parts[3] || line,
            estimatedCost: parts[4] ? parseInt(parts[4]) : undefined,
          };
        }
        return { amount: 1, unit: 'u', name: line };
      });

    const parsedInstructions = formInstructionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const recipeData: Omit<Recipe, 'id'> = {
      title: formTitle.trim(),
      category: formCategory,
      description: formDesc.trim(),
      defaultYieldPortions: formYield,
      prepTimeMinutes: formPrepTime,
      cookTimeMinutes: formCookTime,
      costPerPortionEstimate: formCostEstimate,
      salePricePerPortion: formSalePrice,
      photoUrl: formPhotoUrl.trim() || undefined,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      tags: ['POROTO', formCategory],
    };

    if (editingRecipe) {
      onUpdateRecipe({ ...recipeData, id: editingRecipe.id });
      if (selectedRecipe?.id === editingRecipe.id) {
        setSelectedRecipe({ ...recipeData, id: editingRecipe.id });
      }
    } else {
      onAddRecipe(recipeData);
    }

    setShowFormModal(false);
  };

  // Consult Gemini AI for Recipes or Culinary Calculations
  const handleQueryGemini = async (presetPrompt?: string) => {
    const q = presetPrompt || aiPrompt;
    if (!q.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    const systemInstruction = `Eres un chef consultor culinario y especialista en viandas saludables y gastronomía para "POROTO".
Tu objetivo es brindar recetas creativas, precisas, con ingredientes típicos de verdulería, super y dietética de Argentina, calcular cantidades según porciones, y responder preguntas sobre técnicas gastronómicas y conservación bromatológica.`;

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, systemInstruction }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.text);
      } else {
        setAiResponse('Error al consultar Gemini. Verifica la conexión.');
      }
    } catch {
      setAiResponse('Error de red al consultar Gemini.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Scaled ingredients for currently selected recipe
  const scaledIngredients = selectedRecipe
    ? scaleRecipeIngredients(selectedRecipe.ingredients, selectedRecipe.defaultYieldPortions, targetPortions)
    : [];

  const totalBatchCostEstimate = scaledIngredients.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-4 sm:px-6 pt-2">
      {/* Top Banner Floating Bar */}
      <div className="rounded-[32px] p-5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <span>Recetario &amp; Escalador</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Cálculo dinámico de porciones, costos y generación con Gemini AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-purple-900/15 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Consultar Gemini AI</span>
          </button>

          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:opacity-90 text-white dark:text-stone-900 text-xs font-bold shadow-md shadow-stone-900/10 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Receta</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Recipe List + Recipe Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Recipe Catalog */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Category Filter */}
          <div className="rounded-[28px] p-3.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, ingrediente..."
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-stone-100/60 dark:bg-stone-800/60 border border-stone-200/40 dark:border-stone-700/40 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs pb-0.5 scrollbar-none">
              {['all', 'Plato Principal', 'Sopa/Entrada', 'Pastelería'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredRecipes.map((rec) => {
              const isSelected = selectedRecipe?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => handleSelectRecipe(rec)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 text-stone-900 dark:text-white shadow-[0_8px_20px_rgba(245,158,11,0.08)]'
                      : 'bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border-stone-200/50 dark:border-stone-800/50 hover:border-amber-500/30 text-stone-800 dark:text-stone-200 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate">{rec.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                      {rec.description}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-stone-500 dark:text-stone-400 mt-2.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {rec.cookTimeMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        Base: {rec.defaultYieldPortions}u
                      </span>
                      {rec.costPerPortionEstimate && (
                        <span className="font-numeric font-bold text-stone-700 dark:text-stone-300">
                          {mask(formatCurrency(rec.costPerPortionEstimate))}/u
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenForm(rec);
                      }}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                      title="Editar receta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la receta "${rec.title}"?`)) {
                          onDeleteRecipe(rec.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-red-500"
                      title="Eliminar receta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Recipe Detail & Portions Scaler Floating Card */}
        <div className="lg:col-span-7">
          {selectedRecipe ? (
            <div className="rounded-[36px] p-6 sm:p-7 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] space-y-6">
              {/* Recipe Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200/40 dark:border-stone-800/50 gap-3">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                    {selectedRecipe.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                    {selectedRecipe.description}
                  </p>
                </div>

                <button
                  onClick={() => exportRecipeToDoc(selectedRecipe, targetPortions)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition self-start sm:self-auto"
                  title="Descargar Ficha en Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Ficha .doc</span>
                </button>
              </div>

              {/* Interactive Portion Scaler Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>Escalador de Cantidades para Producción</span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Ajusta las viandas a cocinar y los ingredientes se recalculan en tiempo real.
                  </p>
                </div>

                {/* Portion Stepper */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-amber-500/30 rounded-2xl bg-white dark:bg-stone-800 overflow-hidden shadow-sm">
                    <button
                      onClick={() => setTargetPortions(Math.max(1, targetPortions - 1))}
                      className="px-3.5 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-950 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-numeric font-bold text-amber-800 dark:text-amber-300 text-xs min-w-[65px] text-center">
                      {targetPortions} viandas
                    </span>
                    <button
                      onClick={() => setTargetPortions(targetPortions + 1)}
                      className="px-3.5 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-950 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1 text-[11px]">
                    {[12, 25, 40].map((p) => (
                      <button
                        key={p}
                        onClick={() => setTargetPortions(p)}
                        className={`px-2.5 py-1 rounded-xl font-medium transition ${
                          targetPortions === p
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        {p}u
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ingredients List with Scaled Amounts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Ingredientes para {targetPortions} porciones:
                  </h4>
                  {totalBatchCostEstimate > 0 && (
                    <span className="text-xs font-numeric font-bold text-amber-700 dark:text-amber-400">
                      Costo Lote: {mask(formatCurrency(totalBatchCostEstimate))}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {scaledIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-stone-100/60 dark:bg-stone-800/50 border border-stone-200/40 dark:border-stone-700/40 flex items-center justify-between"
                    >
                      <span className="text-stone-800 dark:text-stone-200 font-medium">
                        {ing.name}
                      </span>
                      <div className="text-right">
                        <span className="font-numeric font-bold text-amber-800 dark:text-amber-300">
                          {ing.amount} {ing.unit}
                        </span>
                        {ing.estimatedCost && (
                          <span className="block text-[10px] text-stone-400">
                            ~{mask(formatCurrency(ing.estimatedCost))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2.5">
                  Paso a Paso de Elaboración
                </h4>
                <div className="space-y-2">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-stone-100/50 dark:bg-stone-800/30 border border-stone-200/40 dark:border-stone-800/60 text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-3"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[36px] p-12 text-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50">
              <ChefHat className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-40" />
              <p className="text-xs text-stone-500">Selecciona una receta para ver sus ingredientes y escalado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Culinary Consultation Floating Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-[36px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/50 dark:border-stone-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    Asistente Gastronómico Gemini AI
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Recetas de temporada, cálculo de cantidades y conservación bromatológica
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-2xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="mt-4 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">Sugerencias rápidas:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQueryGemini('Crea una receta de vianda de temporada otoño-invierno con calabaza cabutia, lentejas coral y especias tostadas para 20 viandas económicas')}
                  className="px-3 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-purple-100 dark:hover:bg-purple-950 transition"
                >
                  🍲 Vianda calabaza & lentejas
                </button>
                <button
                  type="button"
                  onClick={() => handleQueryGemini('¿Cómo conservar y enfriar rápidamente las viandas cocidas para garantizar la cadena de frío según bromatología?')}
                  className="px-3 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-purple-100 dark:hover:bg-purple-950 transition"
                >
                  ❄️ Cadena de frío bromatológica
                </button>
                <button
                  type="button"
                  onClick={() => handleQueryGemini('Receta de budín cítrico de naranja y cardamomo con bajo costo por porción')}
                  className="px-3 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-purple-100 dark:hover:bg-purple-950 transition"
                >
                  🍋 Budín económico cítrico
                </button>
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="mt-3.5 flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQueryGemini()}
                placeholder="Pregunta a Gemini sobre técnicas, ingredientes, libros..."
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              <button
                onClick={() => handleQueryGemini()}
                disabled={isAiLoading || !aiPrompt}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-md"
              >
                {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Consultar
              </button>
            </div>

            {/* Response Box */}
            {aiResponse && (
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap animate-in fade-in">
                {aiResponse}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New / Edit Recipe Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-[36px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/50 dark:border-stone-800/50 mb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingRecipe ? 'Editar Receta' : 'Nueva Receta POROTO'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-2xl text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Título de la Receta *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Khao Soi Norteño"
                    className="w-full px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Recipe['category'])}
                    className="w-full px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  >
                    <option value="Plato Principal">Plato Principal</option>
                    <option value="Sopa/Entrada">Sopa / Entrada</option>
                    <option value="Pastelería">Pastelería / Budines</option>
                    <option value="Guarnición">Guarnición</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ej: Curry cremoso con fideos y verduras asadas..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Porciones Base</label>
                  <input
                    type="number"
                    value={formYield}
                    onChange={(e) => setFormYield(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Costo Est. ($/p)</label>
                  <input
                    type="number"
                    value={formCostEstimate}
                    onChange={(e) => setFormCostEstimate(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Ingredientes (Un ingrediente por línea: "Cantidad Unidad Nombre (Costo)")
                </label>
                <textarea
                  rows={4}
                  value={formIngredientsText}
                  onChange={(e) => setFormIngredientsText(e.target.value)}
                  placeholder="2 kg Calabaza cabutia ($4000)&#10;500 ml Leche de coco ($3500)&#10;60 g Jengibre ($900)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Instrucciones de Cocción (Un paso por línea)
                </label>
                <textarea
                  rows={3}
                  value={formInstructionsText}
                  onChange={(e) => setFormInstructionsText(e.target.value)}
                  placeholder="Paso 1: Dorar la pasta de curry&#10;Paso 2: Sumar verduras y leche de coco"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-2xl border text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold"
                >
                  Guardar Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
