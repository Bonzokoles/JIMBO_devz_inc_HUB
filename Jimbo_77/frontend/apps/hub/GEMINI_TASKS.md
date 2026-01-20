# ZADANIE DLA GEMINI: Dashboard JIMBO77 Hub - Kontynuacja Integracji

## Aktualny Stan ✅

**Lokalizacja**: `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\hub`

**Zbudowane komponenty**:

- ✅ Dashboard (UnifiedOpsView)
- ✅ Publisher (PublishingView)
- ✅ Wild Bunch (BunkerWarRoom - analiza)
- ✅ CAY_DEN CHAT - uproszczona wersja w `src/features/cayden/SimpleCaydenChat.tsx`
- ✅ Sidebar navigation z sekcjami: MAIN, INTELLIGENCE, SYSTEM

**Build status**:

- Bundle: 178KB (gzip: 54KB)
- Build time: ~1.3s
- TypeScript: ✅ No errors
- Dev server: `pnpm --filter @jimbo77/hub dev` (port 5173)

## Następne Zadania 🎯

### 1. ZENON PROMPTS Integration (PRIORYTET 1)

**Cel**: Dodać ZENON PromptMaster jako kolejny widok w dashboardzie

**Lokalizacja źródłowa**: `U:\The_yellow_hub\docs\ZENON_THE_PromptMaster`

**Struktura ZENON**:

- 234 prompty, 15 kategorii
- Backend API (Express, port 3001) - 8 endpointów
- Frontend: 5 komponentów React (PromptCard, LocalImportModal, PromptDetailModal, CreateEditModal, UserGuideModal)
- AI Agent: Gemini 2.0 Flash dla ekstrakcji promptów

**Co zrobić**:

1. **Utwórz feature folder**:

   ```
   src/features/zenon/
   ├── ZenonView.tsx (główny widok)
   ├── types.ts (interfejsy Prompt, Category)
   └── components/
       └── PromptCard.tsx (karta promptu)
   ```

2. **ZenonView.tsx - Minimalna wersja (2-3 funkcje)**:
   - Lista 10-15 przykładowych promptów (hardcoded na start)
   - Kategorie jako filtry (dropdown lub przyciski)
   - Click-to-copy functionality (navigator.clipboard)
   - Search bar (filtrowanie po tytule/treści)

3. **Styling**:
   - Użyj istniejącego theme (gray-900, ops.css)
   - Card layout dla promptów
   - Ikona 🧠 w sidebar

4. **Dodaj do App.tsx**:

   ```tsx
   import { ZenonView } from "./features/zenon";

   // W INTELLIGENCE section:
   <SidebarItem icon="🧠" label="ZENON PROMPTS" id="zenon_prompts" ... />

   // W renderContent():
   case "zenon_prompts":
     return <ZenonView />;
   ```

5. **Test build** po dodaniu każdego komponentu:
   ```bash
   cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\hub
   npm run build
   ```

**NIE RÓB (zostaw na później)**:

- ❌ Backend API integration (póki co hardcoded prompts)
- ❌ LocalStorage persistence
- ❌ Import/Export funkcjonalność
- ❌ AI Agent ekstrakcja
- ❌ Edycja/tworzenie nowych promptów

### 2. CAY_DEN Chat - API Integration (PRIORYTET 2)

**Plik**: `src/features/cayden/SimpleCaydenChat.tsx`

**Co zrobić**:

1. **Dodaj integrację z agents-orchestrator**:

   ```tsx
   const response = await fetch(
     "https://agents-orchestrator.stolarnia-ams.workers.dev/api/chat",
     {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         message: input,
         model: "deepseek-r1", // lub user choice
       }),
     },
   );
   ```

2. **Dodaj wybór modelu**:
   - Dropdown: DeepSeek R1, Gemini 2.0 Flash, GPT-4o
   - Zapisz wybór w localStorage

3. **Streaming response** (opcjonalnie):
   - SSE lub chunks
   - Aktualizuj wiadomość w czasie rzeczywistym

### 3. UI Polish (PRIORYTET 3)

**Drobne usprawnienia**:

1. **Loading states**:
   - Skeleton loaders dla danych
   - Spinner podczas ładowania

2. **Error handling**:
   - Toast notifications lub alert box
   - Retry buttons

3. **Responsive design**:
   - Mobile breakpoints (póki co desktop-first OK)

## Struktura Plików

```
apps/hub/src/
├── App.tsx (router + sidebar - JUŻ GOTOWE)
├── features/
│   ├── unified/UnifiedOpsView.tsx ✅
│   ├── publishing/PublishingView.tsx ✅
│   ├── analysis/BunkerWarRoom.tsx ✅
│   ├── cayden/
│   │   ├── index.ts ✅
│   │   └── SimpleCaydenChat.tsx ✅ (DO ROZBUDOWY)
│   └── zenon/ ⏳ DODAJ TO
│       ├── index.ts
│       ├── ZenonView.tsx
│       ├── types.ts
│       └── components/
│           └── PromptCard.tsx
```

## Przykładowe Prompty (hardcode na start)

```typescript
const EXAMPLE_PROMPTS = [
  {
    id: 1,
    title: "Code Review Expert",
    category: "Development",
    prompt:
      "Review this code for bugs, performance, and best practices. Provide specific suggestions with examples.",
    tags: ["code", "review", "quality"],
  },
  {
    id: 2,
    title: "Product Description",
    category: "Marketing",
    prompt:
      "Create a compelling product description that highlights benefits, features, and unique selling points.",
    tags: ["copywriting", "ecommerce"],
  },
  // ... 8-10 więcej
];
```

## Checklisty

### ZENON Integration Checklist

- [ ] Utworzyć `src/features/zenon/` folder
- [ ] ZenonView.tsx - lista promptów
- [ ] PromptCard.tsx - pojedyncza karta
- [ ] types.ts - interfejsy
- [ ] index.ts - export
- [ ] Dodać do App.tsx (import + sidebar + case)
- [ ] Test build: `npm run build`
- [ ] Test w przeglądarce: http://localhost:5173

### CAY_DEN API Checklist

- [ ] Dodać fetch do agents-orchestrator
- [ ] Obsługa błędów API
- [ ] Loading state podczas odpowiedzi
- [ ] Dropdown wyboru modelu
- [ ] localStorage dla ustawień
- [ ] Test z prawdziwym API

## Dodatkowe Notatki

**Workspace context**:

- To monorepo z pnpm workspace
- Używamy `pnpm --filter @jimbo77/hub <command>`
- Packages: `@jimbo77/core`, `@jimbo77/ui` (z ops.css)

**Styling conventions**:

- Dark theme: gray-900/950 tło
- Yellow accent: #FFA500
- Font: font-mono dla tech vibe
- Zero border-radius (ops.css style)

**Commands**:

```bash
# Development
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend
pnpm --filter @jimbo77/hub dev

# Build
cd apps/hub
npm run build

# Deploy (później)
npm run deploy  # wrangler pages deploy
```

## Kolejność Wykonania

1. ✅ **Zrobione**: Dashboard struktura + CAY_DEN placeholder
2. ⏳ **Teraz**: ZENON PROMPTS - minimal version
3. 🔜 **Potem**: CAY_DEN API integration
4. 🔜 **Opcjonalnie**: UI polish

---

**Pytania do usera jeśli coś niejasne**:

- Czy ZENON ma mieć search bar czy tylko kategorie?
- Ile promptów pokazać na start (10, 20, wszystkie 234)?
- Czy copy-to-clipboard wystarczy czy też "send to chat"?

**Cel końcowy**: Dashboard z 2 funkcjonalnymi widokami (CAY_DEN + ZENON) gotowy do dalszego rozwijania.
