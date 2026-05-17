import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  it('success() adds a success toast', () => {
    service.success('Gespeichert');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Gespeichert');
  });

  it('error() adds an error toast with 8s duration', () => {
    service.error('Fehler!');
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].duration).toBe(8000);
  });

  it('info() adds an info toast', () => {
    service.info('Hinweis');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('dismiss() removes a toast by id', () => {
    service.success('A');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
  });

  it('auto-dismisses after the toast duration', () => {
    service.success('Auto');
    expect(service.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(4000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('keeps at most 3 toasts visible', () => {
    service.success('A');
    service.success('B');
    service.success('C');
    service.success('D');
    expect(service.toasts()).toHaveLength(3);
  });
});
