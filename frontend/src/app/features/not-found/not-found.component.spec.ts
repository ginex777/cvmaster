import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders 404 text and a link to the homepage', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('404');
    expect(fixture.nativeElement.querySelector('a[routerLink="/"]')).toBeTruthy();
  });
});
