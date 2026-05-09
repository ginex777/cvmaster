import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders footer columns and copyright', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('PRODUKT');
    expect(text).toContain('RESSOURCEN');
    expect(text).toContain('RECHTLICHES');
    expect(text).toContain('© 2026 Lebenslauf-Agent GmbH');
  });
});
