import { Env, SearchQuery, SearchResult, PumoProduct } from '../types';

export class SearchService {
  constructor(private env: Env) {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    console.log(`🔍 Search: "${query.query}" (mode: ${query.mode || 'hybrid'})`);

    const mode = query.mode || 'hybrid';

    if (mode === 'semantic') {
      return await this.semanticSearch(query);
    } else if (mode === 'keyword') {
      return await this.keywordSearch(query);
    } else {
      return await this.hybridSearch(query);
    }
  }

  private async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query.query
    });

    const matches = await this.env.VECTORIZE.query(embedding.data[0], {
      topK: query.limit || 20,
      returnMetadata: true
    });

    const results: SearchResult[] = [];

    for (const match of matches.matches) {
      const productId = match.id;
      const product = await this.getProductById(productId);

      if (product && this.matchesFilters(product, query.filters)) {
        results.push({
          product,
          score: match.score,
          match_type: 'semantic'
        });
      }
    }

    return results;
  }

  private async keywordSearch(query: SearchQuery): Promise<SearchResult[]> {
    const searchTerms = query.query.toLowerCase().split(' ');
    const conditions = searchTerms.map(() => 
      '(LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)'
    ).join(' AND ');

    const bindings = searchTerms.flatMap(term => {
      const pattern = `%${term}%`;
      return [pattern, pattern, pattern];
    });

    let sql = `
      SELECT * FROM products 
      WHERE ${conditions}
    `;

    if (query.filters) {
      if (query.filters.category) {
        sql += ` AND category LIKE ?`;
        bindings.push(`%${query.filters.category}%`);
      }
      if (query.filters.min_price !== undefined) {
        sql += ` AND price >= ?`;
        bindings.push(query.filters.min_price);
      }
      if (query.filters.max_price !== undefined) {
        sql += ` AND price <= ?`;
        bindings.push(query.filters.max_price);
      }
      if (query.filters.in_stock) {
        sql += ` AND stock > 0`;
      }
    }

    sql += ` LIMIT ?`;
    bindings.push(query.limit || 20);

    const { results } = await this.env.DB.prepare(sql).bind(...bindings).all();

    return results.map(r => ({
      product: r as PumoProduct,
      score: this.calculateKeywordScore(r as PumoProduct, searchTerms),
      match_type: 'keyword' as const
    }));
  }

  private async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query),
      this.keywordSearch(query)
    ]);

    const combinedMap = new Map<string, SearchResult>();

    semanticResults.forEach(result => {
      combinedMap.set(result.product.id, {
        ...result,
        score: result.score * 0.6,
        match_type: 'hybrid'
      });
    });

    keywordResults.forEach(result => {
      const existing = combinedMap.get(result.product.id);
      if (existing) {
        existing.score += result.score * 0.4;
      } else {
        combinedMap.set(result.product.id, {
          ...result,
          score: result.score * 0.4,
          match_type: 'hybrid'
        });
      }
    });

    return Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 20);
  }

  private async getProductById(id: string): Promise<PumoProduct | null> {
    const { results } = await this.env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).all();

    return results.length > 0 ? results[0] as PumoProduct : null;
  }

  private matchesFilters(product: PumoProduct, filters?: SearchQuery['filters']): boolean {
    if (!filters) return true;

    if (filters.category && !product.category?.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }

    if (filters.min_price !== undefined && product.price < filters.min_price) {
      return false;
    }

    if (filters.max_price !== undefined && product.price > filters.max_price) {
      return false;
    }

    if (filters.in_stock && product.stock <= 0) {
      return false;
    }

    return true;
  }

  private calculateKeywordScore(product: PumoProduct, searchTerms: string[]): number {
    let score = 0;
    const text = `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();

    searchTerms.forEach(term => {
      if (product.name.toLowerCase().includes(term)) score += 3;
      if (product.category?.toLowerCase().includes(term)) score += 2;
      if (product.description?.toLowerCase().includes(term)) score += 1;
    });

    return score;
  }
}
