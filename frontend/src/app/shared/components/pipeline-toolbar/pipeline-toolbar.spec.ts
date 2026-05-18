import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { PipelineToolbar, type PipelineFilter } from './pipeline-toolbar';

describe('PipelineToolbar', () => {
  let fixture: ComponentFixture<PipelineToolbar>;
  let component: PipelineToolbar;

  function create(totalCount = 5) {
    fixture = TestBed.createComponent(PipelineToolbar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalCount', totalCount);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PipelineToolbar] }).compileComponents();
  });

  it('renders the Atlas filter chips', () => {
    create();
    expect(fixture.nativeElement.textContent).toContain('Alle Stati');
    expect(fixture.nativeElement.textContent).toContain('Score ≥ 80');
    expect(fixture.nativeElement.textContent).toContain('Mit Erinnerung');
  });

  it('emits filterChange with updated query when onQueryInput is called', () => {
    create();
    const emitted: PipelineFilter[] = [];
    component.filterChange.subscribe((v: PipelineFilter) => emitted.push(v));

    component.onQueryInput({ target: { value: 'Acme' } } as unknown as Event);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].query).toBe('Acme');
  });

  it('emits filterChange when minScore chip is toggled', () => {
    create();
    const emitted: PipelineFilter[] = [];
    component.filterChange.subscribe((v: PipelineFilter) => emitted.push(v));

    const chip = fixture.nativeElement.querySelector('[data-filter="minScore"]') as HTMLButtonElement;
    chip?.click();

    expect(emitted.length).toBeGreaterThan(0);
  });

  it('shows total count of applications', () => {
    create(7);
    expect(fixture.nativeElement.textContent).toContain('7');
  });

  it('shows active chip class when minScore filter is toggled', () => {
    create();
    component.toggleMinScore();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toolbar__chip--active')).toBeTruthy();
  });
});
