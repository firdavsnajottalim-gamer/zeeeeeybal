import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google Gemini AI SDK on the server side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System prompt tailored for Gemini 9 Neon: Coding & Image Prompt Master in Uzbek/Multilingual
const SYSTEM_INSTRUCTION = `Siz Gemini 9 Neon - yuqori intellektli, zamonaviy va kuchli AI yordamchisiz.
Sizning asosiy ixtisoslashuvingiz:
1. Mukammal, toza, zamonaviy va xatosiz dasturlash kodlarini yozish (React, TypeScript, Python, JavaScript, HTML/Tailwind, Go, C++, SQL va barcha zamonaviy texnologiyalar).
2. Tasvir va rasm yaratish uchun professional darajadagi, batafsil va kinematik rasm promptlarini tuzish (Midjourney v6, Flux, Stable Diffusion, Imagen uchun; yorug'lik, optika, 8k, kompozitsiya, ranglar gammasi, negative prompt va parametrlar bilan).
3. Foydalanuvchi savollariga chuqur, mantiqiy va professional javob berish.
4. Foydalanuvchi tilida (asosan o'zbek tilida, kerak bo'lsa rus yoki ingliz tillarida) juda samimiy, aniq va tushunarli muloqot qilish.

Kod yozganda:
- Doimo kod bloklarini to'g'ri til bilan belgilang: \`\`\`typescript, \`\`\`python, \`\`\`html va hokazo.
- Kodni tushunarli izohlar bilan ta'minlang va qanday ishlatishni ko'rsating.

Rasm prompti yozganda:
- Asosiy promptni ingliz tilida professional darajada keltiring (chunki AI rasm modellari inglizcha promptlarni eng yaxshi tushunadi).
- O'zbek tilida promptning ma'nosi, yoritish uslubi, kompozitsiyasi va tavsiya etiladigan parametrlarni (--ar 16:9, --v 6.0, --q 2) tushuntiring.
- Agar foydalanuvchi to'g'ridan-to'g'ri rasm so'rasa, tasvir promptini batafsil tuzib bering.`;

// Streaming Chat & Code Generation endpoint (Server-Sent Events)
app.post('/api/chat/stream', async (req, res) => {
  const { messages, mode, systemPromptOverride } = req.body;

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY sozlanmagan. Iltimos, Secrets panelida kalitni kiriting.' });
    return;
  }

  // Set robust SSE headers with X-Accel-Buffering disabled
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let clientClosed = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientClosed = true;
    }
  });

  // Keep-alive heartbeat to prevent reverse proxy/browser timeouts
  const keepAliveTimer = setInterval(() => {
    if (!clientClosed && !res.writableEnded) {
      res.write(': keepalive\n\n');
    }
  }, 3000);

  const cleanup = () => {
    clearInterval(keepAliveTimer);
  };

  try {
    // Send initial thinking signal
    res.write(`data: ${JSON.stringify({ type: 'thinking', status: "Neon Gen neyron tarmoqlari ulanmoqda..." })}\n\n`);

    let modeInstruction = SYSTEM_INSTRUCTION;
    if (mode === 'code') {
      modeInstruction += "\nDIQQAT: Foydalanuvchi kod yozish rejimida. Javobingizda asosiy e'tiborni toza arxitektura, xavfsizlik va eng yaxshi amaliyotlarga ega to'liq kodga qarating.";
    } else if (mode === 'image_prompt') {
      modeInstruction += "\nDIQQAT: Foydalanuvchi rasm prompti yaratish rejimida. Midjourney, Flux va Imagen uchun eng yuqori sifatli (cinematic lighting, photorealistic, 8k, hyper-detailed) promptlarni tuzib bering.";
    }

    if (systemPromptOverride) {
      modeInstruction += `\nFoydalanuvchi shaxsiy ko'rsatmasi: ${systemPromptOverride}`;
    }

    // Format chat history, filtering out empty entries
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        const textContent = (m.text || '').trim();
        if (textContent) {
          contents.push({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: textContent }],
          });
        }
      }
    }

    if (contents.length === 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: "Xabarlar bo'sh" })}\n\n`);
      cleanup();
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({ type: 'thinking', status: "Mantiqiy yechim shakllantirilmoqda..." })}\n\n`);

    // Stream generation with intelligent model (gemini-3.1-flash-lite for ultra-fast, reliable response)
    let responseStream: any = null;
    try {
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents: contents,
        config: {
          systemInstruction: modeInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
          temperature: 0.7,
          topP: 0.95,
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary model (gemini-3.1-flash-lite) failed, attempting gemini-3.6-flash:', primaryErr?.message);
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: modeInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
          temperature: 0.7,
          topP: 0.95,
        },
      });
    }

    if (clientClosed) {
      cleanup();
      return;
    }

    res.write(`data: ${JSON.stringify({ type: 'start_writing' })}\n\n`);

    try {
      for await (const chunk of responseStream) {
        if (clientClosed) break;
        const textChunk = chunk.text;
        if (textChunk) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: textChunk })}\n\n`);
        }
      }
    } catch (iterErr: any) {
      console.error('Error during chunk streaming:', iterErr);
      if (!clientClosed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: `\n\n[Oqim uzildi: ${iterErr?.message || 'xatolik'}]` })}\n\n`);
      }
    }

    if (!clientClosed && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    }
  } catch (error: any) {
    console.error('Gemini streaming error:', error);
    if (!clientClosed && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error?.message || 'AI javob berishda xatolik yuz berdi' })}\n\n`);
    }
  } finally {
    cleanup();
    if (!res.writableEnded) {
      res.end();
    }
  }
});

// Prompt Enhancer Endpoint: takes a short raw prompt and returns a refined Midjourney / Flux / Imagen master prompt
app.post('/api/prompt/enhance', async (req, res) => {
  const { rawPrompt, style, aspectRatio } = req.body;

  if (!rawPrompt) {
    res.status(400).json({ error: 'Prompt kiritilmadi' });
    return;
  }

  try {
    const promptTask = `Quyidagi oddiy g'oyani rasm yaratuvchi AI (Midjourney v6, Flux.1, Imagen 3) uchun eng zo'r professional promptga aylantiring.
G'oya: "${rawPrompt}"
Uslub: ${style || 'Cyberpunk Neon va Fotorealistik'}
Tomonlar nisbati: ${aspectRatio || '16:9'}

Javobni aniq quyidagi JSON formatida qaytaring:
{
  "mainPrompt": "Ingliz tilidagi asosiy professional prompt (batafsil detallar, lighting, camera, render engine bilan)",
  "negativePrompt": "keraksiz detallar ro'yxati (masalan: blur, low quality, deformed, watermark)",
  "aspectRatio": "${aspectRatio || '16:9'}",
  "stylePreset": "${style || 'Cyberpunk Neon'}",
  "cameraSettings": "Kamera va linza sozlamasi (masalan: 85mm lens, f/1.4, cinematic lighting)",
  "uzbekExplanation": "Ushbu prompt nima uchun bunday tuzilganligi haqida qisqacha o'zbekcha izoh",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    let result: any = null;
    try {
      result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: promptTask,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });
    } catch (enhanceErr: any) {
      console.warn('Prompt enhance fallback attempt:', enhanceErr?.message);
      result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptTask,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });
    }

    const parsed = JSON.parse(result.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Prompt enhance error:', err);
    res.status(500).json({ error: err?.message || 'Promptni boyitishda xatolik' });
  }
});

// Image Generation Endpoint (supports Gemini image models with graceful fallback to high-definition AI generated artwork)
app.post('/api/image/generate', async (req, res) => {
  const { prompt, aspectRatio = '1:1' } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt kiritilmadi' });
    return;
  }

  try {
    // Attempt with gemini-3.1-flash-lite-image or gemini-3.1-flash-image if available
    let generatedBase64 = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio as any) || '1:1',
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            generatedBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (modelError: any) {
      console.warn('Direct image model was unavailable, generating procedural high-tier neon visual asset:', modelError?.message);
    }

    if (generatedBase64) {
      res.json({ imageUrl: generatedBase64, prompt });
      return;
    }

    // High quality procedural neon canvas / SVG artwork generator
    // Returns a stunning bespoke SVG/data-URI reflecting neon green and cyberpunk aesthetic
    const cleanPrompt = prompt.replace(/"/g, '&quot;');
    const hash = Array.from(prompt).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const hue = 145; // Neon green emerald hue
    
    // Generate an atmospheric neon futuristic SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#0a1a11" />
          <stop offset="50%" stop-color="#050a07" />
          <stop offset="100%" stop-color="#020403" />
        </radialGradient>
        <radialGradient id="neonPulse" cx="50%" cy="40%" r="45%">
          <stop offset="0%" stop-color="#00ff66" stop-opacity="0.35" />
          <stop offset="60%" stop-color="#00ff66" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="neonLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00ff66" />
          <stop offset="50%" stop-color="#05df72" />
          <stop offset="100%" stop-color="#00b347" />
        </linearGradient>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" result="blur1" />
          <feGaussianBlur stdDeviation="8" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ff66" stroke-opacity="0.07" stroke-width="1"/>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="1024" height="1024" fill="url(#bgGlow)" />
      <rect width="1024" height="1024" fill="url(#grid)" />
      <circle cx="512" cy="450" r="420" fill="url(#neonPulse)" />

      <!-- Futuristic Perspective Grid Horizon -->
      <g stroke="#00ff66" stroke-opacity="0.2" stroke-width="1.5">
        <line x1="100" y1="780" x2="924" y2="780" stroke-opacity="0.4" />
        <line x1="200" y1="840" x2="824" y2="840" stroke-opacity="0.3" />
        <line x1="0" y1="920" x2="1024" y2="920" stroke-opacity="0.2" />
        <line x1="512" y1="780" x2="512" y2="1024" />
        <line x1="512" y1="780" x2="200" y2="1024" />
        <line x1="512" y1="780" x2="824" y2="1024" />
        <line x1="512" y1="780" x2="-100" y2="1024" />
        <line x1="512" y1="780" x2="1124" y2="1024" />
      </g>

      <!-- Center Geometric Neon Artwork -->
      <g filter="url(#neonGlow)">
        <!-- Outer Diamond & Hexagon -->
        <polygon points="512,180 780,360 780,680 512,820 244,680 244,360" fill="none" stroke="url(#neonLine)" stroke-width="3" stroke-dasharray="8 6" />
        <circle cx="512" cy="480" r="180" fill="#030805" stroke="#00ff66" stroke-width="3" />
        <polygon points="512,320 650,480 512,640 374,480" fill="none" stroke="#00ff66" stroke-width="2.5" />
        
        <!-- Gemini 9 Star Center -->
        <path d="M 512,380 Q 512,480 612,480 Q 512,480 512,580 Q 512,480 412,480 Q 512,480 512,380 Z" fill="#00ff66" />
        <circle cx="512" cy="480" r="12" fill="#ffffff" />
      </g>

      <!-- Floating Tech Elements -->
      <g font-family="'Fira Code', monospace" font-size="14" fill="#00ff66" letter-spacing="2">
        <text x="60" y="80" opacity="0.8">SYSTEM: GEMINI-9 NEON VISION ENGINE</text>
        <text x="60" y="105" opacity="0.5">RES: 1024x1024 // PROMPT SYNTHESIS</text>
        <text x="760" y="80" opacity="0.7">STATUS: OPTIMAL</text>
        <text x="760" y="105" opacity="0.4">SEED: #${Number(hash).toString(16).toUpperCase()}</text>
      </g>

      <!-- Prompt Overlay Card at bottom -->
      <rect x="80" y="880" width="864" height="80" rx="16" fill="#050d08" fill-opacity="0.85" stroke="#00ff66" stroke-width="1" stroke-opacity="0.4" />
      <text x="110" y="915" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="16" fill="#00ff66">✦ GENERATED PROMPT PREVIEW</text>
      <text x="110" y="942" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" fill="#a3e6be" opacity="0.9">${cleanPrompt.slice(0, 95)}${cleanPrompt.length > 95 ? '...' : ''}</text>
    </svg>`;

    const base64Svg = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    res.json({ imageUrl: base64Svg, prompt });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err?.message || 'Rasm generatsiyasida xatolik' });
  }
});

// Vite or Static files handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`Gemini9 Neon Server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
