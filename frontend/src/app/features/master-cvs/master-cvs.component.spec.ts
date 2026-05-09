import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MasterCvsComponent } from './master-cvs.component';

describe('MasterCvsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterCvsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MasterCvsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
