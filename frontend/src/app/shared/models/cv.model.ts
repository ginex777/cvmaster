import type { CvTemplate } from '../components/cv-template-picker/cv-template-picker';

export interface CvExperience {
  company?: string;
  role?: string;
  period?: string;
  bullets?: string[];
}

export interface CvEducation {
  institution?: string;
  degree?: string;
  period?: string;
}

export interface CvParsedJson {
  summary?: string;
  skills?: string[];
  experience?: CvExperience[];
  education?: CvEducation[];
  languages?: string[];
}

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  template: CvTemplate;
  isPrimary?: boolean;
  parsedJson?: CvParsedJson;
  createdAt: string;
  updatedAt: string;
}
