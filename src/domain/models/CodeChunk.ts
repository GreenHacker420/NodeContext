import type { ChunkMetadata } from "./ChunkMetadata.js";

export interface CodeChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}
