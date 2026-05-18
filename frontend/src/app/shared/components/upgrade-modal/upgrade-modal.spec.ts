import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { UpgradeModal } from './upgrade-modal';

describe('UpgradeModal', () => {
  let component: UpgradeModal;
  let fixture: ComponentFixture<UpgradeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradeModal],
    }).compileComponents();

    fixture = TestBed.createComponent(UpgradeModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders a dialog with plan cards when open', () => {
    expect(fixture.nativeElement.querySelector('[role=dialog]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Pro');
  });

  it('emits upgradeRequested from the primary action', () => {
    const emit = jest.spyOn(component.upgradeRequested, 'emit');

    const button = fixture.nativeElement.querySelector('.modal__cta') as HTMLButtonElement;
    button.click();

    expect(emit).toHaveBeenCalled();
  });

  it('emits dismissed on Escape', () => {
    const emit = jest.spyOn(component.dismissed, 'emit');

    component.onEscape();

    expect(emit).toHaveBeenCalled();
  });
});
