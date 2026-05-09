import { z } from 'zod';
import type { ZodSchema } from 'zod';

export interface LLMProvider {
  generate<T>(opts: {
    system: string;
    user: string;
    schema: ZodSchema<T>;
    model?: string;
  }): Promise<T>;
}

// ParsedCV shape — output of CV-Parser LLM call
export const ParsedCVSchema = z.object({
  name:       z.string(),
  email:      z.string().optional(),
  phone:      z.string().optional(),
  location:   z.string().optional(),
  summary:    z.string().optional(),
  experience: z.array(z.object({
    id:          z.string(),
    company:     z.string(),
    role:        z.string(),
    start:       z.string().nullish().transform(v => v ?? ''),
    end:         z.string().nullish().transform(v => v ?? undefined),
    bullets:     z.array(z.object({ id: z.string(), text: z.string() })),
  })),
  education:  z.array(z.object({
    institution: z.string(),
    degree:      z.string(),
    field:       z.string().nullish().transform(v => v ?? undefined),
    end:         z.string().nullish().transform(v => v ?? undefined),
  })),
  skills:     z.array(z.string()),
  languages:  z.array(z.object({ name: z.string(), level: z.string() })),
  certifications: z.array(z.string()).optional(),
  hasPhoto:   z.boolean().optional(),
});

export type ParsedCV = z.infer<typeof ParsedCVSchema>;

// ParsedJob shape — output of Job-Parser LLM call
export const ParsedJobSchema = z.object({
  title:        z.string(),
  company:      z.string().optional(),
  location:     z.string().optional(),
  mustHaves:    z.array(z.string()),
  niceToHaves:  z.array(z.string()),
  skills:       z.array(z.string()),
  responsibilities: z.array(z.string()),
  language:     z.enum(['de', 'en']),
});

export type ParsedJob = z.infer<typeof ParsedJobSchema>;
