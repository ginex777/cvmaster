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
});
