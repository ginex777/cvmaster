export type CvLayout = 'classic' | 'modern' | 'editorial';

export interface CvPdfData {
  name: string;
  sections: Array<{ heading: string; lines: string[] }>;
}

export interface CvRenderer {
  render(data: CvPdfData): Promise<Uint8Array>;
}
