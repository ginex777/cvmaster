import type { ZodSchema } from 'zod';
import type { LLMProvider } from './provider';

export class MistralProvider implements LLMProvider {
  private baseUrl = 'https://api.mistral.ai/v1';

  constructor(private apiKey: string) {}

  async generate<T>(opts: { system: string; user: string; schema: ZodSchema<T>; model?: string }): Promise<T> {
    const model = opts.model ?? 'mistral-small-latest';
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user',   content: opts.user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Mistral error ${res.status}: ${await res.text()}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw = JSON.parse(data.choices[0].message.content);
    return opts.schema.parse(raw);
  }
}
