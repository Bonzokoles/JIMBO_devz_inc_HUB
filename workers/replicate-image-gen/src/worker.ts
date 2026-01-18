/**
 * Replicate AI Image Generator - Cloudflare Worker
 * Supports FLUX Schnell, FLUX Pro, and SDXL models
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import Replicate from "replicate";

type Bindings = {
  REPLICATE_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS configuration
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

// Available models
const MODELS = {
  "flux-schnell": {
    id: "black-forest-labs/flux-schnell",
    version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
    name: "FLUX Schnell",
    description: "Fast generation, good quality",
    cost: 0.003,
  },
  "flux-pro": {
    id: "black-forest-labs/flux-pro",
    version:
      "7879970a67b8e3bb2d7b9c6b5f3a5e8a9f7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1",
    name: "FLUX Pro",
    description: "Highest quality, slower",
    cost: 0.055,
  },
  sdxl: {
    id: "stability-ai/sdxl",
    version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    name: "Stable Diffusion XL",
    description: "Classic, reliable",
    cost: 0.004,
  },
};

// GET /api/models - List available models
app.get("/api/models", (c) => {
  return c.json({
    success: true,
    models: Object.entries(MODELS).map(([key, model]) => ({
      key,
      name: model.name,
      description: model.description,
      cost: model.cost,
    })),
  });
});

// POST /api/generate - Start image generation
app.post("/api/generate", async (c) => {
  try {
    const { prompt, model = "flux-schnell", ...options } = await c.req.json();

    if (!prompt) {
      return c.json({ success: false, error: "Prompt is required" }, 400);
    }

    const selectedModel = MODELS[model as keyof typeof MODELS];
    if (!selectedModel) {
      return c.json({ success: false, error: "Invalid model selected" }, 400);
    }

    const replicate = new Replicate({
      auth: c.env.REPLICATE_API_TOKEN,
    });

    // Default input parameters
    const input = {
      prompt,
      num_outputs: options.num_outputs || 1,
      aspect_ratio: options.aspect_ratio || "1:1",
      output_format: options.output_format || "png",
      output_quality: options.output_quality || 80,
      ...options,
    };

    // Start prediction
    const prediction = await replicate.predictions.create({
      version: selectedModel.version,
      input,
    });

    return c.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
      model: selectedModel.name,
      estimatedCost: selectedModel.cost,
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    return c.json(
      {
        success: false,
        error: error.message || "Failed to start image generation",
      },
      500,
    );
  }
});

// GET /api/status/:id - Check prediction status
app.get("/api/status/:id", async (c) => {
  try {
    const predictionId = c.req.param("id");

    const replicate = new Replicate({
      auth: c.env.REPLICATE_API_TOKEN,
    });

    const prediction = await replicate.predictions.get(predictionId);

    return c.json({
      success: true,
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      metrics: prediction.metrics,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return c.json(
      {
        success: false,
        error: error.message || "Failed to check prediction status",
      },
      500,
    );
  }
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "replicate-image-gen" });
});

export default app;
