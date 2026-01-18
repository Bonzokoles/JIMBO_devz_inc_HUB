/**
 * Cloudflare Workers AI Image Generator
 * Uses @cf/stabilityai/stable-diffusion-xl-base-1.0 - FREE!
 * 10,000 neurons/day limit
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://mybonzoaiblog.pages.dev",
      "https://mybonzoaiblog.com",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// POST /api/generate - Generate image using Workers AI
app.post("/api/generate", async (c) => {
  try {
    const { prompt, ...options } = await c.req.json();

    if (!prompt) {
      return c.json({ success: false, error: "Prompt is required" }, 400);
    }

    console.log("Generating image:", prompt);

    // Use Cloudflare Workers AI - SDXL model (FREE!)
    const response = await c.env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      {
        prompt,
        num_steps: options.steps || 20,
        guidance_scale: options.guidance || 7.5,
      },
    );

    // Return image directly as PNG
    return new Response(response, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    return c.json(
      {
        success: false,
        error: error.message || "Failed to generate image",
      },
      500,
    );
  }
});

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "cf-ai-image-gen",
    model: "Stable Diffusion XL (Workers AI)",
    cost: "FREE (10k neurons/day)",
  });
});

export default app;
