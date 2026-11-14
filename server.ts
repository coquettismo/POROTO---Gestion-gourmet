import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for GoogleGenAI SDK server-side
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint for Cloud Run probes
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// REST API: Gemini AI Assistance Endpoint
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, responseMimeType } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const config: Record<string, unknown> = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    return res.json({ text: response.text });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const err = error as { message?: string; status?: number };
    return res.status(500).json({
      error: err.message || 'Error executing Gemini model request',
    });
  }
});

// REST API: Voice transaction parser using Gemini 3.8 Flash
app.post('/api/gemini/parse-movement', async (req: Request, res: Response) => {
  try {
    const { audioTranscript } = req.body;
    if (!audioTranscript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const systemInstruction = `Eres un asistente contable y gastronómico experto para "Cantina Coqui", un emprendimiento de cocina que elabora viandas, almuerzos, budines y cenas.
Dada una frase hablada o escrita por la cocinera, debes extraer la información del movimiento financiero y retornar un JSON con:
- "type": "ingreso" o "egreso"
- "concept": uno de ["Verduleria", "Supermercado", "Dietetica", "Papelera", "Viandas", "Cena/Almuerzo", "Budin", "Espacio/Decana", "Otros"]
- "amount": número en pesos argentinos (ej: 45000)
- "paymentMethod": uno de ["mercadopago_qr", "transferencia", "efectivo", "debito"]
- "notes": descripción concisa (ej: "tomates, albahaca y remolacha para el daal")
- "recipeName": nombre de la receta si se menciona o puede asociarse (opcional)
- "customer": nombre de cliente si se menciona (ej: "Isa", "Pablo")
Responde estrictamente en formato JSON válido sin bloques markdown.`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Frase hablada: "${audioTranscript}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json(parsedJson);
  } catch (error: unknown) {
    console.error('Voice parsing error:', error);
    return res.status(500).json({ error: 'Fallback to local parser' });
  }
});

// REST API: Mercado Pago Simulation & Webhook endpoint
app.post('/api/mercadopago/webhook', (req: Request, res: Response) => {
  const { data, type, action } = req.body;
  console.log(`[MercadoPago Webhook] Received ${type || action}:`, data);
  // Emulate instant acknowledgement for Mercado Pago IPN/Webhooks
  return res.status(200).json({ status: 'ok', received: true });
});

// In-memory transactions cache for live sync
let cachedTransactions: unknown[] = [];

app.get('/api/transactions', (_req: Request, res: Response) => {
  res.json({ transactions: cachedTransactions });
});

app.post('/api/transactions', (req: Request, res: Response) => {
  const newTx = req.body;
  cachedTransactions.unshift(newTx);
  res.status(201).json({ success: true, transaction: newTx });
});

// Vite dev middleware or static serving
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cantina Coqui server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
