import * as fs from "fs/promises";
import { LocalIndex } from "vectra";
import { Ollama } from "ollama";
import type { IVectorStore } from "../../domain/interfaces/IVectorStore.js";
import type { CodeChunk } from "../../domain/models/CodeChunk.js";
import type { RetrievalResult } from "../../domain/models/RetrievalResult.js";

type StoredMetadata = {
  id: string;
  content: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
};

export class VectraVectorStore implements IVectorStore {
  private readonly client: Ollama;
  private indexInstance: LocalIndex | null = null;

  public constructor(
    private readonly indexDir: string,
    private readonly embedModel: string,
  ) {
    this.client = new Ollama();
  }

  public async addDocuments(docs: CodeChunk[]): Promise<void> {
    if (docs.length === 0) {
      return;
    }

    const index = await this.getIndex(true);
    const vectors = await this.embedBatch(docs.map((doc) => doc.content));

    await index.beginUpdate();
    try {
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        await this.safeDelete(index, doc.id);
        await index.insertItem({
          id: doc.id,
          vector: vectors[i],
          metadata: this.toStoredMetadata(doc) as unknown as Record<string, string | number | boolean>,
        });
      }
    } finally {
      await index.endUpdate();
    }
  }

  public async similaritySearch(query: string, k: number): Promise<RetrievalResult[]> {
    const index = await this.getIndex(false);
    const queryVector = await this.embed(query);
    const rawResults = await index.queryItems(queryVector, k);

    return rawResults.map((item) => {
      const metadata = item.item.metadata as unknown as StoredMetadata;
      return {
        chunk: {
          id: metadata.id,
          content: metadata.content,
          metadata: {
            filePath: metadata.filePath,
            language: metadata.language,
            startLine: Number(metadata.startLine),
            endLine: Number(metadata.endLine),
          },
        },
        vectorScore: item.score,
        symbolScore: 0,
        pathScore: 0,
        gradeScore: 0,
        finalScore: item.score,
      } satisfies RetrievalResult;
    });
  }

  private async getIndex(createIfMissing: boolean): Promise<LocalIndex> {
    if (this.indexInstance) {
      return this.indexInstance;
    }

    await fs.mkdir(this.indexDir, { recursive: true });
    const index = new LocalIndex(this.indexDir);
    const exists = await index.isIndexCreated();

    if (!exists && createIfMissing) {
      await index.createIndex();
    }

    if (!exists && !createIfMissing) {
      throw new Error("Vector index not found. Run ingest first.");
    }

    this.indexInstance = index;
    return index;
  }

  private toStoredMetadata(doc: CodeChunk): StoredMetadata {
    return {
      id: doc.id,
      content: doc.content,
      filePath: doc.metadata.filePath,
      language: doc.metadata.language,
      startLine: doc.metadata.startLine,
      endLine: doc.metadata.endLine,
    };
  }

  private async embed(text: string): Promise<number[]> {
    const response = await this.client.embed({
      model: this.embedModel,
      input: text,
    });

    return response.embeddings[0];
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embed({
      model: this.embedModel,
      input: texts,
    });

    return response.embeddings;
  }

  private async safeDelete(index: LocalIndex, id: string): Promise<void> {
    try {
      await index.deleteItem(id);
    } catch {
      // Ignore missing ids to keep upsert behavior deterministic.
    }
  }
}
