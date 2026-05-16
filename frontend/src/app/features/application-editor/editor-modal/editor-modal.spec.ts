import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditorModalComponent } from './editor-modal';
import { ApiService } from '../../../core/api/api.service';

describe('EditorModalComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'patch' | 'post' | 'getBlob'>>;

  beforeEach(async () => {
    window.history.replaceState(null, '', '/app');
    api = {
      get: jest.fn().mockResolvedValue({
        id: 'a1',
        status: 'OPEN',
        matchScore: 88,
        optimizedCv: { text: 'Profil\nAngular' },
        coverLetter: { formal: 'Formal', warm: 'Warm', brief: 'Kurz' },
        chosenVariant: 'formal',
        jobPosting: { parsedJson: { title: 'Frontend Dev', company: 'Acme' } },
      }),
      patch: jest.fn().mockResolvedValue({ id: 'a1' }),
      post: jest.fn().mockResolvedValue({ message: 'queued' }),
      getBlob: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditorModalComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/app');
  });

  it('renders nothing when appId is null', () => {
    const fixture = TestBed.createComponent(EditorModalComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
    expect(fixture.nativeElement.querySelector('.modal-panel')).toBeNull();
  });

  it('renders backdrop and dialog when appId is set', async () => {
    const fixture = TestBed.createComponent(EditorModalComponent);
    fixture.componentRef.setInput('appId', 'a1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.modal-backdrop')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.modal-panel')).not.toBeNull();
    expect(api.get).toHaveBeenCalledWith('/applications/a1');
  });

  it('syncs the URL while open and restores it on close', () => {
    const fixture = TestBed.createComponent(EditorModalComponent);
    fixture.componentRef.setInput('appId', 'a1');
    fixture.detectChanges();

    expect(window.location.pathname).toBe('/app/applications/a1');
    fixture.nativeElement.querySelector('.modal-backdrop').click();
    expect(window.location.pathname).toBe('/app');
  });

  it('emits closed when backdrop is clicked', () => {
    const fixture = TestBed.createComponent(EditorModalComponent);
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.componentRef.setInput('appId', 'a1');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.modal-backdrop').click();

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('emits closed when Escape is pressed', () => {
    const fixture = TestBed.createComponent(EditorModalComponent);
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.componentRef.setInput('appId', 'a1');
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('removes keydown listener on destroy', () => {
    const fixture = TestBed.createComponent(EditorModalComponent);
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.componentRef.setInput('appId', 'a1');
    fixture.detectChanges();

    fixture.destroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closedSpy).not.toHaveBeenCalled();
  });
});
