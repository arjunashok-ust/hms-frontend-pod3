import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordDetailsModalComponent } from './record-modal';

describe('RecordModal', () => {
  let component: RecordDetailsModalComponent;
  let fixture: ComponentFixture<RecordDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordDetailsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordDetailsModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
