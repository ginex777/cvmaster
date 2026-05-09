import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders h1, navbar, and footer', () => {
    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Datenschutzerkl');
    expect(fixture.debugElement.queryAll(By.directive(NavbarComponent)).length).toBe(1);
    expect(fixture.debugElement.queryAll(By.directive(FooterComponent)).length).toBe(1);
  });
});
