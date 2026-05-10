import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvTemplatePicker } from './cv-template-picker';

describe('CvTemplatePicker', () => {
  let component: CvTemplatePicker;
  let fixture: ComponentFixture<CvTemplatePicker>;

  function create(template: 'classic' | 'modern' | 'editorial') {
    fixture = TestBed.createComponent(CvTemplatePicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('template', template);
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

  it('renders three template buttons', () => {
    create('modern');

    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(3);
  });

  it('marks the active template with aria-pressed', () => {
    create('editorial');

    const active = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button): button is HTMLButtonElement => button instanceof HTMLButtonElement && button.getAttribute('aria-pressed') === 'true');

    expect(active?.textContent?.trim()).toBe('Creative');
  });

  it('emits templateChange when a different option is clicked', () => {
    create('modern');
    const emitted: string[] = [];
    component.templateChange.subscribe(value => emitted.push(value));

    const classicButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button): button is HTMLButtonElement => button instanceof HTMLButtonElement && button.textContent?.trim() === 'Classic');
    classicButton?.click();

    expect(emitted).toEqual(['classic']);
  });
});
