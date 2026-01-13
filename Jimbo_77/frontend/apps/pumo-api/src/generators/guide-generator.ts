import { Env } from '../types';

interface GuideMetadata {
  title: string;
  description: string;
  category: string;
  products: string[];
  generated_at: string;
}

export class GuideGenerator {
  constructor(private env: Env) {}

  async generateAllGuides(): Promise<Map<string, string>> {
    console.log('📚 Generating AI-optimized buying guides...');
    
    const guides = new Map<string, string>();
    
    // Get categories
    const { results: categories } = await this.env.DB.prepare(`
      SELECT DISTINCT category 
      FROM products 
      WHERE category IS NOT NULL
      ORDER BY category
    `).all();

    console.log(`Found ${categories.length} categories`);

    for (const cat of categories) {
      const category = cat.category as string;
      const guide = await this.generateCategoryGuide(category);
      
      const path = `/guides/${this.slugify(category)}`;
      guides.set(path, guide);
      
      // Cache guide
      await this.env.CACHE.put(`guide:${path}`, guide, {
        expirationTtl: 604800 // 7 days
      });
    }

    // Generate main buying guide index
    const indexGuide = await this.generateIndexGuide(Array.from(guides.keys()));
    guides.set('/guides/index', indexGuide);
    await this.env.CACHE.put('guide:/guides/index', indexGuide, {
      expirationTtl: 604800
    });

    console.log(`✅ Generated ${guides.size} guides`);
    return guides;
  }

  private async generateCategoryGuide(category: string): Promise<string> {
    console.log(`📝 Generating guide for: ${category}`);

    // Get top products in category
    const { results: products } = await this.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.description, p.price, 
        p.price_before_discount, p.url, p.image_url
      FROM products p
      WHERE p.category = ?
      ORDER BY p.price DESC
      LIMIT 20
    `).bind(category).all();

    if (products.length === 0) {
      return this.generateEmptyGuide(category);
    }

    // Use WHITECAT MOA for guide generation
    const { WhitecatMOA } = await import('./whitecat-moa');
    const whitecat = new WhitecatMOA(this.env);

    const prompt = this.buildGuidePrompt(category, products);
    const guideContent = await whitecat.generate(prompt, 'guide_generation');

    const metadata: GuideMetadata = {
      title: `Przewodnik zakupowy: ${category}`,
      description: `Kompleksowy przewodnik po ${category} - porównanie, porady, najlepsze produkty`,
      category,
      products: products.map(p => p.id as string),
      generated_at: new Date().toISOString()
    };

    return this.formatGuide(metadata, guideContent, products);
  }

  private buildGuidePrompt(category: string, products: any[]): string {
    const productList = products.map((p, i) => 
      `${i + 1}. ${p.name} - ${p.price} zł${p.price_before_discount ? ` (przed: ${p.price_before_discount} zł)` : ''}`
    ).join('\n');

    return `
Jesteś ekspertem w kategorii: ${category}

ZADANIE: Napisz kompleksowy przewodnik zakupowy dla tej kategorii.

DOSTĘPNE PRODUKTY:
${productList}

STRUKTURA PRZEWODNIKA:
1. Wprowadzenie (2-3 zdania o kategorii)
2. Na co zwrócić uwagę przy zakupie (5-7 kluczowych kryteriów)
3. TOP 5 Rekomendacji (z konkretnych produktów powyżej)
   - Dla każdego: nazwa, cena, główne zalety, dla kogo
4. Porównanie przedziałów cenowych
5. Częste pytania (FAQ) - 5 pytań z odpowiedziami
6. Podsumowanie i finalne wskazówki

WYMAGANIA:
- Język: Polski
- Ton: Przyjazny, ekspercki, pomocny
- Długość: 800-1200 słów
- Format: Markdown
- SEO: Naturalne użycie słów kluczowych
- Praktyczne porady bez zbędnego marketingu
- Konkretne odwołania do produktów z listy

Generuj TYLKO treść przewodnika w Markdown. Bez meta-komentarzy.
`;
  }

  private generateTrackedLink(product: any, category: string): string {
    const slug = this.slugify(category);
    const separator = product.url.includes('?') ? '&' : '?';
    return `${product.url}${separator}utm_source=mybonzo&utm_medium=ai_guide&utm_campaign=buying_guide_${slug}`;
  }

  private formatGuide(metadata: GuideMetadata, content: string, products: any[]): string {
    const trackingScript = `
<script>
  (function() {
    const trackEvent = (eventType, data) => {
      const payload = {
        name: eventType,
        params: {
          ...data,
          utm_source: 'mybonzo',
          guide_category: '${metadata.category}'
        }
      };
      
      try {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Tracking failed', err));
      } catch (e) {}
    };

    trackEvent('guide_view', { title: '${metadata.title}' });

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.cta-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                trackEvent('click', {
                    product_id: e.target.getAttribute('data-product-id'),
                    product_name: e.target.getAttribute('data-product-name')
                });
            });
        });
    });
  })();
</script>
<style>
  .cta-button {
    display: inline-block;
    background-color: #00ff41;
    color: #000;
    padding: 10px 20px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
    margin-top: 10px;
    transition: background-color 0.2s;
  }
  .cta-button:hover {
    background-color: #00cc33;
    text-decoration: none;
    color: #000;
  }
</style>
`;

    return `---
title: ${metadata.title}
description: ${metadata.description}
category: ${metadata.category}
products_count: ${products.length}
generated_at: ${metadata.generated_at}
source: WHITECAT MOA v1.0
---

# ${metadata.title}

${content}

---

## Produkty w tym przewodniku

${products.map((p, i) => {
  const trackedUrl = this.generateTrackedLink(p, metadata.category);
  return `
### ${i + 1}. ${p.name}

**Cena:** ${p.price} zł${p.price_before_discount ? ` ~~${p.price_before_discount} zł~~` : ''}

${p.description ? p.description.substring(0, 200) + '...' : ''}

<a href="${trackedUrl}" class="cta-button" data-product-id="${p.id}" data-product-name="${p.name.replace(/"/g, '&quot;')}">
  🛒 Zobacz w sklepie
</a>
`;
}).join('\n')}

---

${trackingScript}

*Przewodnik wygenerowany przez WHITECAT AI (MOA: DeepSeek-V3 + Claude-3.7 + GPT-4) w dniu ${new Date(metadata.generated_at).toLocaleDateString('pl-PL')}*

*Dane produktowe aktualizowane codziennie. Ostatnia aktualizacja: ${new Date().toLocaleDateString('pl-PL')}*
`;
  }

  private generateEmptyGuide(category: string): string {
    return `---
title: ${category}
status: empty
---

# ${category}

Przewodnik dla tej kategorii jest obecnie w przygotowaniu.

Wróć wkrótce, aby znaleźć kompletne porady zakupowe!
`;
  }

  private async generateIndexGuide(guidePaths: string[]): Promise<string> {
    return `---
title: Wszystkie przewodniki zakupowe Meble Pumo
description: Kompletna lista przewodników zakupowych
type: index
generated_at: ${new Date().toISOString()}
---

# 📚 Przewodniki Zakupowe Meble Pumo

Witaj w centrum wiedzy o meblach! Nasze przewodniki pomogą Ci wybrać idealne meble do Twojego wnętrza.

## Dostępne kategorie

${guidePaths.filter(p => p !== '/guides/index').map(path => {
  const category = path.replace('/guides/', '').replace(/-/g, ' ');
  return `- [${category}](${path})`;
}).join('\n')}

---

## Jak korzystać z przewodników?

1. **Wybierz kategorię** - Znajdź typ mebla, który Cię interesuje
2. **Przeczytaj porady** - Dowiedz się, na co zwrócić uwagę
3. **Zobacz rekomendacje** - Sprawdź nasze TOP 5 produktów
4. **Porównaj** - Oceń produkty w różnych przedziałach cenowych
5. **Kup z pewnością** - Podejmij świadomą decyzję zakupową

## O przewodnikach

Wszystkie przewodniki są:
- ✅ Generowane przez zaawansowane AI (WHITECAT MOA)
- ✅ Aktualizowane codziennie
- ✅ Oparte na rzeczywistych produktach z naszej oferty
- ✅ Pisane w przystępny i praktyczny sposób
- ✅ Zoptymalizowane pod kątem wyszukiwarek AI

---

*Powered by MyBonzo AI | WHITECAT v1.0*
`;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
