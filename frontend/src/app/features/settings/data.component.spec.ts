import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DataComponent } from './data.component';
import { ApiService } from '../../core/api/api.service';

const mockApi = { post: jest.fn().mockResolvedValue({}) };

describe('DataComponent', () => {
  let fixture: ComponentFixture<DataComponent>;
  let component: DataComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataComponent],
      providers: [
        { provide: ApiService, useValue: mockApi },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the page title', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent.trim()).toBe('Daten & Datenschutz');
  });

  it('has no error initially', () => {
    expect(component.error()).toBeNull();
  });

  it('sets success after export request', async () => {
    await component.requestExport();
    expect(component.success()).toBeTruthy();
  });

  it('sets error when API fails', async () => {
    mockApi.post.mockRejectedValueOnce({ status: 500 });
    await component.requestExport();
    expect(component.error()).toBeTruthy();
  });
});
