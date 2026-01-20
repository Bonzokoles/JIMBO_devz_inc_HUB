# ZENON PromptMaster - Deployment Ready

## 📂 Struktura Plików (Source Location)

```
U:\The_yellow_hub\docs\ZENON_THE_PromptMaster\
├── components/
│   ├── PromptCard.tsx              # Card display dla promptów
│   ├── LocalImportModal.tsx        # UI dla batch import z JIMBO Libraries
│   ├── PromptDetailModal.tsx       # Szczegółowy widok + edycja
│   ├── CreateEditModal.tsx         # Tworzenie nowych promptów
│   └── UserGuideModal.tsx          # Instrukcja obsługi
├── services/
│   └── localImportService.ts       # AI Agent do ekstrakcji promptów
├── server/
│   ├── localPromptLoader.ts        # File scanner + JSON parser
│   ├── api.ts                      # Express REST API (8 endpoints)
│   ├── package.json                # Backend dependencies
│   └── tsconfig.json               # TypeScript config
├── scripts/
│   └── scan_libraries.ts           # CLI tool do skanowania JIMBO Libraries
├── MY_PROMPTS/                     # User-generated prompts (localStorage)
├── App.tsx                         # Main React app
├── index.html                      # Entry point
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite build config
└── README.md                       # Dokumentacja główna
```

---

## 🚀 Quick Start (Backend + Frontend)

### Backend API Server

```bash
cd U:\The_yellow_hub\docs\ZENON_THE_PromptMaster\server
npm install
npm run dev  # Port 3001
```

**API Endpoints:**

- `GET /api/resources` → Lista 234 promptów
- `GET /api/categories` → 15 kategorii
- `POST /api/search` → Wyszukiwanie semantyczne
- `GET /api/resources/:id` → Szczegóły promptu
- `GET /api/stats` → Statystyki bibliotek

### Frontend (Vite)

```bash
cd U:\The_yellow_hub\docs\ZENON_THE_PromptMaster
npm install
export API_KEY="your_gemini_api_key"  # Linux/Mac
# LUB
$env:API_KEY="your_gemini_api_key"    # Windows PowerShell

npm run dev  # Port 5173
```

---

## 📦 Deployment to Cloudflare Pages

### Build Process

```bash
cd U:\The_yellow_hub\docs\ZENON_THE_PromptMaster
npm run build  # Output: dist/
```

### Deploy

```bash
npx wrangler pages deploy dist --project-name zenon-promptmaster
```

### Environment Variables (Cloudflare Pages Settings)

```
API_KEY = your_google_gemini_api_key
BACKEND_API_URL = https://your-backend-api.workers.dev
NODE_ENV = production
```

### Custom Domain

```bash
npx wrangler pages deployment tail zenon-promptmaster
# Add custom domain in Cloudflare dashboard:
# www.mybonzoaiblog.com/zenon
```

---

## 🔗 Integration with jimbo77.org

### llms.txt Entry

```plaintext
#### 12. ZENON - The PromptMaster
**URL**: https://www.mybonzoaiblog.com/zenon
**Description**: Inteligentna biblioteka 234 promptów z AI-powered ekstrakcją
**Tech**: React, Vite, Google Gemini 2.0 Flash, Express API
**API**: http://localhost:3001/api/resources (dev) | https://zenon-api.workers.dev (prod)

**Key Features**:
- 234+ ready-to-use prompts across 15 categories
- AI Agent dla auto-kategoryzacji (Gemini 2.0 Flash)
- Batch import z JIMBO Deep Sea Archives (U:\JIMBO_INC_CONTROL_CENTER\LIBRARIES)
- Semantic search z fuzzy matching
- LocalStorage caching dla offline use

**Categories**:
Coding, Business, Creative, Technical, Marketing, Data Analysis, Education,
Research, Customer Support, Product Management, Design, Operations, Finance,
HR, General Purpose
```

### Project Card (jimbo77.org landing page)

```html
<div class="card project-card">
  <div class="card-header">
    <h3>🧠 ZENON PromptMaster</h3>
    <span class="tech-stack">React • Gemini 2.0 • Express API</span>
  </div>

  <p class="description">
    Inteligentna biblioteka 234 promptów z AI-powered kategoryzacją. Integracja
    z JIMBO Deep Sea Archives i batch import z lokalnych źródeł.
  </p>

  <div class="features">
    <span class="badge">15 Kategorii</span>
    <span class="badge">AI Search</span>
    <span class="badge">Local Import</span>
    <span class="badge">234 Prompts</span>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="label">Resources:</span>
      <span class="value">234</span>
    </div>
    <div class="stat">
      <span class="label">Categories:</span>
      <span class="value">15</span>
    </div>
    <div class="stat">
      <span class="label">API Endpoints:</span>
      <span class="value">8</span>
    </div>
  </div>

  <a href="https://www.mybonzoaiblog.com/zenon" class="project-link">
    Explore Library →
  </a>
</div>
```

---

## 🎨 UI Integration (Gdy Gemini skończy nowy design)

### Theme Variables (Adapt to jimbo77.com style)

```css
/* Obecny ZENON style (purple gradient) */
--zenon-primary: #8b5cf6;
--zenon-secondary: #7c3aed;
--zenon-bg: #1a1a2e;

/* Docelowy JIMBO77 style (dark navy) */
--jimbo-bg: #07090f;
--jimbo-panel: #0b0f1a;
--jimbo-hot: #7cffb2; /* neon green */
--jimbo-cold: #6aa6ff; /* neon blue */
--jimbo-text: #e7ecff;
```

### Component Mapping

| ZENON Component   | JIMBO77.com Equivalent | Adaptacja                        |
| ----------------- | ---------------------- | -------------------------------- |
| PromptCard        | `.service-card`        | Zmień kolory, dodaj neon borders |
| LocalImportModal  | `.modal`               | Glass morphism, backdrop-blur    |
| PromptDetailModal | `.panel-detail`        | Zero border-radius, JIMBO font   |
| Sidebar           | `.sidebar`             | Yellow accent (#FFA500)          |
| Header            | `.topbar`              | Gradient background, sticky      |

---

## 🔧 Backend API (Express Server)

### Start Server

```bash
cd U:\The_yellow_hub\docs\ZENON_THE_PromptMaster\server
npm run dev
```

**Port:** 3001  
**CORS:** Enabled for `localhost:5173` (frontend)

### API Response Example

**GET /api/resources**

```json
{
  "success": true,
  "count": 234,
  "resources": [
    {
      "id": "prompt_001",
      "title": "React Component Generator",
      "category": "Coding & Development",
      "content": "Generate a React functional component with...",
      "tags": ["react", "typescript", "component"],
      "difficulty": "intermediate",
      "created_at": "2024-12-15T10:30:00Z"
    }
  ]
}
```

---

## 📊 Statistics

- **Total Prompts**: 234
- **Categories**: 15
- **JIMBO Libraries Integrated**: 60+
- **Deep Sea Archives**: 9 core libraries
- **File Formats**: JSON, MD, TXT
- **Backend Endpoints**: 8
- **UI Components**: 5
- **AI Models**: Gemini 2.0 Flash, Gemini Embedding 004

---

## ✅ Pre-Deployment Checklist

- [x] Backend API server running (port 3001)
- [x] Frontend Vite dev server (port 5173)
- [x] Gemini API key configured (.env.local)
- [x] JIMBO Libraries path accessible (U:\JIMBO_INC_CONTROL_CENTER\LIBRARIES)
- [x] All 234 prompts loaded
- [x] LocalStorage persistence tested
- [x] Search functionality verified
- [x] AI extraction agent working
- [ ] Adapt to new JIMBO77.com theme (waiting for Gemini)
- [ ] Build for production (`npm run build`)
- [ ] Deploy to Cloudflare Pages
- [ ] Custom domain setup
- [ ] Update jimbo77.org llms.txt
- [ ] Add project card to landing page

---

## 🔄 Integration Workflow

1. **Gemini finishes jimbo77.com UI** → Get new design system
2. **Adapt ZENON components** → Match colors, fonts, layout
3. **Build production bundle** → `npm run build`
4. **Deploy to Cloudflare Pages** → `npx wrangler pages deploy dist`
5. **Update jimbo77.org** → Add llms.txt entry + project card
6. **Test live** → Verify all links, API calls, UI consistency

---

**Status:** 🟡 Deployment Ready (Waiting for UI integration)
