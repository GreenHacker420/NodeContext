import type { ILLM } from "../../domain/interfaces/ILLM.js";
import type { RetrievalResult } from "../../domain/models/RetrievalResult.js";

export class AnswerGenerator {
  public constructor(private readonly llm: ILLM) {}

  public async generate(query: string, context: RetrievalResult[]): Promise<string> {
    const prompt = this.buildPrompt(query, context);
    return this.llm.generate(prompt);
  }

  private buildPrompt(query: string, context: RetrievalResult[]): string {
    const contextBlock = context
      .map((item) => {
        const meta = item.chunk.metadata;
        return [
          `FILE: ${meta.filePath}`,
          `LINES: ${meta.startLine}-${meta.endLine}`,
          `SCORE: ${item.finalScore.toFixed(3)}`,
          item.chunk.content,
        ].join("\n");
      })
      .join("\n\n---\n\n");

    return [
      "You are a CRAG code assistant.",
      "Rules:",
      "1) Cite file paths for every key claim.",
      "2) Do not hallucinate APIs or files.",
      "3) If context is insufficient, explicitly say: Insufficient context.",
      "4) Keep answer concise and technical.",
      "",
      "Question:",
      query,
      "",
      "Context:",
      contextBlock || "No relevant context found.",
      "",
      "Answer format:",
      "- Summary",
      "- Evidence (file paths)",
      "- Gaps",
    ].join("\n");
  }
}
