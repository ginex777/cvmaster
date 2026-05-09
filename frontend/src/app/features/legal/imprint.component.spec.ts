import { TestBed } from '@angular/core/testing';
import { ImprintComponent } from './imprint.component';

describe('ImprintComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ImprintComponent] }).compileComponents();
  });
  it('should create', () => {
    expect(TestBed.createComponent(ImprintComponent).componentInstance).toBeTruthy();
  });
});
