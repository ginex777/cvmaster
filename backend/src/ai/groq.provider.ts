import type { ZodSchema } from 'zod';
import type { LLMProvider } from './provider';

function normalizeNulls(v: unknown): unknown {
  if (v === null) return undefined;
  if (Array.isArray(v)) return v.map(normalizeNulls);
  if (typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, normalizeNulls(val)])
    );
  }
  return v;
}

export class GroqProvider implements LLMProvider {
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(private apiKey: string) {}

  async generate<T>(opts: { system: string; user: string; schema: ZodSchema<T>; model?: string }): Promise<T> {
    const model = opts.model ?? 'llama-3.3-70b-versatile';
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
    if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw = normalizeNulls(JSON.parse(data.choices[0].message.content));
    return opts.schema.parse(raw);
  }
}
