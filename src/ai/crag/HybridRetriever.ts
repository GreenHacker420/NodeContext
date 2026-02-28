import type { IVectorStore } from "../../domain/interfaces/IVectorStore.js";
import type { RetrievalResult } from "../../domain/models/RetrievalResult.js";

export class HybridRetriever {
  public constructor(private readonly vectorStore: IVectorStore) {}

  public async retrieve(query: string, k: number = 8): Promise<RetrievalResult[]> {
    const candidates = await this.vectorStore.similaritySearch(query, k * 3);
    const tokens = this.extractTokens(query);

    const rescored = candidates.map((result) => {
      const symbolScore = this.symbolScore(tokens, result.chunk.content);
      const pathScore = this.pathScore(tokens, result.chunk.metadata.filePath);
      const finalScore = result.vectorScore * 0.65 + symbolScore * 0.25 + pathScore * 0.1;
      return { ...result, symbolScore, pathScore, finalScore };
    });

    return rescored.sort((a, b) => b.finalScore - a.finalScore).slice(0, k);
  }

  private extractTokens(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[^a-z0-9_./-]+/)
      .filter((token) => token.length >= 3);
  }

  private symbolScore(tokens: string[], content: string): number {
    const normalized = content.toLowerCase();
    const hits = tokens.filter((token) => normalized.includes(token)).length;
    return tokens.length === 0 ? 0 : hits / tokens.length;
  }

  private pathScore(tokens: string[], filePath: string): number {
    const normalized = filePath.toLowerCase();
    const hits = tokens.filter((token) => normalized.includes(token)).length;
    return tokens.length === 0 ? 0 : hits / tokens.length;
  }
}
