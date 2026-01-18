/**
 * Simple test - save response directly as file
 */

const WORKER_URL = "https://cf-ai-image-gen.stolarnia-ams.workers.dev";

console.log("\n🎨 Testing image generation and save...\n");

const response = await fetch(`${WORKER_URL}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "purple and blue tech background",
    steps: 20,
  }),
});

const result = await response.json();
console.log("Response:", result.success ? "✅ Success" : "❌ Failed");

if (!result.success) {
  console.error("Error:", result.error);
  process.exit(1);
}

console.log("Image data length:", result.image.length);
console.log("First 50 chars:", result.image.substring(0, 50));

// Save using different method
const fs = await import("fs");
const base64Data = result.image.replace(/^data:image\/\w+;base64,/, "");

console.log("\nBase64 length (after strip):", base64Data.length);

// Write directly
const buffer = Buffer.from(base64Data, "base64");
console.log("Buffer size:", buffer.length, "bytes");

const outputPath =
  "U:/The_yellow_hub/my-bonzo-ai-blog/public/generated/test-direct.png";
fs.writeFileSync(outputPath, buffer);

const stat = fs.statSync(outputPath);
console.log(`\n✅ Saved: ${stat.size} bytes\n`);
