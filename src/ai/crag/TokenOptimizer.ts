import type { RetrievalResult } from "../../domain/models/RetrievalResult.js";

export class TokenOptimizer {
  public constructor(
    private readonly maxTokens: number,
    private readonly utilizationLimit: number = 0.8,
  ) {}

  public optimize(results: RetrievalResult[]): RetrievalResult[] {
    const budget = Math.floor(this.maxTokens * this.utilizationLimit);
    const selected: RetrievalResult[] = [];
    let used = 0;

    for (const result of results) {
      const chunkTokens = this.estimateTokens(result.chunk.content);
      if (used + chunkTokens > budget) {
        continue;
      }

      selected.push(result);
      used += chunkTokens;
    }

    if (selected.length > 0 || results.length === 0) {
      return selected;
    }

    return [this.truncateToBudget(results[0], budget)];
  }

  private truncateToBudget(result: RetrievalResult, budget: number): RetrievalResult {
    const maxChars = Math.max(120, budget * 4);
    const content = result.chunk.content.slice(0, maxChars);

    return {
      ...result,
      chunk: {
        ...result.chunk,
        content: `${content}\n... [truncated by token optimizer]`,
      },
    };
  }

  private estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }
}
