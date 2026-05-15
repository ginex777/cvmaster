import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CvMiniPreviewModern } from './cv-mini-preview-modern';

describe('CvMiniPreviewModern', () => {
  let component: CvMiniPreviewModern;
  let fixture: ComponentFixture<CvMiniPreviewModern>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvMiniPreviewModern],
    }).compileComponents();

    fixture = TestBed.createComponent(CvMiniPreviewModern);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('marks the decorative preview as hidden from assistive technology', () => {
    expect(fixture.nativeElement.querySelector('.mini-modern[aria-hidden="true"]')).toBeTruthy();
  });
});
