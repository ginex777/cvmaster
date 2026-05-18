import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CvTemplatePicker } from './cv-template-picker';
import type { CvTemplate } from './cv-template-picker';

describe('CvTemplatePicker', () => {
  let component: CvTemplatePicker;
  let fixture: ComponentFixture<CvTemplatePicker>;

  function create(template: CvTemplate) {
    fixture = TestBed.createComponent(CvTemplatePicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();
  }

  function openDropdown(): void {
    const trigger = fixture.nativeElement.querySelector('.picker__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvTemplatePicker],
    }).compileComponents();
  });

  it('creates', () => {
    create('modern');

    expect(component).toBeTruthy();
  });

  it('renders five template cards', () => {
    create('modern');
    openDropdown();

    expect(fixture.nativeElement.querySelectorAll('.picker__card')).toHaveLength(5);
  });

  it('marks the active template with aria-selected', () => {
    create('minimal');
    openDropdown();

    const active = Array.from(fixture.nativeElement.querySelectorAll('.picker__card'))
      .find((button): button is HTMLButtonElement => button instanceof HTMLButtonElement && button.getAttribute('aria-selected') === 'true');

    expect(active?.getAttribute('aria-label')).toContain('Minimal');
  });

  it('emits templateChange when a different option is clicked', () => {
    create('modern');
    openDropdown();
    const emitted: string[] = [];
    component.templateChange.subscribe(value => emitted.push(value));

    const executiveButton = Array.from(fixture.nativeElement.querySelectorAll('.picker__card'))
      .find((button): button is HTMLButtonElement =>
        button instanceof HTMLButtonElement && button.getAttribute('aria-label')?.includes('Executive') === true,
      );
    executiveButton?.click();

    expect(emitted).toEqual(['executive']);
  });

  it('renders a mini-preview for every template option', () => {
    create('classic');
    openDropdown();

    expect(fixture.nativeElement.querySelectorAll('.picker__card-preview')).toHaveLength(5);
  });
});
