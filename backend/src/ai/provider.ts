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
    start:       z.string().optional(),
    end:         z.string().optional(),
    bullets:     z.array(z.object({
      id:     z.string(),
      text:   z.string(),
      reason: z.string().optional(),
    })),
  })),
  education:  z.array(z.object({
    institution: z.string(),
    degree:      z.string(),
    field:       z.string().optional(),
    end:         z.string().optional(),
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

// LinkedIn optimization output schema
export const LinkedInOptimizationSchema = z.object({
  headline:   z.string(),
  about:      z.string(),
  experience: z.array(z.object({
    role:            z.string(),
    company:         z.string(),
    improvedBullets: z.array(z.string()),
  })),
});

export type LinkedInOptimization = z.infer<typeof LinkedInOptimizationSchema>;
