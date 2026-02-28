import * as path from "path";
import { Command } from "commander";
import { CRAGEngine } from "../../ai/crag/CRAGEngine.js";
import { CodeIngestionService } from "../../ai/crag/CodeIngestionService.js";

export class CLIApplication {
  public constructor(
    private readonly ingestionService: CodeIngestionService,
    private readonly engine: CRAGEngine,
  ) {}

  public async run(argv: string[]): Promise<void> {
    const program = new Command();
    program.name("nodecontext").description("CRAG-powered codebase assistant").version("3.0.0");

    program
      .command("ingest [repo]")
      .description("Scan and index repository code chunks")
      .action(async (repo: string = ".") => {
        const target = path.resolve(repo);
        const stats = await this.ingestionService.ingest(target);
        console.log(`Indexed ${stats.files} files into ${stats.chunks} chunks.`);
      });

    program
      .command("ask <query>")
      .description("Run full CRAG pipeline for a code question")
      .action(async (query: string) => {
        const answer = await this.engine.ask(query);
        console.log(answer);
      });

    await program.parseAsync(argv);
  }
}
