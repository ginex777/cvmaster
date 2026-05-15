import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CvMiniPreviewExecutive } from './cv-mini-preview-executive';

describe('CvMiniPreviewExecutive', () => {
  let component: CvMiniPreviewExecutive;
  let fixture: ComponentFixture<CvMiniPreviewExecutive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvMiniPreviewExecutive],
    }).compileComponents();

    fixture = TestBed.createComponent(CvMiniPreviewExecutive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('marks the decorative preview as hidden from assistive technology', () => {
    expect(fixture.nativeElement.querySelector('.mini-executive[aria-hidden="true"]')).toBeTruthy();
  });
});
