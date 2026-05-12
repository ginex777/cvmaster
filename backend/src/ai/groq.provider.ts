import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import type { LLMProvider } from './provider';

interface GroqResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

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

function jsonInstruction(schemaName = 'the requested schema'): string {
  return [
    'Respond only with a valid JSON object.',
    `The JSON object must match ${schemaName}.`,
    'Do not include markdown, code fences, prose, or comments.',
  ].join(' ');
}

export class GroqProvider implements LLMProvider {
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(private apiKey: string) {}

  async generate<T>(opts: { system: string; user: string; schema: ZodSchema<T>; model?: string }): Promise<T> {
    const model = opts.model ?? process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${jsonInstruction(opts.schema.description)}\n\n${opts.system}` },
          { role: 'user',   content: opts.user },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as GroqResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq error: response did not include message content');
    }

    try {
      const raw = normalizeNulls(JSON.parse(content));
      return opts.schema.parse(raw);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new Error(`Groq schema validation failed: ${error.message}`);
      }

      if (error instanceof SyntaxError) {
        throw new Error(`Groq returned invalid JSON: ${content.slice(0, 500)}`);
      }

      throw error;
    }
  }
}
