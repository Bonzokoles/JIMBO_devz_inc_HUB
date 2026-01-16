/**
 * RAG Engine - Core logic for query processing
 *
 * Flow:
 * 1. Embed user query using Workers AI
 * 2. Search Vectorize for relevant products
 * 3. Build context from top matches
 * 4. Call LLM (OpenRouter DeepSeek R1 with Workers AI fallback)
 * 5. Return structured response
 */

import type { Env } from "./index";

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    category: string;
    price?: string;
    url: string;
    score: number;
  }>;
  confidence: number;
  metadata: {
    llm: "openrouter" | "workers-ai";
    processingTime: number;
  };
}

export async function ragChat(
  query: string,
  env: Env,
  context?: string[],
): Promise<RAGResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Embed query using Workers AI
    const embeddingResponse = (await env.AI.run("@cf/baai/bge-small-en-v1.5", {
      text: [query],
    })) as { data: number[][] };

    if (!embeddingResponse?.data?.[0]) {
      throw new Error("Failed to generate embedding");
    }

    // Step 2: Search Vectorize for top 5 matches
    const searchResults = await env.VECTORIZE.query(embeddingResponse.data[0], {
      topK: 5,
      returnMetadata: true,
    });

    // Step 3: Build context from matches
    const sources = searchResults.matches.map((match) => ({
      id: match.id,
      title: (match.metadata?.title as string) || "Unknown Product",
      category: (match.metadata?.category as string) || "Unknown",
      price: match.metadata?.price as string,
      url: (match.metadata?.url as string) || "#",
      score: match.score || 0,
    }));

    const contextText = searchResults.matches
      .map(
        (m) =>
          `Produkt: ${m.metadata?.title}\n` +
          `Kategoria: ${m.metadata?.category}\n` +
          `Cena: ${m.metadata?.price || "Brak danych"}\n` +
          `Opis: ${m.metadata?.description || "Brak opisu"}\n` +
          `URL: ${m.metadata?.url || "#"}`,
      )
      .join("\n\n---\n\n");

    // Step 4: Call LLM (OpenRouter first, Workers AI fallback)
    let answer = "";
    let llmUsed: "openrouter" | "workers-ai" = "openrouter";

    try {
      // Try OpenRouter DeepSeek R1
      const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mybonzoaiblog.com",
            "X-Title": "PUMO RAG System",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "Jesteś pomocnym asystentem sklepu meblowego PUMO Guide. " +
                  "Pomagasz klientom w wyborze mebli na podstawie dostępnych produktów. " +
                  "Odpowiadaj po polsku, profesjonalnie, konkretnie i rzeczowo. " +
                  "Jeśli w bazie nie ma dokładnie tego czego szuka klient, zaproponuj najbardziej zbliżone alternatywy.",
              },
              {
                role: "user",
                content:
                  `Kontekst z bazy produktów PUMO:\n\n${contextText}\n\n` +
                  `Pytanie klienta: ${query}\n\n` +
                  `Udziel pomocnej odpowiedzi bazując na powyższych produktach. ` +
                  `Jeśli znalazłeś odpowiednie produkty, wymień je z cenami i kategoriami.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        },
      );

      if (!openRouterResponse.ok) {
        throw new Error(`OpenRouter error: ${openRouterResponse.status}`);
      }

      const data = (await openRouterResponse.json()) as any;
      answer = data.choices?.[0]?.message?.content || "";

      if (!answer) {
        throw new Error("Empty response from OpenRouter");
      }
    } catch (openRouterError) {
      console.error(
        "OpenRouter failed, falling back to Workers AI:",
        openRouterError,
      );
      llmUsed = "workers-ai";

      // Fallback to Workers AI Llama 3.3 70B
      const workersAIResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            {
              role: "system",
              content:
                "Jesteś asystentem sklepu PUMO. Odpowiadaj po polsku, profesjonalnie i konkretnie.",
            },
            {
              role: "user",
              content: `Produkty:\n${contextText}\n\nPytanie: ${query}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
      );

      answer =
        (workersAIResponse as any)?.response ||
        "Nie udało się wygenerować odpowiedzi.";
    }

    // Calculate confidence based on top match score
    const topScore = searchResults.matches[0]?.score || 0;
    const confidence = Math.min(Math.round(topScore * 100), 100);

    const processingTime = Date.now() - startTime;

    return {
      answer: answer.trim(),
      sources,
      confidence,
      metadata: {
        llm: llmUsed,
        processingTime,
      },
    };
  } catch (error) {
    console.error("RAG engine error:", error);
    throw new Error(
      `RAG processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
