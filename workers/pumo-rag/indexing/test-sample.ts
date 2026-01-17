// indexing/test-sample.ts
// Testowy pipeline indeksowania produktów PUMO – wersja pod Bun
// Używa wyłącznie API Bun (Bun.file, Bun.write, fetch)
// Mockuje 10 rzeczywistych produktów meblowych PUMO
// Komentarze i TODO do podmiany na realne API

// Interfejs produktu zgodny z CSV
export interface PumoProduct {
  id: string;
  name: string;
  category: string;
  short_desc: string;
  long_desc: string;
  price: number;
  url: string;
  image_url: string;
}

// Mockowane dane 10 produktów PUMO
const mockProducts: PumoProduct[] = [
  {
    id: "1",
    name: "Hoker JAMES",
    category: "Hokery",
    short_desc: "Stylowy hoker do kuchni lub baru.",
    long_desc:
      "Hoker JAMES to połączenie nowoczesnego designu z wygodą. Idealny do wysp kuchennych i barów domowych.",
    price: 399,
    url: "https://pumo.pl/produkt/hoker-james",
    image_url: "https://pumo.pl/images/hoker-james.jpg",
  },
  {
    id: "2",
    name: "Stół dębowy RUSTYK",
    category: "Stoły",
    short_desc: "Solidny stół z litego dębu.",
    long_desc:
      "Stół RUSTYK wykonany z naturalnego drewna dębowego, doskonały do jadalni w stylu rustykalnym.",
    price: 1899,
    url: "https://pumo.pl/produkt/stol-debowy-rustyk",
    image_url: "https://pumo.pl/images/stol-debowy-rustyk.jpg",
  },
  {
    id: "3",
    name: "Krzesło ELEGANCE",
    category: "Krzesła",
    short_desc: "Eleganckie krzesło tapicerowane.",
    long_desc:
      "Krzesło ELEGANCE z miękkim siedziskiem i wysokim oparciem, idealne do salonu lub jadalni.",
    price: 299,
    url: "https://pumo.pl/produkt/krzeslo-elegance",
    image_url: "https://pumo.pl/images/krzeslo-elegance.jpg",
  },
  {
    id: "4",
    name: "Szafa CLASSIC",
    category: "Szafy",
    short_desc: "Pojemna szafa z drzwiami przesuwnymi.",
    long_desc:
      "Szafa CLASSIC oferuje dużo miejsca na ubrania i akcesoria. Klasyczny wygląd pasuje do każdej sypialni.",
    price: 1299,
    url: "https://pumo.pl/produkt/szafa-classic",
    image_url: "https://pumo.pl/images/szafa-classic.jpg",
  },
  {
    id: "5",
    name: "Komoda MODERN",
    category: "Komody",
    short_desc: "Nowoczesna komoda z szufladami.",
    long_desc:
      "Komoda MODERN to funkcjonalny mebel do salonu lub sypialni. Minimalistyczny design i pojemne szuflady.",
    price: 799,
    url: "https://pumo.pl/produkt/komoda-modern",
    image_url: "https://pumo.pl/images/komoda-modern.jpg",
  },
  {
    id: "6",
    name: "Łóżko DREAM",
    category: "Łóżka",
    short_desc: "Komfortowe łóżko dwuosobowe.",
    long_desc:
      "Łóżko DREAM zapewnia wygodny sen dzięki solidnej konstrukcji i nowoczesnemu wyglądowi.",
    price: 1599,
    url: "https://pumo.pl/produkt/lozko-dream",
    image_url: "https://pumo.pl/images/lozko-dream.jpg",
  },
  {
    id: "7",
    name: "Fotel RELAX",
    category: "Fotele",
    short_desc: "Wygodny fotel do salonu.",
    long_desc:
      "Fotel RELAX z miękkim obiciem i ergonomicznym kształtem, idealny do odpoczynku po ciężkim dniu.",
    price: 599,
    url: "https://pumo.pl/produkt/fotel-relax",
    image_url: "https://pumo.pl/images/fotel-relax.jpg",
  },
  {
    id: "8",
    name: "Ława LOFT",
    category: "Ławy",
    short_desc: "Industrialna ława do salonu.",
    long_desc:
      "Ława LOFT łączy metalowe nogi z drewnianym blatem, tworząc niepowtarzalny klimat loftu.",
    price: 499,
    url: "https://pumo.pl/produkt/lawa-loft",
    image_url: "https://pumo.pl/images/lawa-loft.jpg",
  },
  {
    id: "9",
    name: "Regał SMART",
    category: "Regały",
    short_desc: "Praktyczny regał na książki.",
    long_desc:
      "Regał SMART z regulowanymi półkami, idealny do przechowywania książek i dekoracji.",
    price: 349,
    url: "https://pumo.pl/produkt/regal-smart",
    image_url: "https://pumo.pl/images/regal-smart.jpg",
  },
  {
    id: "10",
    name: "Witryna GLASS",
    category: "Witryny",
    short_desc: "Witryna z przeszklonymi drzwiami.",
    long_desc:
      "Witryna GLASS eksponuje zastawę i dekoracje, posiada oświetlenie LED i szklane półki.",
    price: 999,
    url: "https://pumo.pl/produkt/witryna-glass",
    image_url: "https://pumo.pl/images/witryna-glass.jpg",
  },
];

// Funkcja generująca tekst do embeddingu
function productToEmbeddingText(product: PumoProduct): string {
  return `${product.name} | ${product.category} | ${product.short_desc} ${product.long_desc}`;
}

// Mock: generowanie embeddingu 1536D (losowe floaty)
function mockGenerateEmbedding(text: string): number[] {
  // W realnej wersji: wywołanie Workers AI API
  // TODO: Zamienić na realne wywołanie Workers AI API (@cf/baai/bge-base-en-v1.5)
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1); // floaty z zakresu [-1, 1]
}

// Mock: insert do Vectorize
async function mockInsertToVectorize(
  product: PumoProduct,
  embedding: number[],
): Promise<void> {
  // W realnej wersji: wywołanie REST API Vectorize
  // TODO: Zamienić na realny insert do Cloudflare Vectorize
  await Bun.sleep(10); // symulacja opóźnienia
  // Można dodać logowanie do konsoli
  // console.log(`Mock insert: ${product.id} (${product.name})`);
}

// Logowanie postępu do pliku indexing-progress.json
async function logProgress(progress: any) {
  await Bun.write(
    "indexing/indexing-progress.json",
    JSON.stringify(progress, null, 2),
  );
}

// Pipeline testowy
async function main() {
  const progress = {
    total: mockProducts.length,
    indexed: 0,
    errors: [] as { id: string; error: string }[],
    timestamp: new Date().toISOString(),
  };

  for (const product of mockProducts) {
    try {
      const text = productToEmbeddingText(product);
      const embedding = mockGenerateEmbedding(text);
      await mockInsertToVectorize(product, embedding);
      progress.indexed++;
      await logProgress(progress);
    } catch (e) {
      progress.errors.push({ id: product.id, error: (e as Error).message });
      await logProgress(progress);
    }
  }

  // Finalny log
  await logProgress({ ...progress, finished: true });
  console.log(
    "✅ Testowe indeksowanie zakończone. Szczegóły w indexing/indexing-progress.json",
  );
}

main().catch((err) => {
  console.error("❌ Błąd krytyczny:", err);
});

/*
TODO:
1. Zamienić mockGenerateEmbedding na realne wywołanie Workers AI API (@cf/baai/bge-base-en-v1.5) przez fetch
2. Zamienić mockInsertToVectorize na realny insert do Cloudflare Vectorize (REST API lub Wrangler CLI)
3. Obsłużyć autoryzację i tokeny (przez zmienne środowiskowe lub plik konfiguracyjny)
4. Rozszerzyć pipeline o batch processing i retry logic (w index-products.ts)
5. Użyć tego pliku jako testu pipeline przed uruchomieniem na pełnych danych
*/
