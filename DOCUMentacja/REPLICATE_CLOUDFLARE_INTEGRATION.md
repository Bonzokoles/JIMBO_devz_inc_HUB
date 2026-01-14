# REPLICATE + CLOUDFLARE - Instrukcja Integracji
**JIMBO77 DEVZ inc. - Dokumentacja techniczna**  
Data: 2026-01-14  
Autor: JIMBO AI Assistant

---

## 📋 SPIS TREŚCI
1. [Wymagania wstępne](#wymagania-wstępne)
2. [Setup Replicate API](#setup-replicate-api)
3. [Backend - Cloudflare Worker](#backend---cloudflare-worker)
4. [Frontend - Integracja z własnym UI](#frontend---integracja-z-własnym-ui)
5. [Deployment](#deployment)
6. [Testowanie](#testowanie)
7. [Koszty i limity](#koszty-i-limity)

---

## ⚙️ WYMAGANIA WSTĘPNE

### Zainstalowane narzędzia:
```bash
node --version        # v18+ wymagane
npm --version         # v9+ wymagane
npx wrangler --version # Cloudflare CLI
```

### Konta:
- ✅ Cloudflare Account (free tier OK)
- ✅ Replicate Account (https://replicate.com)

---

## 🔑 SETUP REPLICATE API

### 1. Utwórz konto i pobierz token:
```
1. Idź na: https://replicate.com/signin
2. Sign up / Sign in
3. Dashboard → Account → API Tokens
4. "Create token" → Skopiuj token (zaczyna się od "r8_...")
```

### 2. Zapisz token (BEZPIECZNE):
```bash
# Lokalnie (dla testów):
echo "REPLICATE_API_TOKEN=r8_twoj_token_tutaj" > .env

# NIGDY nie commituj .env do git!
echo ".env" >> .gitignore
```

---

## 🔧 BACKEND - CLOUDFLARE WORKER

### STRUKTURA PROJEKTU:
```
replicate-backend/
├── src/
│   └── worker.ts          # Główny Worker
├── wrangler.toml          # Cloudflare config
├── package.json
└── tsconfig.json
```

### 1. Inicjalizacja projektu:
```bash
# Utwórz folder:
mkdir replicate-backend
cd replicate-backend

# Init npm:
npm init -y

# Zainstaluj dependencies:
npm install --save-dev wrangler typescript @cloudflare/workers-types
npm install hono replicate
```

### 2. Utwórz `wrangler.toml`:
```toml
name = "replicate-api-worker"
main = "src/worker.ts"
compatibility_date = "2024-01-14"
node_compat = true

# Workers AI (opcjonalnie - fallback):
[ai]
binding = "AI"

# Secrets (dodaj przez CLI):
# wrangler secret put REPLICATE_API_TOKEN
```

### 3. Utwórz `src/worker.ts`:
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  REPLICATE_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS dla frontend
app.use('/*', cors({
  origin: ['http://localhost:3000', 'https://twoja-domena.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// ============================================
// ENDPOINT 1: Generate Image (podstawowy)
// ============================================
app.post('/api/generate', async (c) => {
  try {
    const { prompt, model = "black-forest-labs/flux-schnell" } = await c.req.json();
    
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    // 1. Start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model === "black-forest-labs/flux-schnell" 
          ? "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637"
          : model,
        input: { 
          prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
        }
      })
    });

    const prediction = await response.json();
    
    // 2. Return prediction ID (polling w frontend)
    return c.json({
      id: prediction.id,
      status: prediction.status,
      urls: {
        get: prediction.urls.get,
        cancel: prediction.urls.cancel,
      }
    });

  } catch (error) {
    console.error('Generate error:', error);
    return c.json({ 
      error: 'Failed to generate image',
      details: error.message 
    }, 500);
  }
});

// ============================================
// ENDPOINT 2: Check Status (polling)
// ============================================
app.get('/api/status/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${c.env.REPLICATE_API_TOKEN}`,
        }
      }
    );

    const prediction = await response.json();
    
    return c.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      metrics: prediction.metrics,
    });

  } catch (error) {
    return c.json({ 
      error: 'Failed to check status',
      details: error.message 
    }, 500);
  }
});

// ============================================
// ENDPOINT 3: Available Models (lista)
// ============================================
app.get('/api/models', async (c) => {
  return c.json({
    models: [
      {
        id: "flux-schnell",
        name: "Flux Schnell",
        description: "Fast, good quality (recommended)",
        version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        cost_per_run: "$0.003",
      },
      {
        id: "flux-pro",
        name: "Flux Pro", 
        description: "Highest quality, slower",
        version: "flux-pro-latest",
        cost_per_run: "$0.055",
      },
      {
        id: "sdxl",
        name: "Stable Diffusion XL",
        description: "Classic, reliable",
        version: "sdxl-latest",
        cost_per_run: "$0.004",
      }
    ]
  });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

### 4. Utwórz `package.json`:
```json
{
  "name": "replicate-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "replicate": "^0.30.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240117.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.78.0"
  }
}
```

### 5. Utwórz `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021"],
    "module": "ES2022",
    "moduleResolution": "node",
    "types": ["@cloudflare/workers-types"],
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 🎨 FRONTEND - INTEGRACJA Z WŁASNYM UI

### CO DODAĆ DO TWOJEGO FRONTENDU:

### 1. Funkcja generowania (vanilla JS):
```javascript
// replicate-client.js
// Dodaj ten plik do swojego projektu frontend

const WORKER_URL = 'https://your-worker.workers.dev'; // Zmień po deploy

class ReplicateClient {
  
  /**
   * Generuj obraz - zwraca prediction ID
   */
  async generate(prompt, model = 'flux-schnell') {
    const response = await fetch(`${WORKER_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model })
    });
    
    if (!response.ok) {
      throw new Error('Generation failed');
    }
    
    return await response.json();
  }
  
  /**
   * Sprawdź status generowania (polling)
   */
  async checkStatus(predictionId) {
    const response = await fetch(`${WORKER_URL}/api/status/${predictionId}`);
    
    if (!response.ok) {
      throw new Error('Status check failed');
    }
    
    return await response.json();
  }
  
  /**
   * Pełny flow: generate + poll do końca
   */
  async generateAndWait(prompt, model = 'flux-schnell', onProgress = null) {
    // 1. Start generation
    const { id } = await this.generate(prompt, model);
    
    // 2. Poll status
    while (true) {
      const status = await this.checkStatus(id);
      
      if (onProgress) {
        onProgress(status);
      }
      
      // Finished states
      if (status.status === 'succeeded') {
        return {
          success: true,
          imageUrl: status.output[0], // First image
          metrics: status.metrics
        };
      }
      
      if (status.status === 'failed') {
        return {
          success: false,
          error: status.error
        };
      }
      
      // Still processing - wait 1s
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  /**
   * Pobierz dostępne modele
   */
  async getModels() {
    const response = await fetch(`${WORKER_URL}/api/models`);
    return await response.json();
  }
}

// Export dla użycia
const replicateClient = new ReplicateClient();
```

### 2. Przykład użycia w HTML:
```html
<!-- index.html - przykład integracji -->
<!DOCTYPE html>
<html>
<head>
  <title>Replicate Image Generator</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    
    #prompt {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #5865F2;
      color: white;
      border: none;
      border-radius: 4px;
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    #status {
      margin: 20px 0;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    
    #result img {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>🎨 AI Image Generator</h1>
  
  <input 
    type="text" 
    id="prompt" 
    placeholder="Describe your image..."
    value="a futuristic robot looking into the distance"
  />
  
  <button id="generateBtn">Generate Image</button>
  
  <div id="status"></div>
  <div id="result"></div>
  
  <script src="replicate-client.js"></script>
  <script>
    const btn = document.getElementById('generateBtn');
    const promptInput = document.getElementById('prompt');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    
    btn.addEventListener('click', async () => {
      const prompt = promptInput.value.trim();
      
      if (!prompt) {
        alert('Please enter a prompt');
        return;
      }
      
      // Disable button
      btn.disabled = true;
      btn.textContent = 'Generating...';
      resultDiv.innerHTML = '';
      
      try {
        // Generate with progress updates
        const result = await replicateClient.generateAndWait(
          prompt,
          'flux-schnell',
          (status) => {
            // Update status display
            statusDiv.textContent = `Status: ${status.status}`;
          }
        );
        
        if (result.success) {
          // Display image
          resultDiv.innerHTML = `
            <img src="${result.imageUrl}" alt="${prompt}" />
            <p>Generated in ${result.metrics?.predict_time?.toFixed(2)}s</p>
          `;
          statusDiv.textContent = '✅ Done!';
        } else {
          statusDiv.textContent = `❌ Error: ${result.error}`;
        }
        
      } catch (error) {
        statusDiv.textContent = `❌ Error: ${error.message}`;
      } finally {
        // Re-enable button
        btn.disabled = false;
        btn.textContent = 'Generate Image';
      }
    });
  </script>
</body>
</html>
```

### 3. Integracja z React/Vue/Astro:

#### React Example:
```jsx
// components/ImageGenerator.jsx
import { useState } from 'react';

const WORKER_URL = 'https://your-worker.workers.dev';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  
  const generate = async () => {
    setLoading(true);
    setImageUrl(null);
    
    try {
      // Start generation
      const genRes = await fetch(`${WORKER_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'flux-schnell' })
      });
      const { id } = await genRes.json();
      
      // Poll status
      while (true) {
        const statusRes = await fetch(`${WORKER_URL}/api/status/${id}`);
        const statusData = await statusRes.json();
        
        setStatus(statusData.status);
        
        if (statusData.status === 'succeeded') {
          setImageUrl(statusData.output[0]);
          break;
        }
        
        if (statusData.status === 'failed') {
          throw new Error(statusData.error);
        }
        
        await new Promise(r => setTimeout(r, 1000));
      }
      
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your image..."
      />
      <button onClick={generate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      
      {status && <p>Status: {status}</p>}
      {imageUrl && <img src={imageUrl} alt={prompt} />}
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT

### 1. Dodaj Replicate API Token:
```bash
cd replicate-backend
npx wrangler secret put REPLICATE_API_TOKEN
# Wklej token (r8_...)
```

### 2. Deploy Worker:
```bash
npm run deploy
```

Output będzie zawierał URL workera:
```
Published replicate-api-worker
  https://replicate-api-worker.your-account.workers.dev
```

### 3. Update frontend URL:
```javascript
// W replicate-client.js:
const WORKER_URL = 'https://replicate-api-worker.your-account.workers.dev';
```

### 4. Deploy frontend (Cloudflare Pages):
```bash
# W folderze frontend:
npm run build

# Deploy:
npx wrangler pages deploy dist --project-name=replicate-frontend
```

---

## 🧪 TESTOWANIE

### Test 1: Health check
```bash
curl https://your-worker.workers.dev/health
# Expected: {"status":"ok"}
```

### Test 2: Generate image
```bash
curl -X POST https://your-worker.workers.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cute robot","model":"flux-schnell"}'
  
# Response: {"id":"abc123","status":"starting",...}
```

### Test 3: Check status
```bash
curl https://your-worker.workers.dev/api/status/abc123

# Response: {"id":"abc123","status":"succeeded","output":["https://..."]}
```

---

## 💰 KOSZTY I LIMITY

### Replicate Pricing:
```
Flux Schnell: $0.003/image (~3-5s)
Flux Pro:     $0.055/image (~10-15s)
SDXL:         $0.004/image (~5-8s)
```

### Cloudflare Free Tier:
```
Workers:  100,000 requests/day FREE
Pages:    Unlimited (static hosting)
R2:       10GB storage FREE
```

### Szacunkowe koszty (1000 obrazów/dzień):
```
Replicate: 1000 × $0.003 = $3/day
Cloudflare: $0 (w free tier)
TOTAL: ~$90/month
```

---

## 📚 PRZYDATNE LINKI

- Replicate Docs: https://replicate.com/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers
- Model Explorer: https://replicate.com/explore
- Hono Framework: https://hono.dev

---

## 🐛 TROUBLESHOOTING

### Problem: CORS errors
**Fix:** Dodaj domenę frontend do `cors()` w worker.ts

### Problem: "Unauthorized" 
**Fix:** Sprawdź czy token jest poprawnie dodany:
```bash
npx wrangler secret list
```

### Problem: Timeout
**Fix:** Zwiększ timeout lub użyj webhooków zamiast pollingu

### Problem: Rate limit
**Fix:** Dodaj queue system (Cloudflare Queues + D1)

---

**KONIEC DOKUMENTACJI**  
Pytania? Sprawdź oficjalne docs lub kontakt: jimbo@mybonzo.com
