import { TestBed } from '@angular/core/testing';
import { ScoreRingComponent } from './score-ring.component';

describe('ScoreRingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScoreRingComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 75);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should use success color for score >= 80', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 85);
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeColor()).toBe('var(--success)');
  });

  it('supports a custom rendered size', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 88);
    fixture.componentRef.setInput('size', 42);
    fixture.detectChanges();

    const ring = fixture.nativeElement.querySelector('.score-ring') as HTMLElement;
    expect(ring.style.width).toBe('42px');
    expect(ring.style.height).toBe('42px');
  });
});
