import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EditorComponent);
    fixture.componentRef.setInput('id', 'test-uuid');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should accept a bullet suggestion', () => {
    const fixture = TestBed.createComponent(EditorComponent);
    fixture.componentRef.setInput('id', 'test-uuid');
    const bullet = { id: '1', text: 'original', suggested: 'improved', accepted: false };
    fixture.componentInstance.accept(bullet);
    expect(bullet.text).toBe('improved');
    expect(bullet.accepted).toBe(true);
  });
});
