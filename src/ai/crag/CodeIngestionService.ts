import type { IChunker } from "../../domain/interfaces/IChunker.js";
import type { IVectorStore } from "../../domain/interfaces/IVectorStore.js";
import type { CodeChunk } from "../../domain/models/CodeChunk.js";
import type { ChunkMetadata } from "../../domain/models/ChunkMetadata.js";
import { RepositoryScanner } from "../../infrastructure/filesystem/RepositoryScanner.js";

export class CodeIngestionService {
  public constructor(
    private readonly scanner: RepositoryScanner,
    private readonly chunker: IChunker,
    private readonly vectorStore: IVectorStore,
  ) {}

  public async ingest(repositoryPath: string): Promise<{ files: number; chunks: number }> {
    const files = await this.scanner.discoverRepositoryFiles(repositoryPath);
    const allChunks: CodeChunk[] = [];

    for (const filePath of files) {
      const content = await this.scanner.readFile(filePath);
      const metadata: ChunkMetadata = {
        filePath,
        language: this.scanner.detectLanguage(filePath),
        startLine: 1,
        endLine: 1,
      };

      const chunks = this.chunker.chunk(content, metadata);
      allChunks.push(...chunks);
    }

    await this.vectorStore.addDocuments(allChunks);
    return { files: files.length, chunks: allChunks.length };
  }
}
