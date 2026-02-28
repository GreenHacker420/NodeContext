# CRAG Pipeline

NodeContext uses this pipeline:

`Enhance Query -> Retrieve -> Grade -> Correct -> Re-rank -> Optimize -> Generate`

## End-to-End Diagram

```mermaid
flowchart LR
  Q["Query"] --> E["Enhance Query"]
  E --> R["Retrieve"]
  R --> G["Grade"]
  G --> C["Correct"]
  C --> RR["Re-rank"]
  RR --> O["Optimize"]
  O --> GEN["Generate"]

  E --> E1["seed vector lookup"]
  E --> E2["code-context symbol extraction"]
  E --> E3["llm rewrite with fallback"]

  R --> R1["vector search"]
  R --> R2["symbol scoring"]
  R --> R3["path scoring"]

  G --> G1["LLM grade 1-10"]
  G --> G2["threshold filter"]

  C --> C1["discard weak chunks"]

  RR --> RR1["dedupe"]
  RR --> RR2["merge adjacent"]
  RR --> RR3["final ordering"]

  O --> O1["maxTokens * 0.8 budget"]
  O --> O2["truncate fallback"]

  GEN --> A["Answer with file citations"]
```

## 0. Enhance Query

`QueryEnhancer` performs a pre-retrieval expansion step:

- fetches seed chunks from vector search
- extracts file-path and symbol hints from seed context
- asks the LLM for a strict-JSON rewritten query
- falls back to deterministic query expansion if parsing fails

## Scoring Formula

```mermaid
flowchart TD
  V["vectorScore"] --> F["finalScore"]
  S["symbolScore"] --> F
  P["pathScore"] --> F
  G["gradeScore"] --> F

  W["Weights"] --> F
  W --> W1["0.65 * vector"]
  W --> W2["0.25 * symbol"]
  W --> W3["0.10 * path"]
```

`HybridRetriever` computes:

`finalScore = vectorScore * 0.65 + symbolScore * 0.25 + pathScore * 0.10`

`ContextGrader` adds LLM relevance signal as `gradeScore` and filters chunks below threshold.

## Prompt Contract

`AnswerGenerator` enforces:

- cite file paths for claims
- avoid hallucinated files/APIs
- if insufficient evidence, return `Insufficient context`

## Data Contract

- input: user query string
- retrieval unit: `RetrievalResult`
- output: grounded answer string
