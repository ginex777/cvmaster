import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PipelineBoard, type PipelineApplication } from './pipeline-board';

const makeApp = (overrides?: Partial<PipelineApplication>): PipelineApplication => ({
  id: 'app-1',
  status: 'OPEN',
  matchScore: 85,
  createdAt: '2026-05-01T00:00:00Z',
  reminderAt: null,
  jobPosting: { parsedJson: { title: 'Frontend Dev', company: 'Acme GmbH' } },
  ...overrides,
});

describe('PipelineBoard', () => {
  let fixture: ComponentFixture<PipelineBoard>;
  let component: PipelineBoard;

  const setup = async (apps: PipelineApplication[]) => {
    await TestBed.configureTestingModule({
      imports: [PipelineBoard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PipelineBoard);
    fixture.componentRef.setInput('applications', apps);
    fixture.detectChanges();
    component = fixture.componentInstance;
  };

  it('renders all six pipeline columns', async () => {
    await setup([]);
    const headings = Array.from(fixture.nativeElement.querySelectorAll('.pipeline__col-heading')) as HTMLElement[];
    const labels = headings.map(h => h.textContent?.trim() ?? '');
    expect(labels.some(l => l.includes('Offen'))).toBe(true);
    expect(labels.some(l => l.includes('Gesendet'))).toBe(true);
    expect(labels.some(l => l.includes('Interview'))).toBe(true);
    expect(labels.some(l => l.includes('Absage'))).toBe(true);
  });

  it('places OPEN application in Offen column', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const offenCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Offen');
    expect((offenCol as HTMLElement)?.textContent).toContain('Frontend Dev');
  });

  it('places SENT application in Gesendet column', async () => {
    await setup([makeApp({ status: 'SENT' })]);
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const sentCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Gesendet');
    expect((sentCol as HTMLElement)?.textContent).toContain('Frontend Dev');
  });

  it('places REJECTED application in Absage column', async () => {
    await setup([makeApp({ status: 'REJECTED' })]);
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const rejectedCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Absage');
    expect((rejectedCol as HTMLElement)?.textContent).toContain('Frontend Dev');
  });

  it('emits statusChange when move button is clicked', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const statusChanges: Array<{ id: string; status: string }> = [];
    component.statusChange.subscribe(e => statusChanges.push(e));

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.pipeline__move-btn')) as HTMLButtonElement[];
    buttons.find(b => b.getAttribute('aria-label')?.includes('Gesendet'))?.click();
    fixture.detectChanges();

    expect(statusChanges).toHaveLength(1);
    expect(statusChanges[0]).toEqual({ id: 'app-1', status: 'SENT' });
  });

  it('does not emit statusChange if app is already in the target column', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const statusChanges: unknown[] = [];
    component.statusChange.subscribe(e => statusChanges.push(e));

    component.moveToColumn(makeApp({ status: 'SENT' }), { key: 'sent', label: 'Gesendet', statuses: ['SENT'] });

    expect(statusChanges).toHaveLength(0);
  });

  it('emits reminderChange with date string when reminder input changes', async () => {
    await setup([makeApp()]);
    const reminderChanges: Array<{ id: string; reminderAt: string | null }> = [];
    component.reminderChange.subscribe(e => reminderChanges.push(e));

    const input = fixture.nativeElement.querySelector('.pipeline__reminder-input') as HTMLInputElement;
    input.value = '2026-06-15';
    input.dispatchEvent(new Event('change'));

    expect(reminderChanges).toHaveLength(1);
    expect(reminderChanges[0]).toEqual({ id: 'app-1', reminderAt: '2026-06-15' });
  });

  it('emits reminderChange with null when reminder input is cleared', async () => {
    await setup([makeApp({ reminderAt: '2026-06-01T00:00:00Z' })]);
    const reminderChanges: Array<{ id: string; reminderAt: string | null }> = [];
    component.reminderChange.subscribe(e => reminderChanges.push(e));

    const input = fixture.nativeElement.querySelector('.pipeline__reminder-input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('change'));

    expect(reminderChanges[0].reminderAt).toBeNull();
  });

  it('shows reminder dot when app has a reminderAt', async () => {
    await setup([makeApp({ reminderAt: '2026-06-01T00:00:00Z' })]);
    expect(fixture.nativeElement.querySelector('.pipeline__reminder-dot')).toBeTruthy();
  });

  it('shows match score with correct class', async () => {
    await setup([makeApp({ matchScore: 90 })]);
    const score = fixture.nativeElement.querySelector('.score--high');
    expect(score).toBeTruthy();
    expect(score.textContent.trim()).toBe('90%');
  });

  it('renders dash for empty columns', async () => {
    await setup([makeApp({ status: 'SENT' })]);
    const empties = Array.from(fixture.nativeElement.querySelectorAll('.pipeline__empty')) as HTMLElement[];
    expect(empties.length).toBeGreaterThan(0);
  });

  it('shows company name on card', async () => {
    await setup([makeApp()]);
    const cards = fixture.nativeElement.querySelectorAll('.pipeline__card-company');
    expect(cards[0].textContent.trim()).toBe('Acme GmbH');
  });

  describe('highlighting and dimming', () => {
    it('dims columns with no apps after filtering', async () => {
      await setup([makeApp({ status: 'OPEN' })]);
      fixture.componentRef.setInput('highlightQuery', '');
      fixture.detectChanges();

      // Any column that has no apps should be dimmed
      const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeListOf<HTMLElement>;
      const dimmedCols = Array.from(cols).filter(col => col.classList.contains('pipeline__col--dimmed'));
      expect(dimmedCols.length).toBeGreaterThan(0);
    });

    it('does not dim the column that has apps', async () => {
      await setup([makeApp({ status: 'OPEN' })]);
      fixture.componentRef.setInput('highlightQuery', '');
      fixture.detectChanges();

      const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeListOf<HTMLElement>;
      const openCol = Array.from(cols).find(col => col.getAttribute('aria-label') === 'Offen') as HTMLElement | undefined;
      expect(openCol?.classList.contains('pipeline__col--dimmed')).toBe(false);
    });

    it('highlights query text in card title using innerHTML', async () => {
      await setup([makeApp({ status: 'OPEN' })]);
      fixture.componentRef.setInput('highlightQuery', 'Frontend');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.pipeline__card-title');
      expect(title?.innerHTML).toContain('<mark');
    });
  });
});
