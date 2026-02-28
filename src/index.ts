import * as os from "os";
import * as path from "path";
import { CRAGEngine } from "./ai/crag/CRAGEngine.js";
import { CodeIngestionService } from "./ai/crag/CodeIngestionService.js";
import { ContextGrader } from "./ai/crag/ContextGrader.js";
import { HybridRetriever } from "./ai/crag/HybridRetriever.js";
import { QueryEnhancer } from "./ai/crag/QueryEnhancer.js";
import { Reranker } from "./ai/crag/Reranker.js";
import { TokenOptimizer } from "./ai/crag/TokenOptimizer.js";
import { AnswerGenerator } from "./ai/crag/AnswerGenerator.js";
import { CLIApplication } from "./app/cli/CLIApplication.js";
import { LineChunker } from "./infrastructure/filesystem/LineChunker.js";
import { RepositoryScanner } from "./infrastructure/filesystem/RepositoryScanner.js";
import { OllamaLLM } from "./infrastructure/llm/OllamaLLM.js";
import { VectraVectorStore } from "./infrastructure/vectorstore/VectraVectorStore.js";

const model = process.env.NODECONTEXT_CHAT_MODEL ?? "qwen2.5-coder:7b";
const embedModel = process.env.NODECONTEXT_EMBED_MODEL ?? "nomic-embed-text";
const temperature = Number(process.env.NODECONTEXT_TEMPERATURE ?? "0.1");
const maxTokens = Number(process.env.NODECONTEXT_MAX_TOKENS ?? "6000");
const indexDir = path.join(os.homedir(), ".nodecontext", "crag-index");

const scanner = new RepositoryScanner();
const chunker = new LineChunker();
const vectorStore = new VectraVectorStore(indexDir, embedModel);
const llm = new OllamaLLM(model, temperature);

const ingestionService = new CodeIngestionService(scanner, chunker, vectorStore);
const queryEnhancer = new QueryEnhancer(vectorStore, llm, 6, 12);
const retriever = new HybridRetriever(vectorStore);
const grader = new ContextGrader(llm, 6);
const reranker = new Reranker();
const optimizer = new TokenOptimizer(maxTokens, 0.8);
const generator = new AnswerGenerator(llm);
const engine = new CRAGEngine(
  queryEnhancer,
  retriever,
  grader,
  reranker,
  optimizer,
  generator,
);

const app = new CLIApplication(ingestionService, engine);

app.run(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
