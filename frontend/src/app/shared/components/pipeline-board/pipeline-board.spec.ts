import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
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

  it('renders all five Atlas pipeline columns', async () => {
    await setup([]);
    const headings = Array.from(fixture.nativeElement.querySelectorAll('.pipeline__col-heading')) as HTMLElement[];
    const labels = headings.map(h => h.textContent?.trim() ?? '');
    expect(labels).toHaveLength(5);
    expect(labels.some(l => l.includes('Entwurf'))).toBe(true);
    expect(labels.some(l => l.includes('Beworben'))).toBe(true);
    expect(labels.some(l => l.includes('Interview'))).toBe(true);
    expect(labels.some(l => l.includes('Angebot'))).toBe(true);
    expect(labels.some(l => l.includes('Abgesagt'))).toBe(true);
  });

  it('sets status color variables on every column', async () => {
    await setup([]);
    const cols = Array.from(fixture.nativeElement.querySelectorAll('.pipeline__col')) as HTMLElement[];

    expect(cols).toHaveLength(5);
    expect(cols[0].style.getPropertyValue('--col-bg')).toBe('var(--status-draft-bg)');
    expect(cols[0].style.getPropertyValue('--col-color')).toBe('var(--status-draft)');
    expect(cols[2].style.getPropertyValue('--col-color')).toBe('var(--status-interview)');
  });

  it('renders the Atlas column header controls', async () => {
    await setup([makeApp({ status: 'OPEN' })]);

    expect(fixture.nativeElement.querySelectorAll('.pipeline__col-dot')).toHaveLength(5);
    expect(fixture.nativeElement.querySelectorAll('.pipeline__col-add')).toHaveLength(5);
    expect(fixture.nativeElement.querySelector('.pipeline__col-count')?.textContent.trim()).toBe('0');
  });

  it('places OPEN application in Beworben column through legacy mapping', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const appliedCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Beworben');
    expect((appliedCol as HTMLElement)?.textContent).toContain('Frontend Dev');
  });

  it('places SENT application in Beworben column through legacy mapping', async () => {
    await setup([makeApp({ status: 'SENT' })]);
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const appliedCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Beworben');
    expect((appliedCol as HTMLElement)?.textContent).toContain('Frontend Dev');
  });

  it('places REJECTED application in Abgesagt column', async () => {
    await setup([makeApp({ status: 'REJECTED' })]);
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const rejectedCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Abgesagt');
    expect((rejectedCol as HTMLElement)?.textContent).toContain('Frontend Dev');
  });

  it('emits statusChange when moving to another column', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const statusChanges: Array<{ id: string; status: string }> = [];
    component.statusChange.subscribe(e => statusChanges.push(e));

    const interviewColumn = component.columns().find(col => col.key === 'INTERVIEW');
    if (!interviewColumn) throw new Error('INTERVIEW column missing');
    component.moveToColumn(makeApp({ status: 'OPEN' }), interviewColumn);

    expect(statusChanges).toHaveLength(1);
    expect(statusChanges[0]).toEqual({ id: 'app-1', status: 'INTERVIEW' });
  });

  it('emits statusChange when a card is dropped into a new column', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const statusChanges: Array<{ id: string; status: string }> = [];
    component.statusChange.subscribe(e => statusChanges.push(e));
    const offerColumn = component.columns().find(col => col.key === 'OFFER');
    if (!offerColumn) throw new Error('OFFER column missing');

    component.onCardDropped({
      item: { data: makeApp({ status: 'OPEN' }) },
    } as CdkDragDrop<PipelineApplication[], PipelineApplication[], PipelineApplication>, offerColumn);

    expect(statusChanges).toEqual([{ id: 'app-1', status: 'OFFER' }]);
  });

  it('emits applicationOpen when the card title is clicked', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const opened: string[] = [];
    component.applicationOpen.subscribe(id => opened.push(id));

    const card = fixture.nativeElement.querySelector('.pipeline__card') as HTMLElement;
    card.click();

    expect(opened).toEqual(['app-1']);
  });

  it('does not emit statusChange if app is already in the target column', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    const statusChanges: unknown[] = [];
    component.statusChange.subscribe(e => statusChanges.push(e));

    const appliedColumn = component.columns().find(col => col.key === 'APPLIED');
    if (!appliedColumn) throw new Error('APPLIED column missing');
    component.moveToColumn(makeApp({ status: 'SENT' }), appliedColumn);

    expect(statusChanges).toHaveLength(0);
  });

  it('emits reminderChange with date string when reminder input changes', async () => {
    await setup([makeApp()]);
    const reminderChanges: Array<{ id: string; reminderAt: string | null }> = [];
    component.reminderChange.subscribe(e => reminderChanges.push(e));

    const input = document.createElement('input');
    input.value = '2026-06-15';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    component.onReminderInput(makeApp(), event);

    expect(reminderChanges).toHaveLength(1);
    expect(reminderChanges[0]).toEqual({ id: 'app-1', reminderAt: '2026-06-15' });
  });

  it('emits reminderChange with null when reminder input is cleared', async () => {
    await setup([makeApp({ reminderAt: '2026-06-01T00:00:00Z' })]);
    const reminderChanges: Array<{ id: string; reminderAt: string | null }> = [];
    component.reminderChange.subscribe(e => reminderChanges.push(e));

    const input = document.createElement('input');
    input.value = '';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    component.onReminderInput(makeApp(), event);

    expect(reminderChanges[0].reminderAt).toBeNull();
  });

  it('shows reminder pill when app has a reminderAt', async () => {
    await setup([makeApp({ reminderAt: '2026-06-01T00:00:00Z' })]);
    expect(fixture.nativeElement.querySelector('.pipeline__card-reminder')).toBeTruthy();
  });

  it('shows match score with correct class', async () => {
    await setup([makeApp({ matchScore: 90 })]);
    const score = fixture.nativeElement.querySelector('.score--high');
    expect(score).toBeTruthy();
    expect(score.textContent.trim()).toBe('90%');
  });

  it('renders Leer for empty columns', async () => {
    await setup([makeApp({ status: 'SENT' })]);
    const empties = Array.from(fixture.nativeElement.querySelectorAll('.pipeline__empty')) as HTMLElement[];
    expect(empties.length).toBeGreaterThan(0);
    expect(empties[0].textContent?.trim()).toBe('Leer');
  });

  it('shows company name on card', async () => {
    await setup([makeApp()]);
    const cards = fixture.nativeElement.querySelectorAll('.pipeline__card-co');
    expect(cards[0].textContent.trim()).toBe('Acme GmbH');
  });

  it('renders Atlas card layout with logo, date, role and score chip', async () => {
    await setup([makeApp({ status: 'OPEN', matchScore: 85 })]);

    const card = fixture.nativeElement.querySelector('.pipeline__card') as HTMLElement;
    expect(card.style.getPropertyValue('--card-color')).toBe('var(--status-applied)');
    expect(card.querySelector('lba-company-logo')).toBeTruthy();
    expect(card.querySelector('.pipeline__card-when')?.textContent).toContain('01.');
    expect(card.querySelector('.pipeline__card-role')?.textContent).toContain('Frontend Dev');
    expect(card.querySelector('.pipeline__card-score.score--high')).toBeTruthy();
  });

  describe('highlighting and dimming', () => {
    it('dims columns that have no applications', async () => {
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
      const appliedCol = Array.from(cols).find(col => col.getAttribute('aria-label') === 'Beworben') as HTMLElement | undefined;
      expect(appliedCol?.classList.contains('pipeline__col--dimmed')).toBe(false);
    });

    it('highlights query text in card title using innerHTML', async () => {
      await setup([makeApp({ status: 'OPEN' })]);
      fixture.componentRef.setInput('highlightQuery', 'Frontend');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.pipeline__card-role');
      expect(title?.innerHTML).toContain('<mark');
    });
  });
});
