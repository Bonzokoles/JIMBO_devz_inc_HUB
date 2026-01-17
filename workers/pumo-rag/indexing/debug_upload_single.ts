
import { resolve } from "path";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";

async function debugUpload() {
  const filePath = resolve("U:/The_yellow_hub/docs/PUMO/embeddings/batch_1768640340069.json");
  console.log(`Reading ${filePath}...`);
  const content = JSON.parse(readFileSync(filePath, "utf-8"));
  
  const vector = content.vectors[0];
  // Sanitize metadata like in the main script
  vector.metadata = {
      name: String(vector.metadata.name || ""),
      category: String(vector.metadata.category || ""),
      short_desc: String(vector.metadata.short_desc || ""),
      price: String(vector.metadata.price || "0"),
      url: String(vector.metadata.url || ""),
      image_url: String(vector.metadata.image_url || "")
  };

  const ndjson = JSON.stringify(vector);
  const tempFile = resolve("temp_debug.ndjson");
  writeFileSync(tempFile, ndjson);
  console.log(`Created temp file: ${tempFile}`);

  try {
      console.log("Running wrangler insert...");
      // Using npx wrangler ...
      const output = execSync(`npx wrangler vectorize insert pumo-products --file="${tempFile}"`, {
          cwd: "U:/The_yellow_hub/JIMBO_devz_inc_HUB/workers/pumo-rag", // must be in worker dir for wrangler.toml
          encoding: "utf-8"
      });
      console.log("Success!");
      console.log(output);
  } catch (e: any) {
      console.error("Wrangler failed:");
      console.error(e.message);
      console.error(e.stdout);
      console.error(e.stderr);
  } finally {
     // unlinkSync(tempFile);
  }
}

debugUpload();
