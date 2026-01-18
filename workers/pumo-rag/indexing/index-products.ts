// indexing/index-products.ts

// Load .env file for credentials using Bun native method
import { resolve } from "path";
import { readFileSync } from "fs";
const dotenvPath = resolve(import.meta.dir, ".env");
const envContent = readFileSync(dotenvPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...valueParts] = trimmed.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}
console.log(
  "✅ Loaded env vars:",
  Object.keys(process.env).filter((k) => k.startsWith("CLOUDFLARE")),
);

import { PumoProduct, IndexingProgress, BatchResult } from "./types";
import {
  parseCSV,
  batchArray,
  retry,
  generateEmbedding,
  insertToVectorize,
} from "./utils";
import { readdirSync } from "fs";

// --- CONFIG ---
const CONFIG = {
  // Resolved relative to this script directory (workers/pumo-rag/indexing)
  CHUNKS_DIR: resolve(import.meta.dir, "../../../../docs/PUMO/chunks"),
  PROGRESS_FILE: resolve(
    import.meta.dir,
    "../../../../docs/PUMO/indexing_progress.json",
  ),
  BATCH_SIZE: 10, // Reduced from 50 for better rate limiting
  MAX_RETRIES: 2, // Reduced from 3 (generateEmbedding has its own retry)
  ACCOUNT_ID: Bun.env.CLOUDFLARE_ACCOUNT_ID || "",
  API_TOKEN: Bun.env.CLOUDFLARE_API_TOKEN || "",
};

// --- PROGRESS MANAGEMENT ---
async function loadProgress(): Promise<IndexingProgress> {
  const file = Bun.file(CONFIG.PROGRESS_FILE);
  if (await file.exists()) {
    const data = await file.json();
    return data as IndexingProgress;
  }
  return {
    totalProducts: 0,
    indexedProducts: 0,
    processedChunks: [],
    currentChunk: null,
    errors: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function saveProgress(progress: IndexingProgress): Promise<void> {
  await Bun.write(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// --- BATCH PROCESSING ---
async function processBatch(
  products: PumoProduct[],
  batchIndex: number,
  chunkName: string,
): Promise<BatchResult> {
  console.log(`  📦 Batch ${batchIndex + 1}: ${products.length} products`);
  try {
    // 1. Generuj embeddingi dla batcha
    const embeddings: number[][] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const text = `${product.name} | ${product.category} | ${product.short_desc} ${product.long_desc}`;
      const embedding = await retry(
        () => generateEmbedding(text),
        CONFIG.MAX_RETRIES,
      );
      embeddings.push(embedding);

      // Delay between embeddings to avoid rate limiting (Workers AI: 100 req/min)
      if (i < products.length - 1) {
        await Bun.sleep(1000); // 1000ms = safe 60 req/min, avoids rate limit spikes
      }
    }
    // 2. Insert batch do Vectorize
    await retry(
      () => insertToVectorize(products, embeddings),
      CONFIG.MAX_RETRIES,
    );
    return {
      success: true,
      count: products.length,
      chunkName,
      batchIndex,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      chunkName,
      batchIndex,
      error: (error as Error).message,
    };
  }
}

// --- CHUNK PROCESSING ---
async function processChunk(
  chunkPath: string,
  chunkName: string,
  progress: IndexingProgress,
): Promise<void> {
  console.log(`📄 Processing chunk: ${chunkName}`);
  // 1. Parsuj CSV
  const products = await parseCSV(chunkPath);
  console.log(`  Found ${products.length} products`);
  // 2. Batchuj produkty
  const batches = batchArray(products, CONFIG.BATCH_SIZE);
  console.log(`  Split into ${batches.length} batches`);
  // 3. Przetwarzaj batch'e
  for (let i = 0; i < batches.length; i++) {
    const result = await processBatch(batches[i], i, chunkName);
    if (result.success) {
      progress.indexedProducts += result.count;
    } else {
      progress.errors.push({
        chunk: chunkName,
        batch: i,
        error: result.error || "Unknown error",
      });
    }
    progress.lastUpdatedAt = new Date().toISOString();
    await saveProgress(progress);
  }
  progress.processedChunks.push(chunkName);
  console.log(
    `✅ Chunk ${chunkName} complete: ${products.length} products indexed`,
  );
}

// --- MAIN PIPELINE ---
async function main() {
  console.log("🚀 Starting PUMO products indexing...\n");
  // 1. Wczytaj postęp (resume capability)
  const progress = await loadProgress();
  console.log(
    `📊 Loaded progress: ${progress.indexedProducts}/${progress.totalProducts} indexed\n`,
  );
  // 2. Znajdź wszystkie pliki CSV w katalogu chunks
  const allFiles = readdirSync(CONFIG.CHUNKS_DIR);
  const chunkFiles = allFiles
    .filter((f) => f.endsWith(".csv"))
    .sort()
    .map((f) => `${CONFIG.CHUNKS_DIR}/${f}`);
  console.log(`📂 Found ${chunkFiles.length} chunk files\n`);
  // 3. Przetwarzaj każdy chunk
  for (const chunkPath of chunkFiles) {
    const chunkName = chunkPath.split("/").pop() || "";
    // Pomijaj już przetworzone chunki
    if (progress.processedChunks.includes(chunkName)) {
      console.log(`⏭️  Skipping ${chunkName} (already processed)\n`);
      continue;
    }
    progress.currentChunk = chunkName;
    await saveProgress(progress);
    await processChunk(chunkPath, chunkName, progress);
  }
  // 4. Podsumowanie
  console.log("\n✅ INDEXING COMPLETE!");
  console.log(`📊 Total indexed: ${progress.indexedProducts} products`);
  console.log(`❌ Errors: ${progress.errors.length}`);
  if (progress.errors.length > 0) {
    console.log("\nErrors:");
    progress.errors.forEach((e) =>
      console.log(`  - ${e.chunk} batch ${e.batch}: ${e.error}`),
    );
  }
}

main().catch((err) => {
  console.error("❌ Critical error:", err);
  process.exit(1);
});
