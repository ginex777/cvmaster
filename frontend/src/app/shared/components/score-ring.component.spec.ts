import { TestBed } from '@angular/core/testing';
import { ScoreRingComponent } from './score-ring.component';

describe('ScoreRingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScoreRingComponent] }).compileComponents();
  });

  it('creates without errors', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 75);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the score value in aria label', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 85);
    fixture.detectChanges();
    expect(fixture.componentInstance.ariaLabel()).toBe('Match-Score: 85%');
  });

  it('uses offer color (high threshold) for score >= 80', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 85);
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeColor()).toBe('var(--status-offer)');
  });

  it('uses applied color (medium threshold) for score 60–79', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 70);
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeColor()).toBe('var(--status-applied)');
  });

  it('uses warn color (low threshold) for score < 60', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 45);
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeColor()).toBe('var(--warn)');
  });

  it('computes correct dashArray for given value', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 80);
    fixture.detectChanges();
    expect(fixture.componentInstance.dashArray()).toBe('80 20');
  });

  it('applies custom size to host element', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 88);
    fixture.componentRef.setInput('size', 42);
    fixture.detectChanges();
    const ring = fixture.nativeElement.querySelector('.score-ring') as HTMLElement;
    expect(ring.style.width).toBe('42px');
    expect(ring.style.height).toBe('42px');
  });

  it('uses thinner stroke for sizes below 50', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 80);
    fixture.componentRef.setInput('size', 40);
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeWidth()).toBe(3);
  });

  it('uses thicker stroke for sizes >= 50', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 80);
    fixture.componentRef.setInput('size', 64);
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeWidth()).toBe(4);
  });
});
