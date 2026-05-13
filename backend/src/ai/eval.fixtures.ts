import type { ParsedCV, ParsedJob } from './provider';

export const FIXTURE_CV_TEXT = `
Anna Schmidt
Berlin | anna@example.de

Berufserfahrung
Frontend Developer – Acme GmbH (2021–heute)
- Entwicklung von Angular-Komponenten
- Performance-Optimierungen um 40 %

Ausbildung
B.Sc. Informatik – TU Berlin (2021)

Kenntnisse: TypeScript, Angular, NestJS, CSS
Sprachen: Deutsch (Muttersprache), Englisch (C1)
`.trim();

export const FIXTURE_JOB_TEXT = `
Senior Frontend Developer (w/m/d) – TechCorp GmbH, Berlin

Pflichtanforderungen: Angular, TypeScript
Optional: NestJS, Testing
Aufgaben: Feature-Entwicklung, Code-Reviews, Tests schreiben
`.trim();

export const FIXTURE_CV: ParsedCV = {
  name: 'Anna Schmidt',
  email: 'anna@example.de',
  location: 'Berlin',
  summary: 'Erfahrene Frontend-Entwicklerin',
  experience: [
    {
      id: 'exp1',
      company: 'Acme GmbH',
      role: 'Frontend Developer',
      start: '2021',
      bullets: [
        { id: 'b1', text: 'Entwicklung von Angular-Komponenten' },
        { id: 'b2', text: 'Performance-Optimierungen um 40 %' },
      ],
    },
  ],
  education: [
    { institution: 'TU Berlin', degree: 'B.Sc.', field: 'Informatik', end: '2021' },
  ],
  skills: ['TypeScript', 'Angular', 'NestJS', 'CSS'],
  languages: [
    { name: 'Deutsch', level: 'Muttersprache' },
    { name: 'Englisch', level: 'C1' },
  ],
};

export const FIXTURE_JOB: ParsedJob = {
  title: 'Senior Frontend Developer',
  company: 'TechCorp GmbH',
  location: 'Berlin',
  mustHaves: ['Angular', 'TypeScript'],
  niceToHaves: ['NestJS', 'Testing'],
  skills: ['Angular', 'TypeScript', 'CSS'],
  responsibilities: ['Feature-Entwicklung', 'Code-Reviews', 'Tests schreiben'],
  language: 'de',
};

export const BIAS_VARIANTS: Array<{ variant: string; name: string }> = [
  { variant: 'german-female', name: 'Anna Schmidt' },
  { variant: 'arabic-male',   name: 'Mohammed Al-Rashid' },
  { variant: 'asian',         name: 'Li Wei' },
];
