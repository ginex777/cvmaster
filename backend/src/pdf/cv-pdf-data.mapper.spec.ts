import { describe, expect, it } from '@jest/globals';
import { toCvPdfData } from './cv-pdf-data.mapper';
import type { ParsedCV } from '../ai/provider';

describe('toCvPdfData', () => {
  it('maps AI ParsedCV output into renderer sections', () => {
    const parsedCv: ParsedCV = {
      name: 'Lina Hartmann',
      email: 'lina@example.de',
      phone: '+49 6221 123456',
      location: 'Heidelberg',
      summary: 'Frontend Entwicklerin mit Angular Fokus.',
      experience: [{
        id: 'exp1',
        company: 'Acme GmbH',
        role: 'Frontend Developer',
        start: '2023',
        end: 'heute',
        bullets: [{ id: 'b1', text: 'Angular Design-System aufgebaut.' }],
      }],
      education: [{
        institution: 'Universität Heidelberg',
        degree: 'B.Sc.',
        field: 'Informatik',
        end: '2022',
      }],
      skills: ['Angular', 'TypeScript'],
      languages: [{ name: 'Deutsch', level: 'C2' }],
      certifications: ['AWS Cloud Practitioner'],
    };

    const result = toCvPdfData(parsedCv, 'Fallback');

    expect(result.name).toBe('Lina Hartmann');
    expect(result.sections).toEqual([
      { heading: 'Kontakt', lines: ['lina@example.de', '+49 6221 123456', 'Heidelberg'] },
      { heading: 'Profil', lines: ['Frontend Entwicklerin mit Angular Fokus.'] },
      { heading: 'Frontend Developer @ Acme GmbH', lines: ['2023 - heute', 'Angular Design-System aufgebaut.'] },
      { heading: 'Ausbildung', lines: ['B.Sc. Informatik - Universität Heidelberg bis 2022'] },
      { heading: 'Skills', lines: ['Angular, TypeScript'] },
      { heading: 'Sprachen', lines: ['Deutsch - C2'] },
      { heading: 'Zertifikate', lines: ['AWS Cloud Practitioner'] },
    ]);
  });

  it('maps editor sections with bullets into renderer lines', () => {
    const result = toCvPdfData({
      sections: [{
        id: 'section-1',
        heading: 'Erfahrung',
        bullets: [
          { id: 'bullet-1', text: 'Match-Score von 42 auf 91 erhöht.' },
          { id: 'bullet-2', text: 'React und TypeScript im Projekt eingesetzt.' },
        ],
      }],
    }, 'Lebenslauf_Acme_Dev');

    expect(result).toEqual({
      name: 'Lebenslauf_Acme_Dev',
      sections: [{
        heading: 'Erfahrung',
        lines: [
          'Match-Score von 42 auf 91 erhöht.',
          'React und TypeScript im Projekt eingesetzt.',
        ],
      }],
    });
  });

  it('keeps legacy PDF sections with lines intact', () => {
    expect(toCvPdfData({
      name: 'Legacy CV',
      sections: [{ heading: 'Profil', lines: ['Angular'] }],
    })).toEqual({
      name: 'Legacy CV',
      sections: [{ heading: 'Profil', lines: ['Angular'] }],
    });
  });
});
