import { Ollama } from "ollama";
import type { ILLM } from "../../domain/interfaces/ILLM.js";

export class OllamaLLM implements ILLM {
  private readonly client: Ollama;

  public constructor(
    private readonly model: string,
    private readonly temperature: number,
  ) {
    this.client = new Ollama();
  }

  public async generate(prompt: string): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      options: { temperature: this.temperature },
    });

    return response.message.content;
  }

  public async *stream(prompt: string): AsyncIterable<string> {
    const stream = await this.client.chat({
      model: this.model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
      options: { temperature: this.temperature },
    });

    for await (const chunk of stream) {
      if (chunk.message.content) {
        yield chunk.message.content;
      }
    }
  }
}
