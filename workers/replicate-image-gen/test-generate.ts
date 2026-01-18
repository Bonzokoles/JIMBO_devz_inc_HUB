/**
 * Single Test Image Generator
 * Generates one test image to verify setup
 */

const WORKER_URL = "https://replicate-image-gen.stolarnia-ams.workers.dev";

async function waitForPrediction(predictionId: string): Promise<any> {
  const maxAttempts = 60;
  const delay = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${WORKER_URL}/api/status/${predictionId}`);
    const result = await response.json();

    console.log(`  [${i + 1}/${maxAttempts}] Status: ${result.status}`);

    if (result.status === "succeeded") {
      return result;
    }

    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(
        `Prediction ${result.status}: ${result.error || "Unknown error"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Prediction timeout after 2 minutes");
}

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
  console.log(`✅ Image saved: ${outputPath}`);
}

async function main() {
  console.log("\n🎨 Single Test Image Generator\n");

  const prompt =
    "Modern AI technology background with purple and blue gradients, abstract neural network visualization, glowing data particles, professional tech illustration, high quality, clean design";

  console.log(`Prompt: ${prompt.substring(0, 80)}...`);
  console.log(`Model: flux-schnell (fastest, cheapest)`);
  console.log("");

  try {
    // Start generation
    console.log("📤 Starting image generation...");
    const startResponse = await fetch(`${WORKER_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: "flux-schnell",
        aspect_ratio: "16:9",
        output_quality: 80,
      }),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`HTTP ${startResponse.status}: ${errorText}`);
    }

    const startResult = await startResponse.json();

    if (!startResult.success) {
      throw new Error(startResult.error || "Failed to start generation");
    }

    console.log(`✅ Prediction started: ${startResult.predictionId}`);
    console.log(`💰 Estimated cost: $${startResult.estimatedCost}`);
    console.log("");

    // Wait for completion
    console.log("⏳ Waiting for image generation (max 2 minutes)...\n");
    const result = await waitForPrediction(startResult.predictionId);

    if (result.output && result.output.length > 0) {
      const imageUrl = result.output[0];
      console.log(`\n🖼️  Image URL: ${imageUrl}`);
      console.log(
        `⏱️  Generation time: ${result.metrics?.predict_time?.toFixed(2) || "N/A"}s`,
      );

      // Download
      await downloadImage(imageUrl, "test-ai-background.png");

      console.log(
        "\n✨ Success! Check U:/The_yellow_hub/my-bonzo-ai-blog/public/generated/\n",
      );
    } else {
      throw new Error("No output generated");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);

    if (error.message.includes("402")) {
      console.log("💳 Insufficient Replicate credits. Add credits at:");
      console.log("   https://replicate.com/account/billing\n");
    } else if (error.message.includes("429")) {
      console.log("⏰ Rate limit hit. Free tier: 50 predictions/month, 6/min");
      console.log("   Wait a minute and try again, or upgrade at:");
      console.log("   https://replicate.com/pricing\n");
    }

    process.exit(1);
  }
}

main();
