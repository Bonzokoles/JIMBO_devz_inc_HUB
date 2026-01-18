/**
 * Blog Image Generator - Using Replicate Worker
 * Generates images for blog posts using FLUX models
 */

const WORKER_URL = "https://replicate-image-gen.stolarnia-ams.workers.dev";

// Image prompts for blog sections
const IMAGE_REQUESTS = [
  {
    name: "ai-chat-assistant",
    prompt:
      "Modern AI chatbot interface with holographic display, floating chat bubbles with AI responses, blue and purple neon gradients, futuristic UI elements, clean minimalist design, professional tech aesthetic, digital particles, glowing neural network connections in background, cyberpunk style, high quality 3D render",
    model: "flux-schnell",
  },
  {
    name: "knowledge-base",
    prompt:
      "Digital library with floating holographic books and documents, glowing data streams connecting information nodes, purple and blue ambient lighting, futuristic knowledge repository, AI brain visualizing information processing, clean modern interface, professional tech illustration, cyberpunk aesthetic",
    model: "flux-schnell",
  },
  {
    name: "edge-computing",
    prompt:
      "Global network map with glowing connection points across continents, data streams flowing between nodes, purple and orange gradient color scheme, abstract representation of edge computing, distributed network visualization, futuristic tech illustration, professional quality, clean design",
    model: "flux-schnell",
  },
  {
    name: "ai-powered-search",
    prompt:
      "Semantic search interface with vector embeddings visualization, flowing data particles representing 768-dimensional space, blue and teal color scheme, abstract AI search algorithm visualization, neural network processing queries, modern tech illustration, professional quality",
    model: "flux-pro", // Higher quality for main feature
  },
];

// Wait for prediction to complete
async function waitForPrediction(predictionId: string): Promise<any> {
  const maxAttempts = 60; // 60 seconds max
  const delay = 1000; // 1 second between checks

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${WORKER_URL}/api/status/${predictionId}`);
    const result = await response.json();

    console.log(`  Status: ${result.status} (attempt ${i + 1}/${maxAttempts})`);

    if (result.status === "succeeded") {
      return result;
    }

    if (result.status === "failed") {
      throw new Error(`Prediction failed: ${result.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Prediction timeout");
}

// Download image
async function downloadImage(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fs = await import("fs");
  const path = await import("path");

  const outputDir = "U:/The_yellow_hub/my-bonzo-ai-blog/public/generated";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  ✅ Saved: ${outputPath}`);
}

// Generate single image
async function generateImage(request: any): Promise<void> {
  console.log(`\n🎨 Generating: ${request.name}`);
  console.log(`   Prompt: ${request.prompt.substring(0, 80)}...`);
  console.log(`   Model: ${request.model}`);

  try {
    // Start generation
    const startResponse = await fetch(`${WORKER_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model,
        aspect_ratio: "16:9", // Better for blog headers
        output_quality: 90,
      }),
    });

    const startResult = await startResponse.json();

    if (!startResult.success) {
      throw new Error(startResult.error);
    }

    console.log(`  ⏳ Prediction ID: ${startResult.predictionId}`);
    console.log(`  💰 Estimated cost: $${startResult.estimatedCost}`);

    // Wait for completion
    const result = await waitForPrediction(startResult.predictionId);

    if (result.output && result.output.length > 0) {
      const imageUrl = result.output[0];
      const filename = `${request.name}.png`;

      console.log(`  🖼️  Image URL: ${imageUrl}`);

      // Download image
      await downloadImage(imageUrl, filename);

      console.log(
        `  ⏱️  Generation time: ${result.metrics?.predict_time?.toFixed(2) || "N/A"}s`,
      );
      console.log(`  ✨ Success!`);
    } else {
      throw new Error("No output generated");
    }
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

// Main execution
async function main() {
  console.log("🚀 Blog Image Generator - Replicate AI\n");
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Images to generate: ${IMAGE_REQUESTS.length}\n`);

  let successCount = 0;
  let totalCost = 0;

  for (const request of IMAGE_REQUESTS) {
    try {
      await generateImage(request);
      successCount++;

      // Add cost (approximate)
      const model = request.model;
      if (model === "flux-schnell") totalCost += 0.003;
      if (model === "flux-pro") totalCost += 0.055;
      if (model === "sdxl") totalCost += 0.004;

      // Delay between requests to avoid rate limits
      if (successCount < IMAGE_REQUESTS.length) {
        console.log("\n⏸️  Waiting 5s before next generation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`Failed to generate ${request.name}`);
      // Continue with next image
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Generated: ${successCount}/${IMAGE_REQUESTS.length} images`);
  console.log(`💰 Total cost: ~$${totalCost.toFixed(3)}`);
  console.log(
    `📁 Output: U:/The_yellow_hub/my-bonzo-ai-blog/public/generated/`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch(console.error);
