import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CvMiniPreviewMinimal } from './cv-mini-preview-minimal';

describe('CvMiniPreviewMinimal', () => {
  let component: CvMiniPreviewMinimal;
  let fixture: ComponentFixture<CvMiniPreviewMinimal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvMiniPreviewMinimal],
    }).compileComponents();

    fixture = TestBed.createComponent(CvMiniPreviewMinimal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('marks the decorative preview as hidden from assistive technology', () => {
    expect(fixture.nativeElement.querySelector('.mini-minimal[aria-hidden="true"]')).toBeTruthy();
  });
});
