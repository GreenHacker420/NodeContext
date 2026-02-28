import type { CodeChunk } from "../models/CodeChunk.js";
import type { RetrievalResult } from "../models/RetrievalResult.js";

export interface IVectorStore {
  addDocuments(docs: CodeChunk[]): Promise<void>;
  similaritySearch(query: string, k: number): Promise<RetrievalResult[]>;
}
