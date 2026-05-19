import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette';

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is closed by default', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('shows static items when query is empty', () => {
    component.query.set('');
    fixture.detectChanges();
    expect(component.filteredStatic().length).toBeGreaterThan(0);
  });

  it('filters static items by query', () => {
    component.query.set('Pipeline');
    fixture.detectChanges();
    const items = component.filteredStatic();
    expect(items.every((i: { label: string }) => i.label.toLowerCase().includes('pipeline'))).toBe(true);
  });

  it('returns empty list for unknown query', () => {
    component.query.set('xyzxyzxyz');
    fixture.detectChanges();
    expect(component.hasResults()).toBe(false);
  });

  it('renders the dialog element with aria-label', () => {
    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-label')).toBe('Befehlspalette');
  });

  it('has aria-modal=true on dialog', () => {
    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('opens when the shared document event is requested', () => {
    const open = jest.spyOn(component, 'open').mockResolvedValue(undefined);

    component.onOpenRequested();

    expect(open).toHaveBeenCalledTimes(1);
  });
});
