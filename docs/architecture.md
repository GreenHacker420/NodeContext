# Architecture

## Layer Boundaries

- `domain`: models and interfaces only
- `infrastructure`: SDK adapters only
- `ai`: CRAG orchestration and logic
- `app`: CLI entry and composition root

## Layer Dependency Graph

```mermaid
graph LR
  D["domain"]
  I["infrastructure"]
  A["ai"]
  P["app"]

  I --> D
  A --> D
  A --> I
  P --> A
  P --> I
```

## Component Map

```mermaid
graph TD
  subgraph Domain
    DM1["CodeChunk"]
    DM2["RetrievalResult"]
    DI1["IChunker"]
    DI2["IVectorStore"]
    DI3["ILLM"]
  end

  subgraph Infrastructure
    FS["RepositoryScanner"]
    LC["LineChunker"]
    VV["VectraVectorStore"]
    OL["OllamaLLM"]
  end

  subgraph AI
    CIS["CodeIngestionService"]
    QE["QueryEnhancer"]
    HR["HybridRetriever"]
    CG["ContextGrader"]
    RR["Reranker"]
    TO["TokenOptimizer"]
    AG["AnswerGenerator"]
    CE["CRAGEngine"]
  end

  subgraph App
    CLI["CLIApplication"]
  end

  LC -.implements.-> DI1
  VV -.implements.-> DI2
  OL -.implements.-> DI3

  CIS --> FS
  CIS --> LC
  CIS --> VV

  QE --> VV
  QE --> OL

  CE --> QE
  HR --> VV
  CG --> OL
  AG --> OL

  QE --> HR
  CE --> HR
  CE --> CG
  CE --> RR
  CE --> TO
  CE --> AG

  CLI --> CIS
  CLI --> CE
```

## Runtime Sequences

### Ingestion Sequence

```mermaid
sequenceDiagram
  participant User
  participant CLI as CLIApplication
  participant CIS as CodeIngestionService
  participant FS as RepositoryScanner
  participant CH as LineChunker
  participant VS as VectraVectorStore

  User->>CLI: ingest [repo]
  CLI->>CIS: ingest(path)
  CIS->>FS: discoverRepositoryFiles(path)
  FS-->>CIS: file[]
  loop each file
    CIS->>FS: readFile(file)
    FS-->>CIS: content
    CIS->>CH: chunk(content, metadata)
    CH-->>CIS: CodeChunk[]
  end
  CIS->>VS: addDocuments(chunks)
  VS-->>CIS: done
  CIS-->>CLI: {files, chunks}
  CLI-->>User: indexed summary
```

### Query Sequence

```mermaid
sequenceDiagram
  participant User
  participant CLI as CLIApplication
  participant CE as CRAGEngine
  participant QE as QueryEnhancer
  participant HR as HybridRetriever
  participant CG as ContextGrader
  participant RR as Reranker
  participant TO as TokenOptimizer
  participant AG as AnswerGenerator

  User->>CLI: ask <query>
  CLI->>CE: ask(query)
  CE->>QE: enhance(query)
  QE-->>CE: enhancedQuery
  CE->>HR: retrieve(enhancedQuery)
  HR-->>CE: retrieved
  CE->>CG: grade(query, retrieved)
  CG-->>CE: graded
  CE->>RR: rerank(graded)
  RR-->>CE: reranked
  CE->>TO: optimize(reranked)
  TO-->>CE: optimized
  CE->>AG: generate(query, optimized)
  AG-->>CE: answer
  CE-->>CLI: answer
  CLI-->>User: grounded response
```
