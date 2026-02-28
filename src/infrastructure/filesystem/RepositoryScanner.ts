import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

export class RepositoryScanner {
  private readonly fileGlob = "**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,md,json,yaml,yml}";
  private readonly ignorePatterns = [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/coverage/**",
    "**/.next/**",
  ];

  public async discoverRepositoryFiles(repositoryPath: string): Promise<string[]> {
    const absolutePath = path.resolve(repositoryPath);
    const stat = await fs.stat(absolutePath);

    if (stat.isFile()) {
      return [absolutePath];
    }

    if (!stat.isDirectory()) {
      throw new Error(`Invalid repository path: ${repositoryPath}`);
    }

    const files = await glob(this.fileGlob, {
      cwd: absolutePath,
      absolute: true,
      nodir: true,
      ignore: this.ignorePatterns,
    });

    if (files.length === 0) {
      throw new Error(`No source files found in ${absolutePath}`);
    }

    return files.sort();
  }

  public async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, "utf-8");
  }

  public detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".mjs": "javascript",
      ".cjs": "javascript",
      ".py": "python",
      ".go": "go",
      ".rs": "rust",
      ".java": "java",
      ".json": "json",
      ".md": "markdown",
      ".yaml": "yaml",
      ".yml": "yaml",
    };

    return map[ext] ?? "text";
  }
}
