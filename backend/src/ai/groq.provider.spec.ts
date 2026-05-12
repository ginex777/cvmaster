import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { z } from 'zod';
import { GroqProvider } from './groq.provider';

describe('GroqProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('adds explicit JSON instructions for Groq JSON Object Mode', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"name":"Ada"}' } }],
      }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new GroqProvider('test-key');
    await provider.generate({
      system: 'Extract a person.',
      user: 'Ada Lovelace',
      schema: z.object({ name: z.string() }),
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string) as {
      response_format: { type: string };
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0].content).toContain('Respond only with a valid JSON object.');
    expect(body.messages[0].content).toContain('Extract a person.');
  });

  it('surfaces Groq HTTP error details', async () => {
    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'json instructions required',
    } as Response);

    const provider = new GroqProvider('test-key');

    await expect(provider.generate({
      system: 'Extract.',
      user: 'Ada',
      schema: z.object({ name: z.string() }),
    })).rejects.toThrow('Groq error 400: json instructions required');
  });
});
