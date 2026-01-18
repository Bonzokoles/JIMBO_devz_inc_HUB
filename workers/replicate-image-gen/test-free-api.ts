/**
 * Direct Replicate API Test - Free Tier Models
 * Uses free models available without billing
 */

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || "";

// Free tier model - Stable Diffusion v1.5 (always free)
const FREE_MODEL =
  "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf";

async function testFreeGeneration() {
  console.log("\n🎨 Testing Replicate Free Tier\n");
  console.log("Model: Stable Diffusion v1.5 (free)");
  console.log('Prompt: "purple and blue tech background"\n');

  try {
    // Step 1: Create prediction
    console.log("📤 Creating prediction...");
    const createResponse = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: FREE_MODEL,
          input: {
            prompt:
              "purple and blue abstract tech background, modern AI visualization, digital particles",
            width: 512,
            height: 512,
          },
        }),
      },
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`❌ HTTP ${createResponse.status}: ${errorText}`);

      if (createResponse.status === 402) {
        console.log(
          "\n💡 Solution: Replicate needs billing info even for free tier",
        );
        console.log(
          "   Add payment method at: https://replicate.com/account/billing",
        );
        console.log("   Free tier: First $0.006 per prediction is free\n");
      }

      return;
    }

    const prediction = await createResponse.json();
    console.log(`✅ Prediction created: ${prediction.id}`);
    console.log(`Status: ${prediction.status}\n`);

    // Step 2: Poll for result
    console.log("⏳ Waiting for completion...\n");
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_TOKEN}`,
          },
        },
      );

      const status = await statusResponse.json();
      attempts++;

      console.log(`[${attempts}/${maxAttempts}] Status: ${status.status}`);

      if (status.status === "succeeded") {
        console.log(`\n✨ Success!\n`);
        console.log(`Image URL: ${status.output[0]}`);
        console.log(`Generation time: ${status.metrics.predict_time}s\n`);

        // Download image
        const imageResponse = await fetch(status.output[0]);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());

        const fs = await import("fs");
        const outputPath =
          "U:/The_yellow_hub/my-bonzo-ai-blog/public/test-free-replicate.png";
        fs.writeFileSync(outputPath, buffer);

        console.log(`💾 Saved: ${outputPath}\n`);
        return;
      }

      if (status.status === "failed") {
        console.log(`\n❌ Generation failed: ${status.error}\n`);
        return;
      }
    }

    console.log("\n⏰ Timeout after 2 minutes\n");
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
  }
}

testFreeGeneration();
