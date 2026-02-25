import { AnswerGenerator } from "./AnswerGenerator.js";
import { ContextGrader } from "./ContextGrader.js";
import { HybridRetriever } from "./HybridRetriever.js";
import { QueryEnhancer } from "./QueryEnhancer.js";
import { Reranker } from "./Reranker.js";
import { TokenOptimizer } from "./TokenOptimizer.js";

export class CRAGEngine {
  public constructor(
    private readonly queryEnhancer: QueryEnhancer,
    private readonly retriever: HybridRetriever,
    private readonly grader: ContextGrader,
    private readonly reranker: Reranker,
    private readonly optimizer: TokenOptimizer,
    private readonly generator: AnswerGenerator,
  ) {}

  public async ask(query: string): Promise<string> {
    const enhancement = await this.queryEnhancer.enhance(query);
    const retrieved = await this.retrieveWithFallback(query, enhancement.enhancedQuery);
    const graded = await this.grader.grade(query, retrieved);
    const reranked = this.reranker.rerank(graded);
    const optimized = this.optimizer.optimize(reranked);
    return this.generator.generate(query, optimized);
  }

  private async retrieveWithFallback(
    originalQuery: string,
    enhancedQuery: string,
  ): Promise<Awaited<ReturnType<HybridRetriever["retrieve"]>>> {
    const primary = await this.retriever.retrieve(enhancedQuery);
    if (primary.length > 0 || enhancedQuery === originalQuery) {
      return primary;
    }

    return this.retriever.retrieve(originalQuery);
  }
}
