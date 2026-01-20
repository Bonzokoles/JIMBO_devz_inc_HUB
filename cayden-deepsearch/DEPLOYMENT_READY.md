# CAY_DEN Multi-Modal AI Suite - Deployment Ready

## 📂 Struktura Plików (Source Location)

```
U:\The_yellow_hub\docs\CAY_DEN_chat_deepsearch\
├── components/
│   ├── Chat.tsx                    # Main chat (761 lines) - Streaming, Tools, Multimodal
│   ├── GraphCanvas.tsx             # Node system - Workflows, Self-improvement loops
│   ├── KnowledgeBase.tsx           # RAG interface - Uploads, Vector search
│   ├── Settings.tsx                # API keys, Webhooks, Custom configs
│   ├── Sidebar.tsx                 # Navigation - 6 views
│   ├── Agents.tsx                  # ReAct agent system
│   ├── PromptLibrary.tsx           # Pre-built prompt templates
│   └── icons/Icons.tsx             # SVG icon collection
├── services/
│   ├── geminiService.ts            # Google GenAI, OpenRouter, Search APIs
│   └── ragService.ts               # Vector store, Embeddings, Cosine similarity
├── utils/
│   └── fileUtils.ts                # Base64 conversion dla images/audio
├── App.tsx                         # Router + Global state (Theme, Mode)
├── types.ts                        # TypeScript definitions (Models, Nodes, Messages)
├── index.html                      # Entry point
├── package.json                    # Dependencies (React, Tailwind, Vite)
├── vite.config.ts                  # Vite config
├── tailwind.config.js              # Tailwind CSS config
└── README.md                       # Full documentation
```

---

## 🚀 Quick Start

### Installation

```bash
cd U:\The_yellow_hub\docs\CAY_DEN_chat_deepsearch
npm install
```

### Environment Variables (.env.local)

```bash
# Required
API_KEY=your_google_gemini_api_key

# Optional (for additional providers)
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
OLLAMA_URL=http://localhost:11434

# Search APIs (optional)
TAVILY_API_KEY=your_tavily_key
EXA_API_KEY=your_exa_key
BRAVE_API_KEY=your_brave_key
```

### Run Dev Server

```bash
npm run dev  # Port 5173
```

**Open:** http://localhost:5173

---

## 📦 Features Overview

### 1️⃣ Multi-Provider Chat

**Supported Providers:**

- **Gemini** → gemini-2.5-flash, gemini-2.5-pro (multimodal + tools)
- **OpenRouter** → GPT-4o, Claude 3.5, Mistral 7B, Gemma 2 9B
- **Ollama** → llama3, mistral, codellama (100% local)
- **OpenAI** → gpt-4, gpt-3.5-turbo
- **DeepSeek** → deepseek-chat, deepseek-coder

**Streaming:**

```typescript
// Server-Sent Events (SSE) - Real-time token display
const stream = await model.generateContentStream(contents);
for await (const chunk of stream.stream) {
  const chunkText = chunk.text();
  // Update UI incrementally
}
```

**Tools Integration:**

- ✅ Google Search (real-time web results)
- ✅ Google Maps (location + geocoding)
- ✅ Knowledge Base (RAG semantic search)

**Multimodal (Gemini only):**

- 🖼️ Image analysis (upload + analyze)
- 🎤 Audio transcription (auto-transcribe MP3/WAV)

---

### 2️⃣ Graph Canvas System

**Features:**

- Drag-and-drop node creation
- Parent → Child context inheritance
- Result linking (merge multiple contexts)
- Pan/Zoom controls
- Export/Import workflows (JSON)

**Advanced Node Features:**

**Self-Improvement Loop:**

```typescript
// AI critiques own response and refines (max 3 iterations)
1. Generate initial answer
2. Critique against user-defined prompt
3. If fails → Refine prompt + regenerate
4. Repeat until pass or max iterations
```

**Webhooks:**

```typescript
// POST to external automation tool
{
  "nodeId": "node_123",
  "prompt": "Generate Python code for...",
  "context": "Parent node response: ...",
  "timestamp": "2026-01-19T21:00:00Z"
}
// Response from Flowise/n8n/ActivePieces displayed in node
```

**Code Mode:**

- Click `{ }` icon → AI acts as Python Developer
- Specialized for logic, math, data analysis

**Document Analysis:**

- Upload PDF/TXT → Auto-generate Summary node + 5 Q&A child nodes

---

### 3️⃣ RAG Knowledge Base

**Client-Side Vector Store:**

```typescript
// No backend needed - runs in browser
- In-memory array for vectors
- LocalStorage cache for embeddings
- Cosine similarity search
```

**Workflow:**

1. Upload files (TXT, MD, JSON, PDF, code)
2. Chunk text (max 500 chars, 50 overlap)
3. Embed with `gemini-embedding-004`
4. Store vectors + cache to localStorage
5. Search: Query → Embed → Cosine similarity → Top 5 results

**Usage:**

- **Chat:** Enable "Knowledge Base" tool
- **Graph:** Attach file to specific node

---

### 4️⃣ Agent System (ReAct)

**Architecture:**

```
Think (LLM) → Act (Tool) → Observe (Result) → Repeat
```

**Available Actions:**

- Web search (Tavily/Exa/Brave)
- RAG query
- Calculator
- File read/write

**Max iterations:** 10  
**Goal-driven:** Stops when objective met

---

## 🎨 UI Components Details

### Chat.tsx (761 lines)

**State Management:**

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [provider, setProvider] = useState<Provider>("Gemini");
const [model, setModel] = useState<string>("gemini-2.5-flash");
const [tools, setTools] = useState({
  googleSearch: true,
  googleMaps: true,
  knowledgeBase: true,
});
const [attachment, setAttachment] = useState<File | null>(null);
```

**Key Functions:**

- `handleSubmit()` → Send message to LLM
- `handleToolCall()` → Execute Google Search/Maps
- `saveSession()` → Persist to sessionStorage
- `loadSession()` → Restore on mount

**Session Persistence:**

```typescript
// Auto-save on every message
sessionStorage.setItem(
  "chatSession",
  JSON.stringify({
    messages,
    provider,
    model,
    systemPrompt,
  }),
);
```

---

## 📦 Deployment to Cloudflare Pages

### Build

```bash
cd U:\The_yellow_hub\docs\CAY_DEN_chat_deepsearch
npm run build  # Output: dist/
```

### Deploy

```bash
npx wrangler pages deploy dist --project-name cayden-deepsearch
```

### Environment Variables (Cloudflare Dashboard)

```
API_KEY = your_gemini_api_key
OPENROUTER_API_KEY = optional
OPENAI_API_KEY = optional
DEEPSEEK_API_KEY = optional
OLLAMA_URL = http://localhost:11434
TAVILY_API_KEY = optional
EXA_API_KEY = optional
BRAVE_API_KEY = optional
```

### Custom Domain

```bash
# Add in Cloudflare dashboard:
www.mybonzoaiblog.com/cayden
```

---

## 🔗 Integration with jimbo77.org

### llms.txt Entry

```plaintext
#### 13. CAY_DEN - Multi-Modal AI Suite
**URL**: https://www.mybonzoaiblog.com/cayden
**Description**: Advanced chat z Graph Canvas, multi-provider support, RAG i Agents
**Tech**: React, TypeScript, Tailwind CSS, 5 LLM providers

**Chat Features**:
- Multi-provider: Gemini, OpenRouter (GPT-4o, Claude), Ollama, OpenAI, DeepSeek
- Streaming responses (SSE - real-time)
- Tools: Google Search, Google Maps, Knowledge Base (RAG)
- Multimodal: Image analysis + Audio transcription (Gemini)

**Graph Canvas ("Noodles")**:
- Node-based workflows with context inheritance
- Self-improvement loops (AI self-critique, max 3 iterations)
- Webhooks → Flowise, n8n, ActivePieces
- Code Mode (Python/Data Science specialized)
- Document Analysis (PDF → auto Q&A nodes)

**RAG System**:
- Client-side vector store (in-memory + localStorage cache)
- Gemini Embedding 004
- Cosine similarity search (top 5 results)
- Supported: TXT, MD, JSON, PDF, code files

**Agent System (ReAct)**:
- Think → Act → Observe loop
- Max 10 iterations
- Tools: Web search (Tavily/Exa/Brave), RAG, Calculator

**API Integrations**:
- Google Generative AI SDK
- OpenRouter API (50+ models)
- Ollama (100% local, privacy-focused)
- Search APIs: Tavily, Exa, Brave
```

### Project Card (jimbo77.org landing page)

```html
<div class="card project-card">
  <div class="card-header">
    <h3>💬 CAY_DEN DeepSearch</h3>
    <span class="tech-stack">TypeScript • Multi-LLM • RAG • Agents</span>
  </div>

  <p class="description">
    Advanced chat z Graph Canvas, multi-provider support (5 LLMs), streaming
    responses, RAG knowledge base i ReAct agent system.
  </p>

  <div class="features">
    <span class="badge">5 Providers</span>
    <span class="badge">Graph Canvas</span>
    <span class="badge">RAG</span>
    <span class="badge">Agents</span>
    <span class="badge">Multimodal</span>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="label">Providers:</span>
      <span class="value">5</span>
    </div>
    <div class="stat">
      <span class="label">Models:</span>
      <span class="value">20+</span>
    </div>
    <div class="stat">
      <span class="label">Tools:</span>
      <span class="value">8</span>
    </div>
  </div>

  <a href="https://www.mybonzoaiblog.com/cayden" class="project-link">
    Launch Chat →
  </a>
</div>
```

---

## 🎨 UI Integration (Gdy Gemini skończy nowy design)

### Theme Variables (Adapt to jimbo77.com style)

```css
/* Obecny CAY_DEN style (Tailwind dark) */
--cayden-bg: #1a1a1a;
--cayden-panel: #2a2a2a;
--cayden-accent: #3b82f6;

/* Docelowy JIMBO77 style (dark navy) */
--jimbo-bg: #07090f;
--jimbo-panel: #0b0f1a;
--jimbo-hot: #7cffb2; /* neon green */
--jimbo-cold: #6aa6ff; /* neon blue */
--jimbo-text: #e7ecff;
--jimbo-line: #1b2542;
```

### Component Mapping

| CAY_DEN Component   | JIMBO77.com Equivalent | Adaptacja                        |
| ------------------- | ---------------------- | -------------------------------- |
| Chat message bubble | `.message-card`        | Neon borders, glass morphism     |
| Graph Canvas node   | `.node-panel`          | Zero border-radius, JIMBO colors |
| Sidebar             | `.sidebar`             | Yellow accent, JIMBOHUB branding |
| Settings modal      | `.modal-panel`         | Backdrop-blur, dark navy bg      |
| Tool toggle buttons | `.btn-tool`            | Hot/Cold gradient on active      |

---

## 📊 Statistics

- **Providers**: 5 (Gemini, OpenRouter, Ollama, OpenAI, DeepSeek)
- **Models**: 20+ (GPT-4o, Claude, Mistral, Llama3, Gemini 2.5)
- **Tools**: 8 (Search APIs, RAG, Maps, Calculator)
- **UI Components**: 7 main components (761-line Chat.tsx)
- **Features**: 25+ (Streaming, Multimodal, Graph, Agents, RAG, Webhooks)
- **File Formats**: TXT, MD, JSON, PDF, Images, Audio

---

## ✅ Pre-Deployment Checklist

- [x] Vite dev server running (port 5173)
- [x] All 5 providers tested
- [x] Streaming working (SSE)
- [x] Tools verified (Search, Maps, RAG)
- [x] Graph Canvas tested (nodes, connections)
- [x] Agent system working (ReAct loop)
- [x] Multimodal verified (image + audio)
- [x] Session persistence tested (sessionStorage)
- [ ] Adapt to new JIMBO77.com theme (waiting for Gemini)
- [ ] Build for production (`npm run build`)
- [ ] Deploy to Cloudflare Pages
- [ ] Custom domain setup
- [ ] Update jimbo77.org llms.txt
- [ ] Add project card to landing page

---

## 🔄 Integration Workflow

1. **Gemini finishes jimbo77.com UI** → Get dark navy theme
2. **Adapt CAY_DEN Tailwind config** → Match JIMBO colors
3. **Update components** → Glass morphism, neon accents
4. **Build production** → `npm run build`
5. **Deploy to Cloudflare Pages** → `npx wrangler pages deploy dist`
6. **Update jimbo77.org** → llms.txt + project card
7. **Test live** → Chat streaming, Graph Canvas, RAG, Agents

---

**Status:** 🟡 Deployment Ready (Waiting for UI integration)
