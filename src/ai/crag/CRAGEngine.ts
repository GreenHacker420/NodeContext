import { AnswerGenerator } from "./AnswerGenerator.js";
import { ContextGrader } from "./ContextGrader.js";
import { HybridRetriever } from "./HybridRetriever.js";
import { Reranker } from "./Reranker.js";
import { TokenOptimizer } from "./TokenOptimizer.js";

export class CRAGEngine {
  public constructor(
    private readonly retriever: HybridRetriever,
    private readonly grader: ContextGrader,
    private readonly reranker: Reranker,
    private readonly optimizer: TokenOptimizer,
    private readonly generator: AnswerGenerator,
  ) {}

  public async ask(query: string): Promise<string> {
    const retrieved = await this.retriever.retrieve(query);
    const graded = await this.grader.grade(query, retrieved);
    const reranked = this.reranker.rerank(graded);
    const optimized = this.optimizer.optimize(reranked);
    return this.generator.generate(query, optimized);
  }
}
