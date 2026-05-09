import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders h1, navbar, and footer', () => {
    const fixture = TestBed.createComponent(TermsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Allgemeine');
    expect(fixture.debugElement.queryAll(By.directive(NavbarComponent)).length).toBe(1);
    expect(fixture.debugElement.queryAll(By.directive(FooterComponent)).length).toBe(1);
  });
});
