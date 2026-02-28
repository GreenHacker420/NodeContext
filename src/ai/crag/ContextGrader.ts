import type { ILLM } from "../../domain/interfaces/ILLM.js";
import type { GradedRetrievalResult, RetrievalResult } from "../../domain/models/RetrievalResult.js";

export class ContextGrader {
  public constructor(
    private readonly llm: ILLM,
    private readonly minGrade: number = 6,
  ) {}

  public async grade(query: string, results: RetrievalResult[]): Promise<GradedRetrievalResult[]> {
    const graded: GradedRetrievalResult[] = [];

    for (const result of results) {
      const { grade, reason } = await this.gradeSingle(query, result);
      if (grade < this.minGrade) {
        continue;
      }

      graded.push({
        ...result,
        grade,
        gradeReason: reason,
        gradeScore: grade / 10,
        finalScore: result.finalScore + grade / 10,
      });
    }

    return graded;
  }

  private async gradeSingle(
    query: string,
    result: RetrievalResult,
  ): Promise<{ grade: number; reason: string }> {
    const prompt = [
      "You are grading retrieval quality for code question answering.",
      "Return strict JSON only: {\"grade\": number, \"reason\": string}",
      "Grade from 1 to 10.",
      `Query: ${query}`,
      `File: ${result.chunk.metadata.filePath}`,
      `Code chunk:\n${result.chunk.content}`,
    ].join("\n\n");

    const response = await this.llm.generate(prompt);
    return this.parseGrade(response);
  }

  private parseGrade(raw: string): { grade: number; reason: string } {
    try {
      const parsed = JSON.parse(raw) as { grade?: number; reason?: string };
      const grade = Math.max(1, Math.min(10, Number(parsed.grade ?? 5)));
      const reason = parsed.reason?.trim() || "No reason provided.";
      return { grade, reason };
    } catch {
      return { grade: 5, reason: "Failed to parse grading output." };
    }
  }
}
