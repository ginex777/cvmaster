import { TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
