import type { GradedRetrievalResult, RetrievalResult } from "../../domain/models/RetrievalResult.js";

export class Reranker {
  public rerank(results: GradedRetrievalResult[]): RetrievalResult[] {
    const unique = this.deduplicate(results);
    const merged = this.mergeAdjacent(unique);
    return merged.sort((a, b) => b.finalScore - a.finalScore);
  }

  private deduplicate(results: GradedRetrievalResult[]): GradedRetrievalResult[] {
    const byId = new Map<string, GradedRetrievalResult>();

    for (const result of results) {
      const existing = byId.get(result.chunk.id);
      if (!existing || result.finalScore > existing.finalScore) {
        byId.set(result.chunk.id, result);
      }
    }

    return [...byId.values()].sort((a, b) => b.finalScore - a.finalScore);
  }

  private mergeAdjacent(results: GradedRetrievalResult[]): RetrievalResult[] {
    const ordered = [...results].sort((a, b) => {
      const samePath = a.chunk.metadata.filePath.localeCompare(b.chunk.metadata.filePath);
      if (samePath !== 0) {
        return samePath;
      }
      return a.chunk.metadata.startLine - b.chunk.metadata.startLine;
    });

    const merged: RetrievalResult[] = [];
    for (const current of ordered) {
      const last = merged[merged.length - 1];
      if (last && this.canMerge(last, current)) {
        merged[merged.length - 1] = this.mergePair(last, current);
        continue;
      }
      merged.push(current);
    }

    return merged;
  }

  private canMerge(base: RetrievalResult, next: RetrievalResult): boolean {
    if (base.chunk.metadata.filePath !== next.chunk.metadata.filePath) {
      return false;
    }

    return next.chunk.metadata.startLine <= base.chunk.metadata.endLine + 3;
  }

  private mergePair(base: RetrievalResult, next: RetrievalResult): RetrievalResult {
    return {
      ...base,
      chunk: {
        id: `${base.chunk.id}+${next.chunk.id}`,
        content: `${base.chunk.content}\n\n${next.chunk.content}`,
        metadata: {
          ...base.chunk.metadata,
          endLine: Math.max(base.chunk.metadata.endLine, next.chunk.metadata.endLine),
        },
      },
      vectorScore: Math.max(base.vectorScore, next.vectorScore),
      symbolScore: Math.max(base.symbolScore, next.symbolScore),
      pathScore: Math.max(base.pathScore, next.pathScore),
      gradeScore: Math.max(base.gradeScore, next.gradeScore),
      finalScore: Math.max(base.finalScore, next.finalScore),
    };
  }
}
