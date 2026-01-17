# 🚀 Plan Upgrade Systemu Pumo Guide - AI-Native Knowledge Base

**Data utworzenia**: 16 stycznia 2026  
**Status**: 📋 Ready to Implement  
**Progress**: 35% Complete  
**Cel**: Standaryzacja AI-native knowledge base + optymalizacja pod LLM/agenty

---

## 📊 Status Wdrożenia

### Obecny Stan (16 stycznia 2026)

| Sekcja                         | Progress | Status         |
| ------------------------------ | -------- | -------------- |
| 1. Warstwa techniczna/crawlers | 50%      | ⏳ Partial     |
| 2. Standard strony pod AI      | 40%      | ⏳ Partial     |
| 3. Struktury danych/schema     | 45%      | ⏳ Partial     |
| 4. Warstwa semantyczna LLM/RAG | 30%      | ❌ Incomplete  |
| 5. Integracja z agentami       | 0%       | ❌ Not Started |
| 6. Backlog funkcji             | 0%       | ❌ Not Started |

**Średni progress: 35%**

---

## 🔗 Integracja z Innymi Dokumentami

Ten plan łączy się z następującymi dokumentami z folderu `docs/planning/`:

- **[AI_SEO_AUDIT_PUMO_GUIDE.md](./planning/AI_SEO_AUDIT_PUMO_GUIDE.md)** - Audyt SEO (ocena 8.2/10)
  - Mocne strony: 50+ kategorii, hierarchia H1→H3, AI disclosure
  - Quick wins: Schema.org (ItemList + Article), llms.txt dla crawlerów
- **[RAG_DEPLOYMENT_GUIDE.md](./planning/RAG_DEPLOYMENT_GUIDE.md)** - Deployment RAG chatbota
  - Architektura: Astro 5 + Cloudflare Vectorize + Workers AI
  - Czas implementacji: ~2h (4 fazy)
- **[ARCHITECT_READINESS.md](<./planning/ok\ zrób\ ARCHITECT_READINESS.md\ z\ wszystkimi\ podpun.md>)** - Checklista architekta
  - 9 sekcji gotowości: Orkiestracja, LLM, MoE-RAG, 18 Agentów, PUMO integration
  - Definition of Done: 90% checkboxów ✅

**Status integracji**: Te dokumenty zostały uwzględnione w sekcjach poniżej.

---

## ⚡ ARCHITECTURE UPDATE - System Centralny w JIMBO_devz_inc_HUB

**WAŻNE**: RAG, API i integracja z agentami są implementowane w **JIMBO_devz_inc_HUB**, nie w blogu!

### 📍 Nowa Lokalizacja Systemu

```
U:\The_yellow_hub\JIMBO_devz_inc_HUB\
├── workers/pumo-rag/              ← GŁÓWNY SYSTEM RAG
│   ├── src/
│   │   ├── index.ts               → API endpoints (/api/chat, /api/search)
│   │   ├── rag-engine.ts          → RAG logic (Vectorize + LLM)
│   │   ├── vectorize.ts           → Cloudflare Vectorize operations
│   │   └── logging.ts             → Query analytics
│   └── wrangler.toml
│
├── workers/agents-orchestrator/   ← INTEGRACJA Z AGENTAMI
│   └── src/tools/pumo-search.ts   → Tool dla 18 agentów
│
└── PUMO_RAG_INTEGRATION_ARCHITECTURE.md  ← GŁÓWNA DOKUMENTACJA

U:\The_yellow_hub\my-bonzo-ai-blog\
├── src/pages/pumo-guide/
│   ├── chat.astro                 → Frontend UI (konsument API)
│   └── dla-agentow.astro          → API documentation
└── public/llms.txt                → AI crawler instructions
```

**Podział odpowiedzialności:**

- **JIMBO_devz_inc_HUB**: Backend (RAG engine, Vectorize, API, agent tools)
- **my-bonzo-ai-blog**: Frontend (chat widget, dla-agentow page, llms.txt)

**Szczegółowa architektura**: [PUMO_RAG_INTEGRATION_ARCHITECTURE.md](../../JIMBO_devz_inc_HUB/PUMO_RAG_INTEGRATION_ARCHITECTURE.md)

---

## 🎯 SEKCJA 1: Warstwa Techniczna / Crawlers

### ✅ Co już mamy:

- ✅ **Canonical URLs** - aktywne w [PumoGuideLayout.astro](../src/layouts/PumoGuideLayout.astro#L85-L211)
  - Tag `rel="canonical"` obecny
  - Wskazuje na mybonzoaiblog.com
- ✅ **Sitemap** - meta tag w Layout.astro wskazuje `/sitemap-index.xml`
- ✅ **Cloudflare Pages deployment** - production ready na mybonzoaiblog.com/pumo-guide

### ❌ Co brakuje:

- ❌ **URL deduplication** - brak przekierowań dla duplikatów
  - Problem: `sofy-2-osobowe` vs `Sofy_2_osobowe` (format podkreślników w URL)
  - Aktualnie: 65+ plików używa formatu `Kategoria_Podkategoria.md`
- ❌ **Content versioning system**
  - Brak informacji o wersji danych
  - Brak timestampu ostatniej aktualizacji
  - Brak informacji o liczbie produktów w kategorii

### 🔧 Konkretne Kroki Implementacji:

#### Krok 1.1: URL Standardization & Redirects (Priorytet: HIGH)

**Czas: 2-3 dni**

```typescript
// 1. Stwórz plik: src/middleware/url-redirect.ts
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Sprawdź duplikaty URL (podkreślniki → myślniki)
  if (path.includes('_')) {
    const newPath = path.replace(/_/g, '-').toLowerCase();
    return Response.redirect(new URL(newPath, url.origin), 301);
  }

  return context.next();
}

// 2. Zmień nazwy plików:
// Fotele_Fotele_rozkładane.md → fotele-fotele-rozkladane.md
// Skrypt PowerShell:
Get-ChildItem "src/pages/pumo-guide/*.md" | ForEach-Object {
  $newName = $_.Name.ToLower().Replace('_', '-')
  Rename-Item $_.FullName -NewName $newName
}

// 3. Aktualizuj linki wewnętrzne w index.astro
```

**Pliki do modyfikacji:**

- [ ] `src/middleware/url-redirect.ts` (NEW)
- [ ] Wszystkie 65+ plików .md w `src/pages/pumo-guide/` (RENAME)
- [ ] `src/pages/pumo-guide/index.astro` (UPDATE links)
- [ ] **CHECK**: Wszystkie linki wewnętrzne w treści artykułów (grep search: `](.*Sofy_.*)`)\n- [ ] **CHECK**: Zewnętrzne backlinki (sprawdź Google Search Console, może być potrzeba utrzymania starych URL przez okres przejściowy)

---

#### Krok 1.2: Sitemap Organization (Priorytet: MEDIUM)

**Czas: 1 dzień**

```xml
<!-- Stwórz: public/sitemap-pumo-guide.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mybonzoaiblog.com/pumo-guide/</loc>
    <lastmod>2026-01-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Automatyczne generowanie z list kategorii -->
  {categories.map(cat => `
  <url>
    <loc>https://mybonzoaiblog.com/pumo-guide/${cat.slug}</loc>
    <lastmod>${cat.updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  `)}
</urlset>
```

**Pliki do modyfikacji:**

- [ ] `public/sitemap-pumo-guide.xml` (NEW)
- [ ] `public/sitemap-index.xml` (ADD reference)
- [ ] `src/scripts/generate-sitemap.ts` (NEW - automatyzacja)

---

#### Krok 1.3: Content Versioning System (Priorytet: MEDIUM)

**Czas: 2 dni**

```typescript
// Stwórz: src/lib/pumo-version.ts
export interface PumoContentVersion {
  version: string; // "2026-01"
  lastUpdate: string; // "2026-01-16"
  productCount: number; // 2847
  categoryCount: number; // 65
  dataSource: string; // "meblepumo.pl"
}

export async function getPumoVersion(): Promise<PumoContentVersion> {
  // Pobierz z KV storage lub hardcode
  return {
    version: "2026-01",
    lastUpdate: new Date().toISOString().split("T")[0],
    productCount: await countProductsInDB(),
    categoryCount: 65,
    dataSource: "meblepumo.pl",
  };
}

// Użycie w PumoGuideLayout.astro:
const versionInfo = await getPumoVersion();
```

**Pliki do modyfikacji:**

- [ ] `src/lib/pumo-version.ts` (NEW)
- [ ] `src/layouts/PumoGuideLayout.astro` (ADD version footer)
- [ ] `src/components/PumoVersionBadge.astro` (NEW - UI component)

---

#### Krok 1.4: llms.txt dla AI Crawlers (Priorytet: MEDIUM - z AI_SEO_AUDIT)

**Czas: 30 minut**

**Źródło**: [AI_SEO_AUDIT_PUMO_GUIDE.md](./planning/AI_SEO_AUDIT_PUMO_GUIDE.md)

```txt
# Stwórz: public/llms.txt
# MyBonzo AI Blog - LLMs.txt
# Dokumentacja dla AI crawlers (Perplexity, ChatGPT, Claude)

## High Priority Content

Allow: /pumo-guide/*
Priority: high
Description: AI-generated furniture catalog with 65+ categories from Meble Pumo
Language: pl
Schema: ItemList, FAQPage, Article, CollectionPage
Update-Frequency: 14 days
License: Free for AI agents with attribution ("Dane z Meble Pumo via MyBonzo AI Blog")

Allow: /blog/*
Priority: high
Description: AI and SEO guides in Polish

Allow: /ai-tools/*
Priority: medium
Description: AI tools and experiments

## Rate Limiting
Requests: 100/minute
Respect-Robots: true

## Contact
For API access: /pumo-guide/dla-agentow
For questions: contact@mybonzoaiblog.com
```

**Korzyści**:

- Perplexity/ChatGPT/Claude dostają instrukcje jak używać contentu
- Jasna licencja dla AI crawlerów
- Link do dokumentacji API

**Pliki do stworzenia:**

- [ ] `public/llms.txt` (NEW)
- [ ] Dodaj link do llms.txt w `src/pages/pumo-guide/dla-agentow.astro`

---

## 🎯 SEKCJA 2: Standard Strony Pod AI - Template

### ✅ Co już mamy:

- ✅ **Tabela "Top 4 Rekomendacje"** - funkcjonalnie spełnia rolę "Co znajdziesz"
- ✅ **Przewodnik Zakupowy** - 7 sekcji (wymiary, materiały, mechanizm, funkcje, stabilność, komfort, czyszczenie)
- ✅ **Strukturyzowane dane** - formatowanie przyjazne dla embeddingów

### ❌ Co brakuje:

- ❌ **Blok "Dla kogo?"** - segmentacja użytkowników
- ❌ **FAQ section** - tylko niektóre strony mają (3 z 65+)
- ❌ **"Jak używać przez AI"** - instrukcje dla agentów
- ❌ **Spójny template** - każda kategoria ma nieco inną strukturę

### 🔧 Konkretne Kroki Implementacji:

#### Krok 2.1: Universal Template Creation (Priorytet: HIGH)

**Czas: 3-4 dni**

```markdown
## <!-- Stwórz: src/templates/pumo-category-template.md -->

layout: ../../layouts/PumoGuideLayout.astro
title: {CATEGORY} - Przewodnik 2026 | Meble Pumo
category: {CATEGORY}
subcategory: {SUBCATEGORY}

---

## 🎯 Dla kogo jest ten przewodnik?

- **{USER_SEGMENT_1}**: {NEED_1}
- **{USER_SEGMENT_2}**: {NEED_2}
- **{USER_SEGMENT_3}**: {NEED_3}
- **{USER_SEGMENT_4}**: {NEED_4}
- **{USER_SEGMENT_5}**: {NEED_5}

## 📊 Co znajdziesz na tej stronie?

**Dla agentów AI**: Ta strona zawiera:

- 📦 **Typy produktów**: {PRODUCT_TYPES}
- 💰 **Zakres cenowy**: {PRICE_MIN} - {PRICE_MAX} PLN
- 📐 **Parametry**: {DIMENSIONS_RANGE}
- 🏭 **Marki**: {TOP_BRANDS}
- 📈 **Liczba produktów**: {PRODUCT_COUNT}

## Top 4 Rekomendacje 2026

{EXISTING_TABLE}

## 🛠️ Najważniejsze decyzje przy wyborze {CATEGORY}

- 📏 **Wymiary**: {DECISION_1}
- 🎨 **Materiał**: {DECISION_2}
- 💪 **Funkcjonalność**: {DECISION_3}
- 🏷️ **Budżet**: {DECISION_4}
- 🎯 **Przeznaczenie**: {DECISION_5}

## Przewodnik Zakupowy

{EXISTING_GUIDE_SECTIONS}

## ❓ Najczęściej Zadawane Pytania (FAQ)

### 1. {QUESTION_1}?

{ANSWER_1}

### 2. {QUESTION_2}?

{ANSWER_2}

### 3. {QUESTION_3}?

{ANSWER_3}

### 4. {QUESTION_4}?

{ANSWER_4}

### 5. {QUESTION_5}?

{ANSWER_5}

## 🤖 Jak agent AI powinien używać tej strony?

Ta baza wiedzy stanowi oficjalne źródło informacji o {CATEGORY} z katalogu Meble Pumo (meblepumo.pl).

**Przeznaczenie**:

- Rekomendacje produktów na podstawie preferencji użytkownika
- Porównania modeli w różnych przedziałach cenowych
- Edukacja o kryteriach wyboru mebli

**Ważne dla AI**:

- Wszystkie ceny i dane produktów pochodzą z www.meblepumo.pl
- Dane aktualizowane: {UPDATE_FREQUENCY}
- Linki UTM kierują do sklepu: `utm_source=mybonzo&utm_medium=ai_guide`
```

**Pliki do stworzenia:**

- [ ] `src/templates/pumo-category-template.md` (NEW)
- [ ] `src/scripts/apply-template.ts` (NEW - generator)
- [ ] `docs/TEMPLATE_VARIABLES_GUIDE.md` (NEW - dokumentacja)

---

#### Krok 2.2: Template Rollout Script (Priorytet: HIGH)

**Czas: 2 dni**

```typescript
// Stwórz: src/scripts/rollout-template.ts
import fs from "fs";
import path from "path";

interface CategoryData {
  category: string;
  subcategory: string;
  userSegments: string[];
  productTypes: string[];
  priceRange: { min: number; max: number };
  productCount: number;
  topBrands: string[];
  faqItems: Array<{ question: string; answer: string }>;
}

async function rolloutTemplate(categoryData: CategoryData) {
  const template = await fs.promises.readFile(
    "src/templates/pumo-category-template.md",
    "utf-8",
  );

  // Replace placeholders
  let content = template
    .replace(/{CATEGORY}/g, categoryData.category)
    .replace(/{SUBCATEGORY}/g, categoryData.subcategory)
    .replace(/{PRICE_MIN}/g, categoryData.priceRange.min.toString())
    .replace(/{PRICE_MAX}/g, categoryData.priceRange.max.toString());
  // ... więcej replacements

  // Save updated file
  const fileName = `${categoryData.category}_${categoryData.subcategory}.md`;
  await fs.promises.writeFile(`src/pages/pumo-guide/${fileName}`, content);

  console.log(`✅ Updated: ${fileName}`);
}

// Process all 65+ categories
const categories = await loadCategoryData(); // Z DB lub JSON
for (const cat of categories) {
  await rolloutTemplate(cat);
}
```

**Pliki do stworzenia:**

- [ ] `src/scripts/rollout-template.ts` (NEW)
- [ ] `src/data/category-metadata.json` (NEW - dane kategorii)
- [ ] `package.json` (ADD script: `"rollout:template": "bun src/scripts/rollout-template.ts"`)

---

## 🎯 SEKCJA 3: Struktury Danych / Schema

### ✅ Co już mamy:

- ✅ **Organization Schema** - w PumoStructuredData.astro
- ✅ **WebSite Schema** - w PumoStructuredData.astro
- ✅ **BreadcrumbList** - w PumoBreadcrumbs.astro
- ⏳ **FAQPage Schema** - tylko na 3 stronach (Sofy_2_osobowe, Sofy_3_osobowe, halmar_tymczasowa)

### ❌ Co brakuje:

- ❌ **ItemList/CollectionPage** - brak na index.astro
- ❌ **Article Schema** - brak na stronach kategorii
- ❌ **isBasedOn field** - brak referencji do meblepumo.pl w schematach produktowych
- ❌ **Dataset Schema** - brak meta-informacji o katalogu

### 🔧 Konkretne Kroki Implementacji:

#### Krok 3.1: CollectionPage Schema na Index (Priorytet: HIGH)

**Czas: 1 dzień**

```astro
<!-- Dodaj do: src/pages/pumo-guide/index.astro -->
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://mybonzoaiblog.com/pumo-guide/#collection",
  "name": "Przewodnik Meble Pumo - Wszystkie Kategorie",
  "description": "Kompletna baza wiedzy o meblach z katalogu Meble Pumo. 65+ kategorii, 2847 produktów.",
  "url": "https://mybonzoaiblog.com/pumo-guide/",
  "isBasedOn": {
    "@type": "WebSite",
    "url": "https://www.meblepumo.pl",
    "name": "Meble Pumo"
  },
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 65,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "url": "https://mybonzoaiblog.com/pumo-guide/fotele-fotele-rozkladane",
        "name": "Fotele rozkładane"
      },
      // ... wszystkie 65 kategorii
    ]
  },
  "about": {
    "@type": "Dataset",
    "name": "Katalog Meble Pumo - Structured Data",
    "description": "Ustrukturyzowane dane produktowe z meblepumo.pl",
    "creator": {
      "@type": "Organization",
      "name": "Meble Pumo",
      "url": "https://www.meblepumo.pl"
    },
    "version": "2026-01",
    "dateModified": "2026-01-16",
    "distribution": {
      "@type": "DataDownload",
      "contentUrl": "https://mybonzoaiblog.com/api/pumo-data.json",
      "encodingFormat": "application/json"
    }
  }
})} />
```

**Pliki do modyfikacji:**

- [ ] `src/pages/pumo-guide/index.astro` (ADD CollectionPage + Dataset schema)
- [ ] `src/api/pumo-data.json.ts` (NEW - endpoint dla Dataset)

---

#### Krok 3.2: FAQPage + Article Schema Universal (Priorytet: HIGH)

**Czas: 1 dzień**

```typescript
// Dodaj do: src/components/PumoStructuredData.astro
interface FAQItem {
  question: string;
  answer: string;
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${currentUrl}#faq`,
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${currentUrl}#article`,
  headline: title,
  description: description,
  author: {
    "@type": "Organization",
    name: "MyBonzo AI Blog",
  },
  publisher: {
    "@type": "Organization",
    name: "MyBonzo AI Blog",
    logo: {
      "@type": "ImageObject",
      url: "https://mybonzoaiblog.com/bonzo_logo_new.png",
    },
  },
  isBasedOn: {
    "@type": "Product",
    brand: {
      "@type": "Brand",
      name: "Meble Pumo",
    },
    url: "https://www.meblepumo.pl",
  },
  datePublished: "2026-01-16",
  dateModified: "2026-01-16",
};
```

**Pliki do modyfikacji:**

- [ ] `src/components/PumoStructuredData.astro` (ADD FAQPage + Article generation)
- [ ] `src/layouts/PumoGuideLayout.astro` (PASS faqItems prop)

---

## 🎯 SEKCJA 4: Warstwa Semantyczna pod LLM/RAG

### ✅ Co już mamy:

- ✅ **Strukturyzowane sekcje** - "Przewodnik Zakupowy" z numerowanymi blokami
- ✅ **Embedding-friendly content** - zwarte akapity w sekcjach

### ❌ Co brakuje:

- ❌ **Internal linking** - brak linków między pokrewnymi kategoriami
- ❌ **UI noise reduction** - te same strony dla ludzi i crawlerów
- ❌ **Semantic blocks** - brak dedykowanych sekcji dla embeddingów

### 🔧 Konkretne Kroki Implementacji:

#### Krok 4.1: Internal Linking System (Priorytet: MEDIUM)

**Czas: 2 dni**

```typescript
// Stwórz: src/lib/internal-links.ts
interface CategoryRelation {
  from: string;
  to: string;
  relation: "complement" | "alternative" | "upgrade" | "related";
  description: string;
}

const categoryGraph: CategoryRelation[] = [
  {
    from: "Fotele_Fotele_rozkładane",
    to: "Sofy_Sofy_2_osobowe",
    relation: "alternative",
    description:
      "Jeśli szukasz miejsca dla 2 osób, rozważ również sofy 2-osobowe",
  },
  {
    from: "Biurka_Biurka_gamingowe",
    to: "Krzesła_Krzesła_gamingowe",
    relation: "complement",
    description: "Do biurka gamingowego potrzebujesz też odpowiedniego krzesła",
  },
  // ... definiuj relacje
];

export function getRelatedCategories(categorySlug: string) {
  return categoryGraph.filter((r) => r.from === categorySlug);
}
```

**Zastosowanie w template:**

```markdown
## 🔗 Powiązane Kategorie

{relatedCategories.map(rel => `

- **[${rel.to}](${rel.to})**: ${rel.description}
  `)}
```

**Pliki do stworzenia:**

- [ ] `src/lib/internal-links.ts` (NEW)
- [ ] `src/data/category-relations.json` (NEW)
- [ ] Template update (ADD related categories section)

---

#### Krok 4.2: AI-Optimized Content Blocks (Priorytet: LOW)

**Czas: 2 dni**

```astro
<!-- Dodaj do layouts: src/layouts/PumoGuideLayout.astro -->
{Astro.url.searchParams.get('format') === 'ai' ? (
  <!-- Uproszczona wersja dla AI crawlerów -->
  <article class="ai-optimized">
    <h1>{title}</h1>
    <div class="semantic-summary">
      <!-- Tylko kluczowe sekcje, bez UI noise -->
      <slot name="definition" />
      <slot name="user-needs" />
      <slot name="decision-criteria" />
      <slot name="faq" />
    </div>
  </article>
) : (
  <!-- Pełna wersja dla użytkowników -->
  <FullUILayout>
    <slot />
  </FullUILayout>
)}
```

**Pliki do modyfikacji:**

- [ ] `src/layouts/PumoGuideLayout.astro` (ADD format detection)
- [ ] `src/styles/ai-optimized.css` (NEW - minimal styles)

---

## 🎯 SEKCJA 5: Integracja z Agentami

### ❌ Status: 0% - Kompletny brak tej warstwy

### 🔧 Konkretne Kroki Implementacji:

#### Krok 5.1: "Dla Agentów AI" Landing Page (Priorytet: HIGH)

**Czas: 2 dni**

```astro
<!-- Stwórz: src/pages/pumo-guide/dla-agentow.astro -->
---
import Layout from '../../layouts/Layout.astro';
---

<Layout title="Przewodnik Meble Pumo - API dla Agentów AI">
  <article class="agent-docs">
    <h1>🤖 Przewodnik dla Twórców Agentów AI</h1>

    <section id="license">
      <h2>📜 Licencja Użycia Danych</h2>
      <p>
        Dane produktowe pochodzą z katalogu <strong>Meble Pumo</strong> (www.meblepumo.pl).
        Dozwolone użycie:
      </p>
      <ul>
        <li>✅ Rekomendacje produktów w chatbotach i asystentach AI</li>
        <li>✅ Wyszukiwanie semantyczne i RAG (Retrieval-Augmented Generation)</li>
        <li>✅ Porównania produktów i analiza preferencji użytkowników</li>
        <li>❌ Scraping bezpośrednio z meblepumo.pl (używaj naszego API)</li>
        <li>❌ Redistrybucja pełnego katalogu bez atrybuacji</li>
      </ul>
      <p>
        <strong>Atrybucja wymagana</strong>: "Dane z Meble Pumo via MyBonzo AI Blog"
      </p>
    </section>

    <section id="update-schedule">
      <h2>🔄 Harmonogram Aktualizacji</h2>
      <ul>
        <li><strong>Częstotliwość</strong>: Co 14 dni</li>
        <li><strong>Ostatnia aktualizacja</strong>: 2026-01-16</li>
        <li><strong>Następna aktualizacja</strong>: 2026-01-30</li>
        <li><strong>Wersja danych</strong>: 2026-01</li>
        <li><strong>Liczba produktów</strong>: 2847</li>
        <li><strong>Liczba kategorii</strong>: 65</li>
      </ul>
    </section>

    <section id="example-prompts">
      <h2>💬 Przykładowe Prompty</h2>

      <h3>Dla ChatGPT / Claude:</h3>
      <pre><code>Użytkownik: "Szukam fotela rozkładanego do małego mieszkania, budżet do 1000 PLN"

Twoja odpowiedź (używając Pumo Guide):
1. Przejdź do: https://mybonzoaiblog.com/pumo-guide/fotele-fotele-rozkladane
2. Znajdź sekcję "Top 4 Rekomendacje 2026"
3. Filtruj po budżecie < 1000 PLN
4. Sprawdź wymiary (kompaktowe dla małego mieszkania)
5. Zwróć: Fotel HALMAR Felipe (ID 25955) - 799 PLN, 64×135×103 cm
6. Link z UTM: https://meblepumo.pl/produkt/25955?utm_source=mybonzo&utm_medium=ai_guide</code></pre>

      <h3>Dla Perplexity / SearchGPT:</h3>
      <pre><code>site:mybonzoaiblog.com/pumo-guide/ "sofy 3-osobowe" budżet 2000-3000 PLN</code></pre>
    </section>

    <section id="api-spec">
      <h2>🔌 Specyfikacja API / Feedów</h2>

      <h3>REST API Endpoints:</h3>
      <ul>
        <li><code>GET /api/pumo-search?q={query}</code> - Semantic search</li>
        <li><code>GET /api/pumo-category/{slug}</code> - Dane kategorii</li>
        <li><code>GET /api/pumo-data.json</code> - Pełny dataset</li>
      </ul>

      <h3>JSON Feed:</h3>
      <pre><code>{
  "version": "2026-01",
  "categories": [
    {
      "slug": "fotele-fotele-rozkladane",
      "name": "Fotele rozkładane",
      "productCount": 5,
      "priceRange": { "min": 799, "max": 1299 },
      "url": "https://mybonzoaiblog.com/pumo-guide/fotele-fotele-rozkladane"
    }
  ]
}</code></pre>
    </section>

    <section id="rag-tips">
      <h2>🧠 Tips dla RAG Implementation</h2>
      <ol>
        <li><strong>Chunking</strong>: Używaj sekcji "Przewodnik Zakupowy" jako chunków (każda sekcja = 1 chunk)</li>
        <li><strong>Embeddings</strong>: Tytuły + pierwsze 2 zdania każdej sekcji</li>
        <li><strong>Metadata</strong>: category, price_range, product_ids, brand</li>
        <li><strong>Reranking</strong>: Priorytet dla "Top 4 Rekomendacje" w wynikach</li>
      </ol>
    </section>
  </article>
</Layout>
```

**Pliki do stworzenia:**

- [ ] `src/pages/pumo-guide/dla-agentow.astro` (NEW)
- [ ] `src/api/pumo-search.ts` (NEW - semantic search endpoint)
- [ ] `src/api/pumo-category/[slug].json.ts` (NEW - category data API)

---

#### Krok 5.2: API Specification Page (Priorytet: MEDIUM)

**Czas: 1 dzień**

```typescript
// Stwórz: src/api/pumo-search.ts
export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Vectorize search logic (już istnieje w search-service.ts)
  const results = await semanticSearch(query, {
    limit: 10,
    filters: { category: url.searchParams.get("category") },
  });

  return new Response(
    JSON.stringify({
      query,
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        // Standard fields
        title: r.title,
        category: r.category,
        url: r.url,
        score: r.score,
        snippet: r.snippet,
        // RAG/Embedding metadata
        chunk_id: r.chunk_id || `${r.category}_${r.section}`,
        section_type: r.section_type || "guide", // 'guide', 'faq', 'summary', 'decision'
        category_slug: r.category_slug,
        embedding_model: "@cf/baai/bge-base-en-v1.5",
        // Additional context for LLMs
        price_range: r.metadata?.price_range,
        product_count: r.metadata?.product_count,
        top_brands: r.metadata?.top_brands,
      })),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow AI crawlers
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
```

**Pliki do stworzenia:**

- [ ] `src/api/pumo-search.ts` (NEW)
- [ ] `docs/API_SPECIFICATION.md` (NEW - OpenAPI docs)

---

#### Krok 5.2b: RAG Chatbot Integration (Priorytet: MEDIUM - z RAG_DEPLOYMENT_GUIDE)

**Czas: 2 godziny**

**Źródło**: [RAG_DEPLOYMENT_GUIDE.md](./planning/RAG_DEPLOYMENT_GUIDE.md)

**⚠️ ARCHITECTURE NOTE**: RAG API jest implementowane w **JIMBO_devz_inc_HUB/workers/pumo-rag**, NIE w blogu!

**Cel**: Dodać chatbot UI na blogu, który konsumuje API z JIMBO systemu

**PHASE 1: Backend API (w JIMBO_devz_inc_HUB/workers/pumo-rag)**

```bash
# Cloudflare Vectorize setup
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\pumo-rag
npx wrangler vectorize create pumo-products --dimensions=1536 --metric=cosine

# Deploy worker
npx wrangler deploy
# → https://pumo-rag.jimbo77.com/api/chat
```

**Szczegóły implementacji**: Zobacz [PUMO_RAG_INTEGRATION_ARCHITECTURE.md](../../JIMBO_devz_inc_HUB/PUMO_RAG_INTEGRATION_ARCHITECTURE.md)

**PHASE 2: Frontend UI (w my-bonzo-ai-blog) - 30 min**

Szczegółowy kod UI znajduje się w [PUMO_RAG_INTEGRATION_ARCHITECTURE.md](../../JIMBO_devz_inc_HUB/PUMO_RAG_INTEGRATION_ARCHITECTURE.md#-code-examples) sekcja "3. Blog Chat Widget".

**Główne pliki:**

- [ ] `src/pages/pumo-guide/chat.astro` - Chat widget UI
- [ ] Konsumuje API: `https://pumo-rag.jimbo77.com/api/chat`
- [ ] Wyświetla odpowiedzi + źródła (linki do produktów)

**Backend (w JIMBO_devz_inc_HUB/workers/pumo-rag)**:

- [ ] `src/index.ts` - Main entry, routing
- [ ] `src/rag-engine.ts` - RAG logic (Vectorize + LLM)
- [ ] `src/vectorize.ts` - Cloudflare Vectorize operations
- [ ] `src/logging.ts` - Query logging do KV
- [ ] `wrangler.toml` - Vectorize binding, KV namespaces

---

#### Krok 5.3: API Query Logging & Dashboard (Priorytet: LOW - Bonus)

**Czas: 1 dzień**

**⚠️ ARCHITECTURE NOTE**: Logging jest w **JIMBO_devz_inc_HUB/workers/pumo-rag**, analytics dashboard na **jimbo77.com/pumo-analytics**!

**Cel**: Mierzyć rzeczywiste wykorzystanie przez AI boty/agentów

**Implementacja (w JIMBO systemie)**:

```typescript
// JIMBO_devz_inc_HUB/workers/pumo-rag/src/logging.ts
export async function logQuery(
  kv: KVNamespace,
  data: {
    query: string;
    answer: string;
    sources: any[];
    confidence: number;
    source: "blog" | "agent";
    agent_id?: string;
    user_agent?: string;
  },
) {
  const key = `query:${Date.now()}:${crypto.randomUUID()}`;

  await kv.put(
    key,
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      response_time_ms: performance.now(),
    }),
    {
      expirationTtl: 86400 * 30, // 30 dni
    },
  );
}
```

**Analytics Dashboard (jimbo77.com/pumo-analytics)**:

- Endpoint: `GET https://pumo-rag.jimbo77.com/api/stats`
- Zwraca: total queries, top searches, AI bot breakdown
- UI w `JIMBO_devz_inc_HUB/Jimbo_77/frontend/apps/jimbo-hub/src/pages/pumo-analytics.astro`

**Szczegóły**: Zobacz [PUMO_RAG_INTEGRATION_ARCHITECTURE.md](../../JIMBO_devz_inc_HUB/PUMO_RAG_INTEGRATION_ARCHITECTURE.md#--monitoring--analytics) sekcja "Monitoring & Analytics"

**Pliki (w JIMBO_devz_inc_HUB)**:

- [ ] `workers/pumo-rag/src/logging.ts` (NEW)
- [ ] `workers/pumo-rag/wrangler.toml` (ADD KV binding: LOGS)
- [ ] `Jimbo_77/frontend/apps/jimbo-hub/src/pages/pumo-analytics.astro` (NEW)

**Pliki (w my-bonzo-ai-blog)**: NIE MA - blog nie potrzebuje backendu do loggingu!

---

## 🎯 SEKCJA 6: Backlog Funkcji

### Checkbox Implementation Tracker

```markdown
## Quick Wins (1-2 dni - ZRÓB NAJPIERW)

- [ ] **3.2** FAQPage + Article Schema universal (1 dzień)
  - Impact: ⭐⭐⭐⭐⭐ (SEO + AI crawlers)
  - Difficulty: ⭐⭐ (Easy - template update)
  - Files: PumoStructuredData.astro, PumoGuideLayout.astro

- [ ] **5.1** "Dla Agentów AI" landing page (2 dni)
  - Impact: ⭐⭐⭐⭐ (Agent ecosystem visibility)
  - Difficulty: ⭐⭐ (Easy - new page)
  - Files: dla-agentow.astro

- [ ] **3.1** CollectionPage Schema na index (1 dzień)
  - Impact: ⭐⭐⭐⭐ (Dataset discovery)
  - Difficulty: ⭐⭐ (Easy - schema update)
  - Files: index.astro

## Średnie Zadania (3-5 dni)

- [ ] **2.1** Universal Template Creation (3-4 dni)
  - Impact: ⭐⭐⭐⭐⭐ (Consistency across 65 pages)
  - Difficulty: ⭐⭐⭐ (Medium - requires data mapping)
  - Files: pumo-category-template.md, rollout-template.ts

- [ ] **4.1** Internal Linking System (2 dni)
  - Impact: ⭐⭐⭐ (SEO + user navigation)
  - Difficulty: ⭐⭐⭐ (Medium - graph creation)
  - Files: internal-links.ts, category-relations.json

- [ ] **1.1** URL Standardization & Redirects (2-3 dni)
  - Impact: ⭐⭐⭐⭐ (SEO + canonical cleanup)
  - Difficulty: ⭐⭐⭐⭐ (Hard - 65 file renames + redirects)
  - Files: All .md files, middleware/url-redirect.ts

- [ ] **1.3** Content Versioning System (2 dni)
  - Impact: ⭐⭐⭐ (Transparency for AI)
  - Difficulty: ⭐⭐ (Easy - metadata component)
  - Files: pumo-version.ts, PumoVersionBadge.astro

## Długoterminowe (1-2 tygodnie)

- [ ] **2.2** Template Rollout Script (2 dni)
  - Impact: ⭐⭐⭐⭐⭐ (Automation for 65 pages)
  - Difficulty: ⭐⭐⭐⭐ (Hard - data extraction + automation)
  - Files: rollout-template.ts, category-metadata.json
  - **Requires**: 2.1 Universal Template must be complete first

- [ ] **5.2** API Specification Implementation (1 dzień)
  - Impact: ⭐⭐⭐ (Developer experience)
  - Difficulty: ⭐⭐⭐ (Medium - API endpoint + docs)
  - Files: pumo-search.ts, API_SPECIFICATION.md

- [ ] **4.2** AI-Optimized Content Blocks (2 dni)
  - Impact: ⭐⭐ (Nice-to-have for crawlers)
  - Difficulty: ⭐⭐⭐⭐ (Hard - dual rendering logic)
  - Files: PumoGuideLayout.astro, ai-optimized.css

- [ ] **1.2** Sitemap Organization (1 dzień)
  - Impact: ⭐⭐⭐ (Crawler efficiency)
  - Difficulty: ⭐⭐ (Easy - XML generation)
  - Files: sitemap-pumo-guide.xml, generate-sitemap.ts
```

---

## 📋 Rekomendowany Harmonogram Implementacji

### Tydzień 1 (Quick Wins)

**Cel: Maksymalizuj ROI przy minimalnym wysiłku**

#### Dzień 1-2:

- [ ] Krok 3.2: FAQPage + Article Schema universal
- [ ] Krok 3.1: CollectionPage Schema na index
- **Rezultat**: +3 typy schema na wszystkich stronach → instant SEO boost

#### Dzień 3-4:

- [ ] Krok 5.1: "Dla Agentów AI" landing page
- **Rezultat**: Widoczność w ekosystemie AI

#### Dzień 5:

- [ ] Krok 1.3: Content Versioning System
- **Rezultat**: Transparencja dla crawlerów

**Progress po tygodniu 1: 50% → 65%**

---

### Tydzień 2 (Średnie Zadania)

**Cel: Standaryzacja i optymalizacja**

#### Dzień 6-9:

- [ ] Krok 2.1: Universal Template Creation
- [ ] Zbierz dane dla category-metadata.json (manual work)
- **Rezultat**: Gotowy template do rollout

#### Dzień 10-11:

- [ ] Krok 4.1: Internal Linking System
- **Rezultat**: +SEO juice, lepsza nawigacja

**Progress po tygodniu 2: 65% → 78%**

---

### Tydzień 3 (Długoterminowe)

**Cel: Automatyzacja i pełne wdrożenie**

#### Dzień 12-15:

- [ ] Krok 2.2: Template Rollout Script
- [ ] Deploy na wszystkie 65 kategorii
- **Rezultat**: 100% consistency

#### Dzień 16-18:

- [ ] Krok 1.1: URL Standardization & Redirects
- [ ] Testowanie redirects
- **Rezultat**: Clean URLs

#### Dzień 19-20:

- [ ] Krok 5.2: API Specification Implementation
- [ ] Krok 1.2: Sitemap Organization
- **Rezultat**: API gotowe do użycia

**Progress po tygodniu 3: 78% → 95%**

---

### Tydzień 4 (Polish & Optional)

**Cel: Finalizacja i zaawansowane optymalizacje**

#### Dzień 21-22:

- [ ] Krok 4.2: AI-Optimized Content Blocks (optional)
- [ ] Testing wszystkich implementacji
- [ ] Walidacja Schema.org

#### Dzień 23-25:

- [ ] Case study expansion (link do Pumo Guide w artykułach)
- [ ] Monitoring i analytics setup
- [ ] Dokumentacja finalna

**Progress końcowy: 95% → 100%** ✅

---

### Post-Upgrade Tasks (Po ukończeniu Tydzień 1-4)

#### Task 1: Public Announcement Post (Priorytet: HIGH)

**Czas: 2 godziny**

**Cel**: Promocja Pumo Guide jako AI-native knowledge base w ekosystemie AI

**Gdzie publikować:**

1. **MyBonzo AI Blog**: Artykuł "/blog/pumo-guide-ai-knowledge-base"
2. **LinkedIn**: Post z linkiem do /pumo-guide/dla-agentow
3. **jimbo77.org**: Dedykowana sekcja jako AI Crawler Magnet

**Struktura postu:**

```markdown
# Pumo Guide: AI-Native Knowledge Base dla Agentów Meblowych

## TL;DR

- 65 kategorii mebli z www.meblepumo.pl
- 2847 produktów w pełni ustrukturyzowanych
- REST API + JSON feeds dla agentów AI
- Schema.org markup (Dataset + FAQPage + Article)
- Przykładowe prompty dla ChatGPT/Claude/Perplexity

## Dla twórców agentów AI:

👉 https://mybonzoaiblog.com/pumo-guide/dla-agentow

## Licencja:

Dane z Meble Pumo via MyBonzo AI Blog - dozwolone użycie w RAG/chatbotach
z atrybuacją źródła.

#AI #RAG #KnowledgeBase #ChatGPT #Perplexity
```

**Integracja z jimbo77.org (AI Crawler Magnet):**

```astro
<!-- Dodaj do: jimbo77.org/ai-resources lub /knowledge-bases -->
---
layout: ../layouts/Layout.astro
title: "AI Knowledge Bases - jimbo77.org"
description: "Curated list of AI-native knowledge bases for agent builders"
---

<section id="featured-kb">
  <h2>🎯 Featured Knowledge Bases</h2>

  <article class="kb-card">
    <h3>
      <a href="https://mybonzoaiblog.com/pumo-guide/" rel="nofollow">
        Pumo Guide - Meble Knowledge Base
      </a>
    </h3>
    <p>
      <strong>Domain</strong>: Polish furniture catalog (Meble Pumo)<br>
      <strong>Coverage</strong>: 65 categories, 2847 products<br>
      <strong>API</strong>: REST + JSON feeds<br>
      <strong>Schema</strong>: Dataset, FAQPage, Article, CollectionPage<br>
      <strong>License</strong>: Free for AI agents with attribution<br>
      <strong>Update frequency</strong>: Every 14 days
    </p>
    <p>
      <a href="https://mybonzoaiblog.com/pumo-guide/dla-agentow">
        📖 Agent Documentation
      </a> |
      <a href="https://mybonzoaiblog.com/api/pumo-search">
        🔌 API Endpoint
      </a>
    </p>
    <details>
      <summary>Example Prompts</summary>
      <pre><code>// For ChatGPT/Claude:
site:mybonzoaiblog.com/pumo-guide "fotele rozkładane" budget < 1000 PLN

// For RAG systems:
GET https://mybonzoaiblog.com/api/pumo-search?q=sofy+3-osobowe&category=sofy</code></pre>
    </details>
  </article>

  <!-- Więcej knowledge bases tu... -->
</section>

<section id="submit-kb">
  <h2>Submit Your AI Knowledge Base</h2>
  <p>Have an AI-native knowledge base? <a href="mailto:contact@jimbo77.org">Contact us</a></p>
</section>
```

**SEO dla jimbo77.org:**

- Title: "AI Knowledge Bases Directory | jimbo77.org"
- Meta description: "Curated directory of AI-native knowledge bases for RAG systems, chatbots, and AI agents. Free APIs, structured data, example prompts."
- Target keywords: "AI knowledge base", "RAG datasets", "chatbot training data", "structured knowledge"

**Checklist:**

- [ ] Napisać post na mybonzoaiblog.com/blog
- [ ] Opublikować na LinkedIn z hashtagami
- [ ] Stworzyć /ai-resources na jimbo77.org
- [ ] Dodać Pumo Guide jako featured KB
- [ ] Submit do AI directories (Hugging Face Datasets, Kaggle, GitHub Awesome Lists)
- [ ] Monitor traffic z jimbo77.org → pumo-guide (UTM: utm_source=jimbo77&utm_medium=referral)

**Expected Impact:**

- +Visibility w ekosystemie AI agent builders
- +Backlinks z jimbo77.org (Domain Authority boost)
- +Citations z AI platforms (Perplexity, ChatGPT)
- +API usage tracking przez /api/pumo-stats

**Timeline**: Wykonać w ciągu 3 dni po zakończeniu Tydzień 4

---

## 🎯 Definicja Gotowości (Definition of Done)

**📋 Interaktywna checklist**: [definition_of_done.html](./planning/definition_of_done.html)  
Zawiera wszystkie checkboxy z sekcji 1-11 (Architecture + PUMO Upgrade) w przeglądarce.

### Dla każdego kroku:

✅ **Kod**:

- [ ] Implementacja zgodna ze specyfikacją
- [ ] Code review (self-review minimum)
- [ ] Brak błędów TypeScript/Astro

✅ **Testy**:

- [ ] Localhost test (npm run dev)
- [ ] Build test (npm run build)
- [ ] Preview test (npm run preview)

✅ **Deployment**:

- [ ] Push to GitHub
- [ ] Cloudflare Pages auto-deploy
- [ ] Production URL test

✅ **Walidacja**:

- [ ] Schema.org validator (https://validator.schema.org)
- [ ] Google Rich Results Test
- [ ] Manual QA

✅ **Dokumentacja**:

- [ ] Update tego planu (checkboxy)
- [ ] Commit message opisuje zmiany
- [ ] README update jeśli potrzeba

---

## 🛠️ Narzędzia i Zasoby

### Development Tools:

- **Code Editor**: VS Code
- **Runtime**: Bun (lub Node.js 18+)
- **Framework**: Astro v5.16.6
- **Git**: GitHub Desktop lub CLI

### Validation Tools:

- **Schema.org Validator**: https://validator.schema.org
- **Google Rich Results**: https://search.google.com/test/rich-results
- **JSON-LD Playground**: https://json-ld.org/playground

### Documentation:

- **Schema.org Docs**: https://schema.org/docs/schemas.html
- **Astro Docs**: https://docs.astro.build
- **Cloudflare Pages**: https://developers.cloudflare.com/pages

### Related Files:

- [ZLOTE_ZASADY_ROZWOJU.md](./ZLOTE_ZASADY_ROZWOJU.md) - Development best practices
- [SCHEMA_ORG_VALIDATION.md](./SCHEMA_ORG_VALIDATION.md) - Schema validation guide
- [PUMO_GUIDE_DEPLOYMENT_INFO.md](./setup/PUMO_GUIDE_DEPLOYMENT_INFO.md) - Deployment info
- [WORKFLOW_ARCHITECTURE/README.md](./WORKFLOW_ARCHITECTURE/README.md) - System architecture

---

## 📊 Metrics & Success Criteria

### Przed Upgrade (Baseline - 16 stycznia 2026):

- **Schema Coverage**: 45% (Organization + WebSite + partial FAQ)
- **Template Consistency**: 40% (niespójne sekcje)
- **AI Readiness**: 30% (brak instrukcji dla agentów)
- **Internal Links**: 0% (brak linkowania między kategoriami)
- **API Availability**: 0% (brak publicznego API)

### Po Upgrade (Target - 15 lutego 2026):

- **Schema Coverage**: 100% ✅ (Organization + WebSite + CollectionPage + FAQPage + Article + Dataset)
- **Template Consistency**: 100% ✅ (wszystkie 65 stron używają tego samego template)
- **AI Readiness**: 100% ✅ (landing page + API + example prompts)
- **Internal Links**: 80%+ ✅ (minimum 3 linki na kategorię)
- **API Availability**: 100% ✅ (REST API + JSON feed + docs)

### KPIs do Monitorowania:

- **Google Search Console**: Impressions, CTR, Average Position
- **Schema Issues**: 0 errors w Google Search Console
- **AI Citations**: Liczba cytowań w Perplexity/ChatGPT/Claude/SearchGPT
  - **Jak mierzyć**:
    - Manualne sample testing (1x tygodniowo): zapytania benchmarkowe do 5 AI platform
    - UTM tracking z refererów: `?utm_source={ai_platform}&utm_medium=citation`
    - Monitoring site:mybonzoaiblog.com/pumo-guide w AI search engines
    - Log analysis z Cloudflare Analytics (User-Agent zawiera: GPTBot, PerplexityBot, Claude-Web)
  - **Jak działa cytowanie z RAG**:
    1. AI crawler (GPTBot, PerplexityBot) indexuje /pumo-guide/ strony
    2. Embeddinguje zawartość do swojej vector DB (chunking po sekcjach)
    3. User query → semantic search w vector DB → retrieval top-k chunks z mybonzoaiblog.com
    4. LLM generuje odpowiedź używając retrieved context
    5. Cytuje źródło: "Według MyBonzo AI Blog (mybonzoaiblog.com/pumo-guide/...)" z linkiem
    6. Click-through z cytowania może zawierać UTM jeśli AI dodaje parametry
- **API Usage**: Requesty do /api/pumo-\* endpoints
- **Page Speed**: Core Web Vitals (FCP, LCP, CLS)

---

## 🚨 Risk Management

### Ryzyka i Mitigation:

| Ryzyko                                     | Prawdopodobieństwo | Impact | Mitigation                                                                     |
| ------------------------------------------ | ------------------ | ------ | ------------------------------------------------------------------------------ |
| Rename 65 plików psuje buildy              | MEDIUM             | HIGH   | 1. Backup przed rename 2. Git branch 3. Test lokalnie                          |
| Stare linki w treści artykułów (hardcoded) | HIGH               | MEDIUM | 1. Grep search wszystkich .md 2. Find/replace batch 3. Redirects jako fallback |
| Zewnętrzne backlinki do starych URL        | MEDIUM             | MEDIUM | 1. Check GSC backlinks 2. Utrzymaj stare URL 3-6 mies. 3. Contact webmasters   |
| Template rollout wprowadza błędy           | MEDIUM             | MEDIUM | 1. Manual review pierwszych 5 2. Stopniowy rollout                             |
| Redirects 301 nie działają                 | LOW                | MEDIUM | 1. Test na staging 2. Fallback na canonical                                    |
| Schema errors w Google                     | LOW                | HIGH   | 1. Validator przed deploy 2. Monitoring GSC                                    |
| API overload                               | LOW                | LOW    | 1. Rate limiting 2. Cloudflare cache                                           |

### Rollback Plan:

```bash
# Jeśli coś pójdzie nie tak:
git log --oneline  # znajdź commit przed zmianami
git revert <commit-hash>
git push origin main
# Cloudflare auto-redeploy do poprzedniej wersji
```

---

## 📝 Change Log

| Data       | Wersja | Zmiany                                                                                                        |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 2026-01-16 | 1.0    | Initial plan creation - comprehensive upgrade roadmap                                                         |
| 2026-01-16 | 1.1    | Integracja z planning docs: AI_SEO_AUDIT, RAG_DEPLOYMENT_GUIDE, ARCHITECT_READINESS + definition_of_done.html |

---

## 🎛️ Kontrola Postępu - Jak Używać Tego Planu

### 1. **Interaktywna Checklist**

Otwórz [definition_of_done.html](./planning/definition_of_done.html) w przeglądarce:

- **Sekcje 1-7**: Architecture Readiness (LangGraph, LLM, MoE-RAG, Agenty)
- **Sekcje 8-11**: PUMO Guide Upgrade (Technical, Schema, RAG, Promotion)
- **Sekcja 12**: Podsumowanie końcowe (90% requirement)

### 2. **Tracking Progress**

```bash
# Sprawdź status wszystkich zadań
grep -E "^\- \[ \]" PUMO_GUIDE_UPGRADE_PLAN.md | wc -l  # Pozostałe
grep -E "^\- \[x\]" PUMO_GUIDE_UPGRADE_PLAN.md | wc -l  # Ukończone

# Lub w PowerShell:
Select-String -Path "PUMO_GUIDE_UPGRADE_PLAN.md" -Pattern "- \[ \]" | Measure-Object
Select-String -Path "PUMO_GUIDE_UPGRADE_PLAN.md" -Pattern "- \[x\]" | Measure-Object
```

### 3. **Workflow Rekomendowany**

1. **Rano**: Otwórz definition_of_done.html → wybierz sekcję (np. 8. PUMO Technical)
2. **Implementacja**: Przejdź do odpowiedniej sekcji w tym planie → wykonaj krok po kroku
3. **Po zakończeniu**: Zaznacz checkbox w HTML + w pliku MD (`- [ ]` → `- [x]`)
4. **Wieczorem**: Sprawdź progress w sekcji 12 definition_of_done.html

### 4. **Priorytety (co robić najpierw)**

**Tydzień 1 - Quick Wins**:

- Sekcja 8: llms.txt (30 min) + Content Versioning (2 dni)
- Sekcja 9: FAQPage + Article Schema (1 dzień)
- Sekcja 10: `/pumo-guide/dla-agentow` (2 dni)

**Tydzień 2-3 - Core Implementation**:

- Sekcja 9: Universal Template + Rollout (5-6 dni)
- Sekcja 8: URL Standardization + Redirects (3 dni)
- Sekcja 10: Internal Linking (2 dni)

**Tydzień 4 - RAG & Promotion**:

- Sekcja 10: RAG Chatbot (2h) + Query Logging (1 dzień)
- Sekcja 11: Blog post + jimbo77.org integration (1 dzień)

### 5. **Dependency Graph**

```
Krok 1.4 (llms.txt) → Krok 5.1 (dla-agentow) → Post-Upgrade (blog post)
Krok 2.1 (template) → Krok 2.2 (rollout) → Validation
Krok 3.2 (schema) → Krok 5.2b (RAG chatbot)
```

### 6. **Integration Points**

- **AI_SEO_AUDIT** → Krok 1.4 (llms.txt) + Sekcja 9 (Schema)
- **RAG_DEPLOYMENT** → Krok 5.2b (Chatbot) + Sekcja 10
- **ARCHITECT_READINESS** → Sekcje 1-7 w definition_of_done.html

---

## 👥 Autorzy i Kontakt

**Plan stworzony przez**: GitHub Copilot  
**Data**: 16 stycznia 2026  
**Workspace**: The Yellow Hub / my-bonzo-ai-blog

**Do konsultacji**:

- Technical issues: Sprawdź [ZLOTE_ZASADY_ROZWOJU.md](./ZLOTE_ZASADY_ROZWOJU.md)
- Schema questions: Zobacz [SCHEMA_ORG_VALIDATION.md](./SCHEMA_ORG_VALIDATION.md)
- Deployment: Przeczytaj [PUMO_GUIDE_DEPLOYMENT_INFO.md](./setup/PUMO_GUIDE_DEPLOYMENT_INFO.md)

---

**Status**: 📋 Ready to Execute  
**Next Action**: Start with Week 1 Quick Wins (FAQPage + Article Schema)
