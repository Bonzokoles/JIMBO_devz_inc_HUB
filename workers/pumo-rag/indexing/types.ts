// indexing/types.ts
// TypeScript interfaces for PUMO products indexing pipeline

export interface PumoProduct {
  id: string;
  name: string;
  category: string;
  short_desc: string;
  long_desc: string;
  price: number;
  url: string;
  image_url: string;
}

export interface IndexingProgress {
  totalProducts: number;
  indexedProducts: number;
  processedChunks: string[];
  currentChunk: string | null;
  errors: ErrorRecord[];
  startedAt: string;
  lastUpdatedAt: string;
}

export interface ErrorRecord {
  chunk: string;
  batch: number;
  error: string;
}

export interface BatchResult {
  success: boolean;
  count: number;
  chunkName: string;
  batchIndex: number;
  error?: string;
}

export interface VectorizeInsertRequest {
  vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }>;
}

export interface WorkersAIResponse {
  result: {
    data: number[][];
  };
  success: boolean;
  errors: any[];
  messages: any[];
}
