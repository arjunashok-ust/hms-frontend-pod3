import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeManagementComponent } from './node-management';

describe('NodeManagementComponent', () => {
  let component: NodeManagementComponent;
  let fixture: ComponentFixture<NodeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeManagementComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
