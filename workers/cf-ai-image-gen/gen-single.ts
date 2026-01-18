/**
 * Single image generator - safer for Workers AI
 */

const WORKER_URL = "https://cf-ai-image-gen.stolarnia-ams.workers.dev";

const prompt = process.argv[2] || "Modern tech background";
const filename = process.argv[3] || "test.png";

console.log(`\n🎨 Generating: ${filename}`);
console.log(`📝 Prompt: ${prompt}\n`);

try {
  const response = await fetch(`${WORKER_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: 20, guidance: 7.5 }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  // Save image
  const base64 = result.image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  const fs = await import("fs");
  const outputPath = `U:/The_yellow_hub/my-bonzo-ai-blog/public/generated/${filename}`;
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Saved: ${outputPath}`);
  console.log(`💰 Cost: $0.00 (FREE!)\n`);
} catch (error) {
  console.error(`❌ Error: ${error.message}\n`);
  process.exit(1);
}
