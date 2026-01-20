# JIMBO77.ORG Integration Plan - ZENON & CAY_DEN

## 🎯 Cel

Dodać **ZENON PromptMaster** i **CAY_DEN DeepSearch** do jimbo77.org landing page po zakończeniu prac Gemini nad nowym UI w stylu dark navy theme.

---

## 📋 Timeline

1. ⏳ **TERAZ** → Gemini buduje nowe UI dla jimbo77.com (dark navy, glass morphism, neon accents)
2. ⏳ **Następnie** → Otrzymujemy nowy design system (kolory, fonty, komponenty)
3. ✅ **Wtedy** → Adaptujemy ZENON + CAY_DEN do nowego stylu
4. ✅ **Potem** → Integrujemy z jimbo77.org
5. ✅ **Deploy** → Cloudflare Pages

---

## 🗂️ Przygotowane Struktury

### ZENON PromptMaster

**Lokalizacja źródłowa:**

```
U:\The_yellow_hub\docs\ZENON_THE_PromptMaster\
```

**Deployment folder:**

```
U:\The_yellow_hub\JIMBO_devz_inc_HUB\zenon-promptmaster\
├── PROJECT_MANIFEST.json      # Pełna specyfikacja projektu
├── DEPLOYMENT_READY.md        # Instrukcje deployment + integracja
└── public/                    # Assets (będą dodane)
```

**Key Stats:**

- 234 prompts, 15 categories
- Backend API: 8 endpoints (port 3001)
- AI: Gemini 2.0 Flash + Embedding 004
- UI Components: 5 (React + TypeScript)

---

### CAY_DEN DeepSearch

**Lokalizacja źródłowa:**

```
U:\The_yellow_hub\docs\CAY_DEN_chat_deepsearch\
```

**Deployment folder:**

```
U:\The_yellow_hub\JIMBO_devz_inc_HUB\cayden-deepsearch\
├── PROJECT_MANIFEST.json      # Pełna specyfikacja projektu
├── DEPLOYMENT_READY.md        # Instrukcje deployment + integracja
└── public/                    # Assets (będą dodane)
```

**Key Stats:**

- 5 LLM providers, 20+ models
- Features: Chat, Graph Canvas, RAG, Agents
- Tools: 8 (Search APIs, Maps, Calculator)
- UI Components: 7 (761-line Chat.tsx)

---

## 🎨 Adaptacja UI do JIMBO77 Theme

### Obecny Astro Build (jimbo-ai-magnet)

**Style:**

- Purple gradient (#8835ea)
- Dark background (#13151a)
- Simple card layout

### Nowy JIMBO77.com Theme (od Gemini)

**Style (z screenshotów):**

- Dark navy (#07090f, #0b0f1a)
- Neon green (#7cffb2) + blue (#6aa6ff)
- Glass morphism (backdrop-blur)
- Zero border-radius
- JetBrains Mono font
- JIMBOHUB branding (yellow accent)

### Mapping Components

#### ZENON PromptMaster → JIMBO77

| Komponent         | Obecny styl    | Docelowy JIMBO77                 |
| ----------------- | -------------- | -------------------------------- |
| PromptCard        | Purple border  | Neon blue/green border, glass bg |
| LocalImportModal  | Standard modal | Backdrop-blur, dark navy panel   |
| PromptDetailModal | White text     | #e7ecff text, monospace font     |
| Sidebar           | Purple accent  | Yellow (#FFA500) accent          |
| Header            | Gradient       | Sticky topbar z JIMBOHUB logo    |

#### CAY_DEN DeepSearch → JIMBO77

| Komponent         | Obecny styl   | Docelowy JIMBO77              |
| ----------------- | ------------- | ----------------------------- |
| Chat bubble       | Tailwind dark | Glass panel, neon borders     |
| Graph Canvas node | Blue accent   | Hot/Cold gradient accents     |
| Sidebar nav       | Standard      | JIMBOHUB style, yellow accent |
| Settings panel    | Modal         | Backdrop-blur, dark navy      |
| Tool buttons      | Rounded       | Zero border-radius, neon glow |

---

## 📝 Zmiany w jimbo77.org

### 1. Aktualizacja llms.txt

**Lokalizacja:**

```
U:\The_yellow_hub\JIMBO_devz_inc_HUB\jimbo-ai-magnet\public\llms.txt
```

**Dodać po sekcji 11 (przed końcem):**

```plaintext
---

#### 12. ZENON - The PromptMaster
**URL**: https://www.mybonzoaiblog.com/zenon
**Description**: Inteligentna biblioteka 234 promptów z AI-powered ekstrakcją
**Tech**: React, Vite, Google Gemini 2.0 Flash, Express API

**Key Features**:
- 234+ ready-to-use prompts (15 kategorii)
- AI Agent dla auto-kategoryzacji
- Batch import z JIMBO Deep Sea Archives
- Semantic search z fuzzy matching
- Backend API: 8 endpoints (port 3001)

**Categories**: Coding, Business, Creative, Technical, Marketing, Data Analysis,
Education, Research, Customer Support, Product Management, Design, Operations,
Finance, HR, General Purpose

**API Endpoints**:
- GET /api/resources → Lista 234 promptów
- GET /api/categories → 15 kategorii
- POST /api/search → Wyszukiwanie semantyczne
- GET /api/resources/:id → Szczegóły promptu
- GET /api/stats → Statystyki bibliotek

---

#### 13. CAY_DEN - Multi-Modal AI Suite
**URL**: https://www.mybonzoaiblog.com/cayden
**Description**: Advanced chat z Graph Canvas, multi-provider support i Agents
**Tech**: React, TypeScript, Tailwind CSS, 5 LLM providers

**Chat System**:
- Providers: Gemini, OpenRouter (GPT-4o, Claude), Ollama, OpenAI, DeepSeek
- Streaming: Server-Sent Events (SSE) - real-time
- Tools: Google Search, Google Maps, Knowledge Base (RAG)
- Multimodal: Image analysis + Audio transcription

**Graph Canvas**:
- Node-based workflows z context inheritance
- Self-improvement loops (AI self-critique, max 3 iterations)
- Webhooks → Flowise, n8n, ActivePieces
- Code Mode (Python/Data Science)
- Document Analysis (PDF → auto Q&A)

**RAG Knowledge Base**:
- Client-side vector store (in-memory + localStorage)
- Gemini Embedding 004
- Cosine similarity search (top 5)
- Formats: TXT, MD, JSON, PDF, code files

**Agent System (ReAct)**:
- Think → Act → Observe loop (max 10 iterations)
- Tools: Tavily/Exa/Brave search, RAG, Calculator

**Statistics**:
- 5 providers, 20+ models
- 8 tools (Search, Maps, RAG, Calculator)
- 7 UI components (761-line Chat.tsx)
```

---

### 2. Nowa Landing Page (Gdy Gemini skończy)

**Lokalizacja (TBD - czekamy na Gemini):**

```
U:\The_yellow_hub\JIMBO_devz_inc_HUB\jimbo-ai-magnet\src\pages\index.astro
LUB
U:\The_yellow_hub\JIMBO_devz_inc_HUB\jimbo-net-control\src\...  (jeśli React)
```

**Sekcja: Projects Showcase**

Dodać 2 nowe karty w grid:

```html
<!-- Grid container (istniejący) -->
<div class="projects-grid">
  <!-- ISTNIEJĄCE PROJEKTY (1-11) -->
  <!-- ... -->

  <!-- NOWY: ZENON PromptMaster -->
  <div class="card project-card" data-category="ai-tools">
    <div class="card-icon">🧠</div>

    <div class="card-header">
      <h3>ZENON PromptMaster</h3>
      <span class="tech-stack">React • Gemini 2.0 • Express</span>
    </div>

    <p class="description">
      Inteligentna biblioteka 234 promptów z AI-powered kategoryzacją. Backend
      API z 8 endpoints, integracja z JIMBO Deep Sea Archives.
    </p>

    <div class="features-badges">
      <span class="badge badge-hot">15 Kategorii</span>
      <span class="badge badge-cold">AI Search</span>
      <span class="badge">Local Import</span>
      <span class="badge">234 Prompts</span>
    </div>

    <div class="stats-row">
      <div class="stat">
        <span class="label">Resources</span>
        <span class="value">234</span>
      </div>
      <div class="stat">
        <span class="label">API</span>
        <span class="value">8 EP</span>
      </div>
      <div class="stat">
        <span class="label">Categories</span>
        <span class="value">15</span>
      </div>
    </div>

    <a href="https://www.mybonzoaiblog.com/zenon" class="project-link">
      Explore Library
      <span class="arrow">→</span>
    </a>
  </div>

  <!-- NOWY: CAY_DEN DeepSearch -->
  <div class="card project-card" data-category="ai-chat">
    <div class="card-icon">💬</div>

    <div class="card-header">
      <h3>CAY_DEN DeepSearch</h3>
      <span class="tech-stack">TypeScript • Multi-LLM • RAG</span>
    </div>

    <p class="description">
      Advanced multi-modal chat z Graph Canvas, 5 LLM providers, streaming
      responses, RAG knowledge base i ReAct agent system.
    </p>

    <div class="features-badges">
      <span class="badge badge-hot">5 Providers</span>
      <span class="badge badge-cold">Graph Canvas</span>
      <span class="badge">RAG</span>
      <span class="badge">Agents</span>
    </div>

    <div class="stats-row">
      <div class="stat">
        <span class="label">Models</span>
        <span class="value">20+</span>
      </div>
      <div class="stat">
        <span class="label">Tools</span>
        <span class="value">8</span>
      </div>
      <div class="stat">
        <span class="label">Features</span>
        <span class="value">25+</span>
      </div>
    </div>

    <a href="https://www.mybonzoaiblog.com/cayden" class="project-link">
      Launch Chat
      <span class="arrow">→</span>
    </a>
  </div>
</div>
```

---

### 3. System Capabilities (Features Section)

**Dodać do istniejącej sekcji "capabilities":**

```html
<div class="capabilities-grid">
  <!-- ISTNIEJĄCE FEATURES -->
  <!-- ... -->

  <!-- NOWY: Prompt Engineering -->
  <div class="feature-card">
    <div class="feature-icon">🧠</div>
    <h3>Prompt Engineering</h3>
    <p>
      ZENON PromptMaster: 234 promptów z AI kategoryzacją, backend API (8
      endpoints), integracja z JIMBO Libraries.
    </p>
    <ul class="feature-list">
      <li>15 kategorii (coding, business, creative...)</li>
      <li>Gemini 2.0 Flash extraction agent</li>
      <li>Batch import z lokalnych źródeł</li>
      <li>Semantic search z fuzzy matching</li>
    </ul>
  </div>

  <!-- NOWY: Multi-Modal Chat -->
  <div class="feature-card">
    <div class="feature-icon">💬</div>
    <h3>Multi-Modal AI Chat</h3>
    <p>
      CAY_DEN Suite: 5 LLM providers, streaming SSE, Graph Canvas workflows, RAG
      knowledge base, ReAct agents.
    </p>
    <ul class="feature-list">
      <li>Providers: Gemini, OpenRouter, Ollama, OpenAI, DeepSeek</li>
      <li>Tools: Google Search, Maps, RAG (vector search)</li>
      <li>Graph Canvas - node-based workflows</li>
      <li>Agent System - Think → Act → Observe</li>
    </ul>
  </div>
</div>
```

---

## 🎨 CSS Styles (Do dopasowania po otrzymaniu nowego UI)

### JIMBO77 Theme Variables

```css
:root {
  /* Colors (z screenshotów jimbo77.com) */
  --jimbo-bg: #07090f;
  --jimbo-bg2: #05070c;
  --jimbo-panel: #0b0f1a;
  --jimbo-panel2: #090d17;
  --jimbo-text: #e7ecff;
  --jimbo-muted: #9aa6c7;
  --jimbo-line: #1b2542;
  --jimbo-hot: #7cffb2; /* neon green */
  --jimbo-cold: #6aa6ff; /* neon blue */
  --jimbo-yellow: #ffa500; /* JIMBOHUB accent */

  /* Typography */
  --jimbo-mono: ui-monospace, "JetBrains Mono", "Courier New", monospace;
  --jimbo-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* Effects */
  --jimbo-shadow:
    0 0 0 1px rgba(231, 236, 255, 0.06), 0 18px 50px rgba(0, 0, 0, 0.55);
  --jimbo-glow-hot: 0 0 18px rgba(124, 255, 178, 0.35);
  --jimbo-glow-cold: 0 0 18px rgba(106, 166, 255, 0.35);
}

* {
  box-sizing: border-box;
  border-radius: 0 !important; /* Zero rounded corners */
}

body {
  font-family: var(--jimbo-sans);
  background: var(--jimbo-bg);
  color: var(--jimbo-text);
}
```

### Project Card Styles

```css
.project-card {
  border: 1px solid var(--jimbo-line);
  background: linear-gradient(
    180deg,
    rgba(11, 15, 26, 0.95),
    rgba(9, 13, 23, 0.8)
  );
  box-shadow: var(--jimbo-shadow);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(231, 236, 255, 0.12),
    0 24px 60px rgba(0, 0, 0, 0.65);
  border-color: var(--jimbo-cold);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.tech-stack {
  font-family: var(--jimbo-mono);
  font-size: 0.75rem;
  color: var(--jimbo-muted);
  letter-spacing: 0.5px;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-family: var(--jimbo-mono);
  border: 1px solid var(--jimbo-line);
  background: rgba(11, 15, 26, 0.6);
  color: var(--jimbo-muted);
}

.badge-hot {
  border-color: rgba(124, 255, 178, 0.45);
  color: var(--jimbo-hot);
  background: rgba(124, 255, 178, 0.08);
}

.badge-cold {
  border-color: rgba(106, 166, 255, 0.45);
  color: var(--jimbo-cold);
  background: rgba(106, 166, 255, 0.08);
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: var(--jimbo-hot);
  font-family: var(--jimbo-mono);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.8px;
  text-decoration: none;
  transition: all 0.2s;
}

.project-link:hover {
  color: var(--jimbo-cold);
  transform: translateX(4px);
}

.project-link .arrow {
  transition: transform 0.2s;
}

.project-link:hover .arrow {
  transform: translateX(4px);
}
```

---

## ✅ Checklist Integracji

### Przed integracją (Teraz - przygotowania)

- [x] Skopiować ZENON z docs/ do JIMBO_devz_inc_HUB/zenon-promptmaster/
- [x] Skopiować CAY_DEN z docs/ do JIMBO_devz_inc_HUB/cayden-deepsearch/
- [x] Stworzyć PROJECT_MANIFEST.json dla obu projektów
- [x] Stworzyć DEPLOYMENT_READY.md z instrukcjami
- [x] Przygotować llms.txt content (sekcje 12 & 13)
- [x] Przygotować HTML markup dla project cards
- [x] Przygotować CSS styles (JIMBO77 theme)

### Po otrzymaniu nowego UI od Gemini

- [ ] Otrzymać nowy design system (kolory, fonty, layout)
- [ ] Zaktualizować CSS variables (match JIMBO77 theme)
- [ ] Adaptować ZENON components (PromptCard, Modals)
- [ ] Adaptować CAY_DEN components (Chat, Graph Canvas)
- [ ] Zaktualizować llms.txt (dodać sekcje 12 & 13)
- [ ] Dodać project cards do landing page
- [ ] Dodać features do capabilities section
- [ ] Build Astro/React (npm run build)
- [ ] Test localhost (verify wszystkie linki + style)

### Deployment

- [ ] Deploy jimbo77.org (npx wrangler pages deploy dist)
- [ ] Deploy ZENON (https://www.mybonzoaiblog.com/zenon)
- [ ] Deploy CAY_DEN (https://www.mybonzoaiblog.com/cayden)
- [ ] Verify live URLs
- [ ] Test cross-project links
- [ ] Monitor analytics

---

## 📊 Expected Results

**jimbo77.org landing page będzie miała:**

- ✅ 13 projektów (było 11, dodane ZENON + CAY_DEN)
- ✅ Spójny dark navy theme (JIMBO77 style)
- ✅ Neon accents (green/blue)
- ✅ Glass morphism effects
- ✅ Zero border-radius (ultra-computer look)
- ✅ Updated llms.txt (complete AI manifest)

**Nowe capabilities:**

- ✅ Prompt Engineering (234 prompts, 15 kategorii)
- ✅ Multi-Modal AI Chat (5 providers, streaming, RAG, agents)

---

## 🔄 Workflow Summary

```
1. Gemini kończy nowy UI
   ↓
2. Otrzymujemy design system (kolory, fonty, komponenty)
   ↓
3. Adaptujemy ZENON + CAY_DEN do JIMBO77 theme
   ↓
4. Aktualizujemy llms.txt + landing page
   ↓
5. Build all projects (npm run build)
   ↓
6. Deploy do Cloudflare Pages
   ↓
7. Verify + Test live
```

---

**Status:** 🟡 Waiting for Gemini UI  
**ETA:** ~5 minut (user powiedział)  
**Next Step:** Adapt UI components gdy otrzymamy nowy design
