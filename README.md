# NodeSage

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-000000?logo=ollama&logoColor=white)](https://ollama.com/)
[![Vectra](https://img.shields.io/badge/Vector%20Store-Vectra-1F6FEB)](https://www.npmjs.com/package/vectra)
[![Commander](https://img.shields.io/badge/CLI-Commander-F2A900)](https://www.npmjs.com/package/commander)

NodeSage is a TypeScript CLI implementing a production-style CRAG engine for codebase Q&A.

Pipeline:

`Enhance Query -> Retrieve -> Grade -> Correct -> Re-rank -> Optimize -> Generate`

## System Overview

```mermaid
flowchart LR
  subgraph App["App Layer"]
    CLI["CLIApplication"]
  end

  subgraph AI["AI Layer"]
    CRAG["CRAGEngine"]
    ENH["QueryEnhancer"]
    RET["HybridRetriever"]
    GRD["ContextGrader"]
    RER["Reranker"]
    TOK["TokenOptimizer"]
    GEN["AnswerGenerator"]
    ING["CodeIngestionService"]
  end

  subgraph Infra["Infrastructure Layer"]
    FS["RepositoryScanner"]
    CHK["LineChunker"]
    VS["VectraVectorStore"]
    LLM["OllamaLLM"]
  end

  subgraph Domain["Domain Layer"]
    MOD["CodeChunk / RetrievalResult"]
    INTF["IChunker / IVectorStore / ILLM"]
  end

  CLI --> ING
  CLI --> CRAG

  ING --> FS
  ING --> CHK
  ING --> VS

  CRAG --> ENH
  ENH --> VS
  ENH --> LLM
  ENH --> RET
  CRAG --> RET
  CRAG --> GRD
  CRAG --> RER
  CRAG --> TOK
  CRAG --> GEN

  RET --> VS
  GRD --> LLM
  GEN --> LLM

  AI --> INTF
  Infra --> INTF
  Domain --> MOD
```

## CRAG Runtime Flow

```mermaid
flowchart LR
  Q["Query"] --> E["Enhance Query"]
  E --> R["Retrieve"]
  R --> G["Grade"]
  G --> C["Correct"]
  C --> RR["Re-rank"]
  RR --> O["Optimize"]
  O --> A["Generate Answer"]

  E -->|"seed vector context + llm rewrite"| S0["Enhanced Query"]
  R -->|"vector + symbol + path"| S1["Candidate Context"]
  G -->|"LLM relevance 1-10"| S2["Validated Context"]
  O -->|"80% token budget"| S3["Bounded Context"]
  A --> OUT["Grounded Response with File Paths"]
```

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Start Ollama and pull models

```bash
ollama serve
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text
```

### 3. Build

```bash
npm run build
```

### 4. Ingest codebase

```bash
node dist/index.js ingest .
```

### 5. Ask question

```bash
node dist/index.js ask "Where is auth logic implemented?"
```

## Commands

- `ingest [repo]`: scan repository, chunk files, embed, and index.
- `ask <query>`: execute full CRAG pipeline (including query enhancement) and generate grounded answer.

## Configuration

Environment variables:

- `NODESAGE_CHAT_MODEL` default `qwen2.5-coder:7b`
- `NODESAGE_EMBED_MODEL` default `nomic-embed-text`
- `NODESAGE_TEMPERATURE` default `0.1`
- `NODESAGE_MAX_TOKENS` default `6000`

Index path:

- `~/.nodesage/crag-index`

## Project Structure

```text
src/
  domain/
    models/
    interfaces/
  infrastructure/
    llm/
    vectorstore/
    filesystem/
  ai/
    crag/
  app/
    cli/
```

## Documentation

- [docs/README.md](./docs/README.md)
- [docs/architecture.md](./docs/architecture.md)
- [docs/crag-pipeline.md](./docs/crag-pipeline.md)
- [docs/cli.md](./docs/cli.md)

## Development

```bash
npm run build
node dist/index.js --help
```
