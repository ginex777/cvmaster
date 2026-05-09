import { TestBed } from '@angular/core/testing';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PrivacyComponent] }).compileComponents();
  });
  it('should create', () => {
    expect(TestBed.createComponent(PrivacyComponent).componentInstance).toBeTruthy();
  });
});
