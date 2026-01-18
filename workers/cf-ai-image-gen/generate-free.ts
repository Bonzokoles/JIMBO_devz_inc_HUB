/**
 * FREE Image Generator using Cloudflare Workers AI
 * No billing required! 10,000 neurons/day limit
 */

const WORKER_URL = "https://cf-ai-image-gen.stolarnia-ams.workers.dev";

const BLOG_IMAGES = [
  {
    name: "ai-chat-hero",
    prompt:
      "Modern AI chatbot interface, holographic display, floating chat bubbles, blue and purple gradients, futuristic UI, clean design, professional tech aesthetic, digital particles, glowing connections",
  },
  {
    name: "knowledge-base",
    prompt:
      "Digital library, floating holographic books, glowing data streams, purple and blue lighting, futuristic knowledge repository, AI brain processing information, professional illustration",
  },
  {
    name: "edge-computing",
    prompt:
      "Global network map, glowing connection points, data streams between nodes, purple and orange gradients, distributed network visualization, futuristic tech illustration",
  },
  {
    name: "ai-search",
    prompt:
      "Semantic search visualization, vector embeddings, flowing data particles, blue and teal colors, abstract AI algorithm, neural network processing, modern tech illustration",
  },
];

async function downloadImage(
  base64Data: string,
  filename: string,
): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");

  // Remove data URL prefix
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  const outputDir = "U:/The_yellow_hub/my-bonzo-ai-blog/public/generated";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  ✅ Saved: ${filename}`);
}

async function generateImage(request: any): Promise<void> {
  console.log(`\n🎨 ${request.name}`);
  console.log(`   ${request.prompt.substring(0, 70)}...`);

  try {
    const response = await fetch(`${WORKER_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: request.prompt,
        steps: 20, // Max for free tier
        guidance: 7.5,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log(`   ✨ Generated! (FREE via Workers AI)`);

    await downloadImage(result.image, `${request.name}.png`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 FREE Blog Image Generator");
  console.log("   Cloudflare Workers AI - Stable Diffusion XL");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`Worker: ${WORKER_URL}`);
  console.log(`Images: ${BLOG_IMAGES.length}`);
  console.log(`Cost: $0.00 (FREE tier!)\n`);

  for (const request of BLOG_IMAGES) {
    await generateImage(request);

    // Small delay between requests
    if (BLOG_IMAGES.indexOf(request) < BLOG_IMAGES.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Complete!");
  console.log(
    `📁 Output: U:/The_yellow_hub/my-bonzo-ai-blog/public/generated/`,
  );
  console.log("💰 Total cost: $0.00 (Cloudflare Workers AI FREE!)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch(console.error);
