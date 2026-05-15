import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CoverLetterTonePicker } from './cover-letter-tone-picker';
import type { CoverLetterTone } from './cover-letter-tone-picker';

describe('CoverLetterTonePicker', () => {
  let component: CoverLetterTonePicker;
  let fixture: ComponentFixture<CoverLetterTonePicker>;

  function create(tone: CoverLetterTone): void {
    fixture = TestBed.createComponent(CoverLetterTonePicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tone', tone);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoverLetterTonePicker],
    }).compileComponents();
  });

  it('creates', () => {
    create('formal');

    expect(component).toBeTruthy();
  });

  it('renders three tone options', () => {
    create('formal');

    expect(fixture.nativeElement.querySelectorAll('.tone__card')).toHaveLength(3);
  });

  it('marks the active tone with aria-pressed', () => {
    create('modern');

    const active = Array.from(fixture.nativeElement.querySelectorAll('[aria-pressed="true"]')) as HTMLElement[];
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('aria-label')).toContain('Modern');
  });

  it('emits toneChange when a different option is clicked', () => {
    create('formal');
    const emitted: CoverLetterTone[] = [];
    component.toneChange.subscribe(value => emitted.push(value));

    const creativeCard = Array.from(fixture.nativeElement.querySelectorAll('.tone__card'))
      .find((button): button is HTMLButtonElement =>
        button instanceof HTMLButtonElement && button.getAttribute('aria-label')?.includes('Kreativ') === true,
      );
    creativeCard?.click();

    expect(emitted).toEqual(['creative']);
  });

  it('shows an example sentence for each tone', () => {
    create('formal');

    expect(fixture.nativeElement.querySelectorAll('.tone__example')).toHaveLength(3);
  });
});
