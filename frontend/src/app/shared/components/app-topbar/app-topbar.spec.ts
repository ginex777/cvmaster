import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { AppTopbarComponent } from './app-topbar';

describe('AppTopbarComponent', () => {
  let fixture: ComponentFixture<AppTopbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppTopbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppTopbarComponent);
    fixture.detectChanges();
  });

  it('renders with no crumbs by default', () => {
    const crumbs = fixture.nativeElement.querySelectorAll('.topbar__crumb');
    expect(crumbs.length).toBe(0);
  });

  it('renders breadcrumb items', () => {
    fixture.componentRef.setInput('crumbs', [{ label: 'Dashboard' }, { label: 'Bewerbungen' }]);
    fixture.detectChanges();
    const crumbs = fixture.nativeElement.querySelectorAll('.topbar__crumb');
    expect(crumbs.length).toBe(2);
    expect(crumbs[1].classList).toContain('topbar__crumb--current');
  });

  it('marks last crumb as aria-current=page', () => {
    fixture.componentRef.setInput('crumbs', [{ label: 'App' }, { label: 'Wizard' }]);
    fixture.detectChanges();
    const crumbs = fixture.nativeElement.querySelectorAll('.topbar__crumb');
    expect(crumbs[1].getAttribute('aria-current')).toBe('page');
    expect(crumbs[0].getAttribute('aria-current')).toBeNull();
  });

  it('emits commandPaletteRequested when search button clicked', () => {
    const spy = jest.fn();
    fixture.componentInstance.commandPaletteRequested.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.topbar__search');
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits notificationsRequested when bell button clicked', () => {
    const spy = jest.fn();
    fixture.componentInstance.notificationsRequested.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.topbar__icon-btn');
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not show unread dot by default', () => {
    const dot = fixture.nativeElement.querySelector('.topbar__dot');
    expect(dot).toBeNull();
  });

  it('shows unread dot when hasUnread is true', () => {
    fixture.componentRef.setInput('hasUnread', true);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.topbar__dot');
    expect(dot).not.toBeNull();
  });

  it('has search button with aria-label', () => {
    const btn = fixture.nativeElement.querySelector('.topbar__search');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });
});
