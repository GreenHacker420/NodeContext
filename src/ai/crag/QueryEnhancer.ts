import type { ILLM } from "../../domain/interfaces/ILLM.js";
import type { IVectorStore } from "../../domain/interfaces/IVectorStore.js";
import type { RetrievalResult } from "../../domain/models/RetrievalResult.js";

export interface QueryEnhancement {
  originalQuery: string;
  enhancedQuery: string;
  contextFilePaths: string[];
  contextSymbols: string[];
}

export class QueryEnhancer {
  public constructor(
    private readonly vectorStore: IVectorStore,
    private readonly llm: ILLM,
    private readonly seedK: number = 6,
    private readonly maxSymbols: number = 12,
  ) {}

  public async enhance(query: string): Promise<QueryEnhancement> {
    const seedContext = await this.vectorStore.similaritySearch(query, this.seedK);
    const contextFilePaths = this.collectFilePaths(seedContext);
    const contextSymbols = this.collectSymbols(seedContext);

    if (seedContext.length === 0) {
      return {
        originalQuery: query,
        enhancedQuery: query,
        contextFilePaths,
        contextSymbols,
      };
    }

    const prompt = this.buildPrompt(query, contextFilePaths, contextSymbols);
    const rawResponse = await this.llm.generate(prompt);
    const enhancedQuery = this.parseEnhancedQuery(
      rawResponse,
      query,
      contextFilePaths,
      contextSymbols,
    );

    return { originalQuery: query, enhancedQuery, contextFilePaths, contextSymbols };
  }

  private collectFilePaths(results: RetrievalResult[]): string[] {
    const uniquePaths = [...new Set(results.map((item) => item.chunk.metadata.filePath))];
    return uniquePaths.slice(0, 6);
  }

  private collectSymbols(results: RetrievalResult[]): string[] {
    const tokenPattern = /\b[A-Za-z_][A-Za-z0-9_]{2,}\b/g;
    const stopWords = new Set(["const", "let", "var", "return", "class", "function"]);
    const counts = new Map<string, number>();

    for (const result of results) {
      const tokens = result.chunk.content.match(tokenPattern) ?? [];
      for (const token of tokens) {
        const normalized = token.toLowerCase();
        if (stopWords.has(normalized)) continue;
        counts.set(token, (counts.get(token) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([token]) => token)
      .slice(0, this.maxSymbols);
  }

  private buildPrompt(query: string, filePaths: string[], symbols: string[]): string {
    return [
      "You rewrite codebase queries for retrieval quality.",
      "Return strict JSON only: {\"enhancedQuery\": \"...\"}",
      "Keep original intent. Add only context-relevant terms.",
      "Do not invent file paths or symbols.",
      "",
      `Original query: ${query}`,
      `Candidate file paths: ${filePaths.join(", ") || "none"}`,
      `Candidate symbols: ${symbols.join(", ") || "none"}`,
    ].join("\n");
  }

  private parseEnhancedQuery(
    raw: string,
    originalQuery: string,
    filePaths: string[],
    symbols: string[],
  ): string {
    const candidate = this.tryParseJson(raw) ?? this.tryParseJson(this.extractJson(raw));
    const enhanced = candidate?.enhancedQuery?.trim();

    if (!enhanced) {
      return this.buildFallbackQuery(originalQuery, filePaths, symbols);
    }

    return enhanced.slice(0, 320);
  }

  private extractJson(raw: string): string {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return "";
    return raw.slice(start, end + 1);
  }

  private tryParseJson(raw: string): { enhancedQuery?: string } | null {
    if (!raw.trim()) return null;
    try {
      return JSON.parse(raw) as { enhancedQuery?: string };
    } catch {
      return null;
    }
  }

  private buildFallbackQuery(
    originalQuery: string,
    filePaths: string[],
    symbols: string[],
  ): string {
    const pathHints = filePaths.slice(0, 3).join(" ");
    const symbolHints = symbols.slice(0, 6).join(" ");
    const combined = `${originalQuery} ${pathHints} ${symbolHints}`.trim();
    return combined.slice(0, 320);
  }
}
