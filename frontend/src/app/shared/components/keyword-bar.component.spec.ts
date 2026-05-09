import { TestBed } from '@angular/core/testing';
import { KeywordBarComponent } from './keyword-bar.component';

describe('KeywordBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KeywordBarComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(KeywordBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render matched and missing keywords', () => {
    const fixture = TestBed.createComponent(KeywordBarComponent);
    fixture.componentRef.setInput('matched', ['TypeScript', 'Angular']);
    fixture.componentRef.setInput('missing', ['Java']);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.keyword--match').length).toBe(2);
    expect(el.querySelectorAll('.keyword--miss').length).toBe(1);
  });
});
