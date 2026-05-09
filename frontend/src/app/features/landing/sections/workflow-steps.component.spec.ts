import { TestBed } from '@angular/core/testing';
import { WorkflowStepsComponent } from './workflow-steps.component';

describe('WorkflowStepsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkflowStepsComponent] }).compileComponents();
  });

  it('renders the three workflow steps', () => {
    const fixture = TestBed.createComponent(WorkflowStepsComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('CV hochladen');
    expect(text).toContain('Stellenanzeige einfügen');
    expect(text).toContain('Optimierte Bewerbung erhalten');
  });
});
