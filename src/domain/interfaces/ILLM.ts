export interface ILLM {
  generate(prompt: string): Promise<string>;
  stream?(prompt: string): AsyncIterable<string>;
}
