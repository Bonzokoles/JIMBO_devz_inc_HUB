// indexing/utils.ts
// Helper functions for PUMO products indexing pipeline

import { PumoProduct } from "./types";
import { resolve } from "path";

// --- CSV PARSER ---
// --- CSV PARSER (Robust State Machine) ---
// Robust CSV parser that handles broken quotes by resetting on new ID lines
export async function parseCSV(filePath: string): Promise<PumoProduct[]> {
  const content = await Bun.file(filePath).text();
  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];
  let currentRowLines: string[] = [];

  // Helper to parse a BLOCK of lines as a single CSV row
  const parseBlock = (blockLines: string[]) => {
    const text = blockLines.join("\n");
    const row: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    return row;
  };

  const idRegex = /^"\d+",/;
  const headerRegex = /^@id,/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const isNewRecord = idRegex.test(line) || headerRegex.test(line);

    if (isNewRecord) {
      if (currentRowLines.length > 0) {
        rows.push(parseBlock(currentRowLines));
      }
      currentRowLines = [line];
    } else {
      currentRowLines.push(line);
    }
  }
  if (currentRowLines.length > 0) {
    rows.push(parseBlock(currentRowLines));
  }

  const products: PumoProduct[] = [];
  // Skip header (row 0)
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];

    // Core check: must have enough columns and at least a name
    if (cols.length < 186 || !cols[185]) continue;

    products.push({
      id: cols[0].replace(/"/g, ""), // Clean ID
      name: cols[185],
      category: cols[7],
      short_desc: cols[186],
      long_desc: cols[187],
      price: parseFloat(cols[14]) || 0,
      url: cols[107],
      image_url: cols[111],
      // TODO: extract other fields if needed
    });
  }
  console.log(`  Parsed ${products.length} products from ${filePath}`);
  return products;
}

// --- ARRAY BATCHER ---
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  // TODO: Split array into chunks of batchSize
  // Example: [1,2,3,4,5] with batchSize=2 → [[1,2], [3,4], [5]]

  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// --- RETRY WITH EXPONENTIAL BACKOFF ---
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  // TODO: Implement retry with exponential backoff
  // Delays: 100ms, 200ms, 400ms, 800ms, etc.

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = 100 * Math.pow(2, attempt);
        console.log(
          `  ⚠️  Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`,
        );
        await Bun.sleep(delay);
      }
    }
  }

  throw lastError;
}

// --- GENERATE EMBEDDING (Workers AI) ---
export async function generateEmbedding(text: string): Promise<number[]> {
  // Używa Worker endpoint /api/embed zamiast bezpośredniego REST API
  // Worker ma AI binding więc nie wymaga dodatkowych uprawnień tokena
  const WORKER_URL = "https://pumo-rag.stolarnia-ams.workers.dev/api/embed";

  // Single try - retry is handled at batch level in processBatch()
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Worker embed API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as any;
  if (!data.success || !data.result?.data?.[0]) {
    throw new Error(`Invalid embed response format: ${JSON.stringify(data)}`);
  }

  return data.result.data[0]; // 768-dimensional array
}

// --- INSERT TO VECTORIZE ---
// Wysyła embeddingi przez Worker endpoint który używa VECTORIZE binding
export async function insertToVectorize(
  products: PumoProduct[],
  embeddings: number[][],
): Promise<void> {
  const WORKER_URL =
    "https://pumo-rag.stolarnia-ams.workers.dev/api/vectorize/insert";

  // Tworzymy strukturę zgodną z Vectorize API format
  const vectors = products.map((product, index) => ({
    id: product.id,
    values: embeddings[index],
    metadata: {
      name: product.name,
      category: product.category,
      short_desc: product.short_desc,
      price: String(product.price),
      url: product.url,
      image_url: product.image_url,
    },
  }));

  // Wyślij do Worker który używa VECTORIZE binding
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vectors }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Worker vectorize API error: ${response.status} ${errText}`,
    );
  }

  const result = (await response.json()) as any;
  if (!result.success) {
    throw new Error(
      `Vectorize insert failed: ${JSON.stringify(result.errors || result)}`,
    );
  }

  console.log(`    ✅ Uploaded ${vectors.length} vectors to Vectorize`);
}
