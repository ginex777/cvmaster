import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CvMiniPreviewClassic } from './cv-mini-preview-classic';

describe('CvMiniPreviewClassic', () => {
  let component: CvMiniPreviewClassic;
  let fixture: ComponentFixture<CvMiniPreviewClassic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvMiniPreviewClassic],
    }).compileComponents();

    fixture = TestBed.createComponent(CvMiniPreviewClassic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('marks the decorative preview as hidden from assistive technology', () => {
    expect(fixture.nativeElement.querySelector('.mini-classic[aria-hidden="true"]')).toBeTruthy();
  });
});
