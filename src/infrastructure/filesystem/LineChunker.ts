import type { IChunker } from "../../domain/interfaces/IChunker.js";
import type { ChunkMetadata } from "../../domain/models/ChunkMetadata.js";
import type { CodeChunk } from "../../domain/models/CodeChunk.js";

export class LineChunker implements IChunker {
  public constructor(
    private readonly chunkSizeLines: number = 80,
    private readonly overlapLines: number = 20,
    private readonly minChunkLines: number = 6,
  ) {}

  public chunk(content: string, metadata: ChunkMetadata): CodeChunk[] {
    const lines = content.split("\n");
    const chunks: CodeChunk[] = [];
    let start = 0;

    while (start < lines.length) {
      const end = Math.min(start + this.chunkSizeLines, lines.length);
      const segment = lines.slice(start, end);

      if (segment.length >= this.minChunkLines) {
        const chunkMetadata: ChunkMetadata = {
          filePath: metadata.filePath,
          language: metadata.language,
          startLine: start + 1,
          endLine: end,
        };

        chunks.push({
          id: `${metadata.filePath}:${chunkMetadata.startLine}-${chunkMetadata.endLine}`,
          content: segment.join("\n"),
          metadata: chunkMetadata,
        });
      }

      if (end >= lines.length) {
        break;
      }

      start = Math.max(end - this.overlapLines, start + 1);
    }

    return chunks;
  }
}
