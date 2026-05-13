import type { ZodSchema } from 'zod';
import type { LLMProvider } from './provider';

// Fallback provider — only for non-Art-9 data (see SPEC § 25.2)
export class ClaudeProvider implements LLMProvider {
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(private apiKey: string) {}

  async generate<T>(opts: { system: string; user: string; schema: ZodSchema<T>; model?: string }): Promise<T> {
    const model = opts.model ?? process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: opts.system,
        messages: [{ role: 'user', content: opts.user }],
      }),
    });
    if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
    const data = await res.json() as { content: Array<{ text: string }> };
    const raw = JSON.parse(data.content[0].text);
    return opts.schema.parse(raw);
  }
}
