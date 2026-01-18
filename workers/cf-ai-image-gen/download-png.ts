/**
 * Simple PNG downloader - Worker returns binary directly
 */

const WORKER_URL = "https://cf-ai-image-gen.stolarnia-ams.workers.dev";
const prompt = process.argv[2] || "purple tech background";
const filename = process.argv[3] || "test.png";

console.log(`\n🎨 ${filename}`);
console.log(`📝 ${prompt.substring(0, 60)}...\n`);

const response = await fetch(`${WORKER_URL}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, steps: 20, guidance: 7.5 }),
});

if (!response.ok) {
  console.error(`❌ HTTP ${response.status}: ${await response.text()}`);
  process.exit(1);
}

const buffer = Buffer.from(await response.arrayBuffer());
console.log(`✅ Received: ${buffer.length} bytes`);

const fs = await import("fs");
const outputPath = `U:/The_yellow_hub/my-bonzo-ai-blog/public/generated/${filename}`;
fs.writeFileSync(outputPath, buffer);

const size = fs.statSync(outputPath).size;
console.log(`💾 Saved: ${(size / 1024).toFixed(2)}KB`);
console.log(`📁 ${outputPath}\n`);
