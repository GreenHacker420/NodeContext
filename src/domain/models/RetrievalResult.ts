import type { CodeChunk } from "./CodeChunk.js";

export interface RetrievalResult {
  chunk: CodeChunk;
  vectorScore: number;
  symbolScore: number;
  pathScore: number;
  gradeScore: number;
  finalScore: number;
}

export interface GradedRetrievalResult extends RetrievalResult {
  grade: number;
  gradeReason: string;
}
