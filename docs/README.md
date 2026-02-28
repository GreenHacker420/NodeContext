# NodeContext Docs

[![TypeScript](https://img.shields.io/badge/TypeScript-Docs-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Mermaid](https://img.shields.io/badge/Diagrams-Mermaid-FF3670?logo=mermaid&logoColor=white)](https://mermaid.js.org/)

Implementation documentation for the CRAG-based NodeContext CLI.

## Documentation Map

```mermaid
flowchart TD
  D["docs/"] --> A["architecture.md"]
  D --> P["crag-pipeline.md"]
  D --> C["cli.md"]

  A --> A1["layer boundaries"]
  A --> A2["dependency direction"]
  P --> P1["retrieve/grade/correct"]
  P --> P2["rerank/optimize/generate"]
  C --> C1["command reference"]
  C --> C2["runtime configuration"]
```

## Contents

- [Architecture](./architecture.md)
- [CRAG Pipeline](./crag-pipeline.md)
- [CLI Usage](./cli.md)
