import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { ConfirmDeleteModal } from './confirm-delete-modal';

describe('ConfirmDeleteModal', () => {
  let component: ConfirmDeleteModal;
  let fixture: ComponentFixture<ConfirmDeleteModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders a dialog when open', () => {
    expect(fixture.nativeElement.querySelector('[role=dialog]')).toBeTruthy();
  });

  it('emits confirmed when the danger button is clicked', () => {
    const emit = jest.spyOn(component.confirmed, 'emit');

    const button = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((item): item is HTMLButtonElement => item instanceof HTMLButtonElement && item.textContent?.includes('löschen'));
    button?.dispatchEvent(new Event('click'));

    expect(emit).toHaveBeenCalled();
  });

  it('emits cancelled on Escape', () => {
    const emit = jest.spyOn(component.cancelled, 'emit');

    component.onEscape();

    expect(emit).toHaveBeenCalled();
  });
});
