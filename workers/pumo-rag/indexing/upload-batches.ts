
import { resolve, join, basename } from "path";
import { readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { createHash } from "crypto";

// CONFIGURATION
const CONFIG = {
  // Directory where batch_*.json files are located
  INPUT_DIR: resolve(import.meta.dir, "../../../../docs/PUMO/embeddings"),
  // Directory to move processed files
  DONE_DIR: resolve(import.meta.dir, "../../../../docs/PUMO/embeddings/done"),
  // Number of batch files to aggregate per upload (50 products per file * 20 = 1000 vectors)
  FILES_PER_UPLOAD: 20,
  // Wrangler command working directory (must contain wrangler.toml)
  WRANGLER_CWD: resolve(import.meta.dir, "../"),
  INDEX_NAME: "pumo-products"
};

// Main function
async function main() {
  console.log("🚀 Starting PUMO Wrangler Uploader...");
  console.log(`📂 Input Dir: ${CONFIG.INPUT_DIR}`);
  console.log(`📂 Done Dir:  ${CONFIG.DONE_DIR}`);
  console.log(`🛠️  Wrangler Dir: ${CONFIG.WRANGLER_CWD}`);

  // Ensure directories exist
  if (!existsSync(CONFIG.DONE_DIR)) {
    mkdirSync(CONFIG.DONE_DIR, { recursive: true });
  }

  // Get all batch files
  const allFiles = readdirSync(CONFIG.INPUT_DIR)
    .filter(f => f.startsWith("batch_") && f.endsWith(".json"))
    .sort(); // Sort to process in order (approx)

  if (allFiles.length === 0) {
    console.log("Example files not found. Nothing to upload.");
    return;
  }

  console.log(`📊 Found ${allFiles.length} batch files to process.`);

  // Process in chunks
  let totalUploaded = 0;
  let batchIndex = 0;

  for (let i = 0; i < allFiles.length; i += CONFIG.FILES_PER_UPLOAD) {
    batchIndex++;
    const filesChunk = allFiles.slice(i, i + CONFIG.FILES_PER_UPLOAD);
    console.log(`\n📦 Processing Chunk ${batchIndex} (${filesChunk.length} files, ${i + 1}-${Math.min(i + CONFIG.FILES_PER_UPLOAD, allFiles.length)} of ${allFiles.length})...`);
    
    // 1. Aggregate and Convert to NDJSON
    const aggregatedVectors: string[] = [];
    const filesToMove: string[] = [];

    for (const filename of filesChunk) {
      const filePath = join(CONFIG.INPUT_DIR, filename);
      try {
        const content = JSON.parse(readFileSync(filePath, "utf-8"));
        
        if (content.vectors && Array.isArray(content.vectors)) {
          for (const v of content.vectors) {
            // Validate and Sanitize
            if (!v.id || !v.values) continue;
            
            let finalId = String(v.id);
            if (Buffer.byteLength(finalId) > 64) {
                // Determine if we should warn
                // console.warn(`    ⚠️ ID too long (${finalId.length} chars), hashing: ${finalId.substring(0, 20)}...`);
                finalId = createHash("sha256").update(finalId).digest("hex");
            }

            // Ensure metadata values are strings (Vectorize Requirement)
            const cleanMetadata = {
              name: String(v.metadata?.name || ""),
              category: String(v.metadata?.category || ""),
              short_desc: String(v.metadata?.short_desc || ""),
              price: String(v.metadata?.price || "0"),
              url: String(v.metadata?.url || ""),
              image_url: String(v.metadata?.image_url || "")
            };

            const ndjsonLine = JSON.stringify({
              id: finalId,
              values: v.values,
              metadata: cleanMetadata
            });
            
            aggregatedVectors.push(ndjsonLine);
          }
        }
        filesToMove.push(filename);
      } catch (err) {
        console.error(`❌ Error reading ${filename}:`, err);
        // Continue to skip bad files
      }
    }

    if (aggregatedVectors.length === 0) {
      console.warn("⚠️ Chunk resulted in 0 valid vectors. Skipping upload.");
      continue;
    }

    // 2. Write Temp NDJSON
    const tempFile = resolve(CONFIG.WRANGLER_CWD, `temp_upload_chunk_${batchIndex}.ndjson`);
    writeFileSync(tempFile, aggregatedVectors.join("\n"));
    
    // 3. Upload via Wrangler
    try {
      console.log(`    📤 Uploading ${aggregatedVectors.length} vectors via Wrangler...`);
      // Using execSync to block until done. 
      execSync(`npx wrangler vectorize insert ${CONFIG.INDEX_NAME} --file="${tempFile}"`, {
        cwd: CONFIG.WRANGLER_CWD,
        stdio: 'inherit' // Pipe output directly so we see errors immediately
      });

      console.log("    ✅ Upload Successful!");

      // 4. Cleanup and Move Files
      for (const file of filesToMove) {
        const src = join(CONFIG.INPUT_DIR, file);
        const dest = join(CONFIG.DONE_DIR, file);
        renameSync(src, dest);
      }
      totalUploaded += aggregatedVectors.length;
      
      // Cleanup temp file
      unlinkSync(tempFile);

    } catch (err: any) {
      console.error("    🛑 Upload Failed!");
      // Proceed to next block? No, exit to let user fix.
      process.exit(1);
    }
  }

  console.log(`\n🎉 FINISHED! Total uploaded vectors: ${totalUploaded}`);
}

main().catch(console.error);
