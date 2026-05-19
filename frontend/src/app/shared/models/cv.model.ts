import type { CvTemplate } from '../components/cv-template-picker/cv-template-picker';

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  template: CvTemplate;
  isPrimary?: boolean;
  parsedJson?: {
    summary?: string;
    skills?: string[];
  };
  createdAt: string;
  updatedAt: string;
}
