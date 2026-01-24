#!/usr/bin/env bun
/**
 * Cleanup & Reindex Script
 * 1. Deletes all existing vectors from Vectorize
 * 2. Runs full reindexing with UTF-8 encoding fix
 */

import { resolve } from "path";
import { readFileSync, readdirSync } from "fs";

// Load .env
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

const WORKER_URL = "https://pumo-rag.stolarnia-ams.workers.dev";
const CHUNKS_DIR = resolve(import.meta.dir, "../../../../docs/PUMO/chunks");

async function getAllProductIds(): Promise<string[]> {
  console.log("📂 Scanning chunks for product IDs...");
  const files = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith(".csv"));
  const ids: string[] = [];

  for (const file of files) {
    const filePath = resolve(CHUNKS_DIR, file);
    const content = await Bun.file(filePath).text();
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const match = line.match(/^"(\d+)",/);
      if (match) {
        ids.push(match[1]);
      }
    }
  }

  console.log(`  Found ${ids.length} product IDs`);
  return ids;
}

async function deleteVectors(ids: string[]): Promise<void> {
  console.log(`🗑️  Deleting ${ids.length} vectors from Vectorize...`);

  const BATCH_SIZE = 100; // Delete in batches to avoid timeout
  let deleted = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(`${WORKER_URL}/api/vectorize/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: batch }),
      });

      if (!response.ok) {
        throw new Error(`Delete API error: ${response.status}`);
      }

      const result = await response.json();
      deleted += result.result.count;

      console.log(
        `  Progress: ${deleted}/${ids.length} (${Math.round((deleted / ids.length) * 100)}%)`,
      );

      // Rate limiting
      await Bun.sleep(100);
    } catch (error) {
      console.error(`  ❌ Error deleting batch ${i}-${i + BATCH_SIZE}:`, error);
    }
  }

  console.log(`✅ Deleted ${deleted} vectors`);
}

async function main() {
  console.log("🚀 Starting cleanup & reindex...\n");

  // Step 1: Get all product IDs
  const ids = await getAllProductIds();

  // Step 2: Delete all vectors
  await deleteVectors(ids);

  console.log("\n✅ Cleanup complete!");
  console.log("\n📦 Now run: bun run indexing/index-products.ts");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
