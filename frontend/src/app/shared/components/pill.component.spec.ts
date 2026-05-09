import { TestBed } from '@angular/core/testing';
import { PillComponent } from './pill.component';

describe('PillComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PillComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PillComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
