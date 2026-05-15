import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CvMiniPreviewEditorial } from './cv-mini-preview-editorial';

describe('CvMiniPreviewEditorial', () => {
  let component: CvMiniPreviewEditorial;
  let fixture: ComponentFixture<CvMiniPreviewEditorial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvMiniPreviewEditorial],
    }).compileComponents();

    fixture = TestBed.createComponent(CvMiniPreviewEditorial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('marks the decorative preview as hidden from assistive technology', () => {
    expect(fixture.nativeElement.querySelector('.mini-editorial[aria-hidden="true"]')).toBeTruthy();
  });
});
