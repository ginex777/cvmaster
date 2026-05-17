import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { StatusPillComponent } from './status-pill';

describe('StatusPillComponent', () => {
  let fixture: ComponentFixture<StatusPillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPillComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusPillComponent);
    fixture.componentRef.setInput('status', 'APPLIED');
    fixture.detectChanges();
  });

  it('renders the status label', () => {
    expect(fixture.nativeElement.textContent).toContain('Beworben');
  });

  it('applies sm size by default', () => {
    const pill = fixture.nativeElement.querySelector('.pill');
    expect(pill.classList).not.toContain('pill--md');
  });

  it('applies md size when size input is md', () => {
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    const pill = fixture.nativeElement.querySelector('.pill');
    expect(pill.classList).toContain('pill--md');
  });

  it('shows correct label for each status', () => {
    const cases: Array<[string, string]> = [
      ['DRAFT', 'Entwurf'],
      ['APPLIED', 'Beworben'],
      ['INTERVIEW', 'Interview'],
      ['OFFER', 'Angebot'],
      ['REJECTED', 'Abgesagt'],
    ];
    for (const [status, label] of cases) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(label);
    }
  });

  it('has role=status for accessibility', () => {
    const pill = fixture.nativeElement.querySelector('[role="status"]');
    expect(pill).not.toBeNull();
  });
});
