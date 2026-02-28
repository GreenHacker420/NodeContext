import type { ChunkMetadata } from "../models/ChunkMetadata.js";
import type { CodeChunk } from "../models/CodeChunk.js";

export interface IChunker {
  chunk(content: string, metadata: ChunkMetadata): CodeChunk[];
}
