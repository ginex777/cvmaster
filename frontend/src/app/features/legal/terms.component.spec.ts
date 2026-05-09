import { TestBed } from '@angular/core/testing';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TermsComponent] }).compileComponents();
  });
  it('should create', () => {
    expect(TestBed.createComponent(TermsComponent).componentInstance).toBeTruthy();
  });
});
