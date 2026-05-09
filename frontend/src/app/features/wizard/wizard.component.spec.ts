import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WizardComponent } from './wizard.component';

describe('WizardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(WizardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
