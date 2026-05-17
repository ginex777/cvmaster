import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProLockComponent } from './pro-lock';
import { UpgradeService } from '../../services/upgrade.service';

const mockUpgrade = { request: jest.fn(), clear: jest.fn(), requested: jest.fn() };

describe('ProLockComponent', () => {
  beforeEach(async () => {
    mockUpgrade.request.mockClear();
    await TestBed.configureTestingModule({
      imports: [ProLockComponent],
      providers: [{ provide: UpgradeService, useValue: mockUpgrade }],
    }).compileComponents();
  });

  describe('pill mode (default)', () => {
    it('renders pill button', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.detectChanges();
      const pill = fixture.debugElement.query(By.css('.pro-lock__pill'));
      expect(pill).not.toBeNull();
    });

    it('shows PRO text', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('PRO');
    });

    it('calls upgradeService.request() on click', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.detectChanges();
      const pill = fixture.debugElement.query(By.css('.pro-lock__pill'));
      (pill.nativeElement as HTMLButtonElement).click();
      expect(mockUpgrade.request).toHaveBeenCalledTimes(1);
    });

    it('has aria-label matching tooltip input', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.componentRef.setInput('tooltip', 'Nur für Pro');
      fixture.detectChanges();
      const pill = fixture.debugElement.query(By.css('.pro-lock__pill'));
      expect(pill.nativeElement.getAttribute('aria-label')).toBe('Nur für Pro');
    });
  });

  describe('overlay mode', () => {
    it('renders overlay div', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.componentRef.setInput('mode', 'overlay');
      fixture.detectChanges();
      const overlay = fixture.debugElement.query(By.css('.pro-lock__overlay'));
      expect(overlay).not.toBeNull();
    });

    it('renders upgrade CTA button', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.componentRef.setInput('mode', 'overlay');
      fixture.detectChanges();
      const cta = fixture.debugElement.query(By.css('.pro-lock__cta'));
      expect(cta).not.toBeNull();
      expect(cta.nativeElement.textContent).toContain('upgraden');
    });

    it('calls upgradeService.request() when overlay clicked', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.componentRef.setInput('mode', 'overlay');
      fixture.detectChanges();
      const overlay = fixture.debugElement.query(By.css('.pro-lock__overlay'));
      (overlay.nativeElement as HTMLElement).click();
      expect(mockUpgrade.request).toHaveBeenCalledTimes(1);
    });

    it('shows tooltip text in overlay desc', () => {
      const fixture = TestBed.createComponent(ProLockComponent);
      fixture.componentRef.setInput('mode', 'overlay');
      fixture.componentRef.setInput('tooltip', 'Pro nötig');
      fixture.detectChanges();
      const desc = fixture.debugElement.query(By.css('.pro-lock__desc'));
      expect(desc.nativeElement.textContent).toContain('Pro nötig');
    });
  });
});
