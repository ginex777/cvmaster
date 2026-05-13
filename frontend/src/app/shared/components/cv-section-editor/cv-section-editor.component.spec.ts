import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CvSectionEditorComponent } from './cv-section-editor.component';
import type { CvSection } from './cv-section-editor.component';

const mockSections: CvSection[] = [
  {
    id: 's1',
    heading: 'Erfahrung',
    bullets: [
      { id: 'b1', text: 'Angular-Entwicklung', originalText: 'Angular development', accepted: false },
      { id: 'b2', text: 'Backend-Integration', accepted: true },
    ],
  },
  {
    id: 's2',
    heading: 'Ausbildung',
    bullets: [{ id: 'b3', text: 'B.Sc. Informatik' }],
  },
];

async function setup(sections = mockSections) {
  await TestBed.configureTestingModule({
    imports: [CvSectionEditorComponent],
  }).compileComponents();
  const fixture = TestBed.createComponent(CvSectionEditorComponent);
  fixture.componentRef.setInput('sections', sections);
  fixture.detectChanges();
  return fixture;
}

describe('CvSectionEditorComponent', () => {
  it('renders section headings', async () => {
    const f = await setup();
    const inputs = f.debugElement.queryAll(By.css('.cv-section__heading-input'));
    const headings = inputs.map(i => (i.nativeElement as HTMLInputElement).value);
    expect(headings).toEqual(['Erfahrung', 'Ausbildung']);
  });

  it('renders bullet texts in textareas', async () => {
    const f = await setup();
    const textareas = f.debugElement.queryAll(By.css('.cv-bullet__text'));
    const texts = textareas.map(t => (t.nativeElement as HTMLTextAreaElement).value);
    expect(texts).toContain('Angular-Entwicklung');
    expect(texts).toContain('Backend-Integration');
    expect(texts).toContain('B.Sc. Informatik');
  });

  it('shows KI-Original toggle when originalText differs from text and not accepted', async () => {
    const f = await setup();
    const toggle = f.debugElement.query(By.css('.cv-bullet__original-toggle'));
    expect(toggle).not.toBeNull();
  });

  it('does not show KI-Original toggle when bullet is accepted', async () => {
    const f = await setup();
    const toggles = f.debugElement.queryAll(By.css('.cv-bullet__original-toggle'));
    expect(toggles).toHaveLength(1);
  });

  it('shows accepted badge for accepted bullets', async () => {
    const f = await setup();
    const badges = f.debugElement.queryAll(By.css('.cv-bullet__accepted'));
    expect(badges).toHaveLength(1);
  });

  it('emits sectionsChange on heading blur via emitSave', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.onHeadingInput(0, 'Berufserfahrung');
    f.componentInstance.emitSave();
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].heading).toBe('Berufserfahrung');
  });

  it('emits sectionsChange on bullet input via emitSave', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.onBulletInput(0, 0, 'Überarbeiteter Text');
    f.componentInstance.emitSave();
    expect(emitted[0][0].bullets[0].text).toBe('Überarbeiteter Text');
  });

  it('accepts bullet: sets accepted=true and removes originalText, then emits', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.acceptBullet(0, 0);
    const bullet = emitted[0][0].bullets[0];
    expect(bullet.accepted).toBe(true);
    expect(bullet.originalText).toBeUndefined();
  });

  it('rejects bullet: reverts text to originalText and emits', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.rejectBullet(0, 0);
    const bullet = emitted[0][0].bullets[0];
    expect(bullet.text).toBe('Angular development');
    expect(bullet.originalText).toBeUndefined();
  });

  it('adds a bullet to the section and emits', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.addBullet(0);
    expect(emitted[0][0].bullets).toHaveLength(3);
  });

  it('removes a bullet and emits', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.removeBullet(0, 0);
    expect(emitted[0][0].bullets).toHaveLength(1);
    expect(emitted[0][0].bullets[0].id).toBe('b2');
  });

  it('adds a new section and emits', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.addSection();
    expect(emitted[0]).toHaveLength(3);
    expect(emitted[0][2].heading).toBe('Neuer Abschnitt');
  });

  it('removes a section and emits', async () => {
    const f = await setup();
    const emitted: CvSection[][] = [];
    f.componentInstance.sectionsChange.subscribe((s: CvSection[]) => emitted.push(s));
    f.componentInstance.removeSection(0);
    expect(emitted[0]).toHaveLength(1);
    expect(emitted[0][0].id).toBe('s2');
  });

  it('re-initializes local state when section IDs change', async () => {
    const f = await setup([{ id: 's1', heading: 'Alt', bullets: [] }]);
    f.componentRef.setInput('sections', [{ id: 's-new', heading: 'Neu', bullets: [] }]);
    f.detectChanges();
    expect(f.componentInstance.local()[0].heading).toBe('Neu');
  });
});
