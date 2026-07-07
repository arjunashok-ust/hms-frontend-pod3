/**
 * @file node-form.ts
 * @description
 * This file defines a reusable form component for creating or editing a navigation menu node.
 *
 * @overview
 * This is a "dumb" or presentational component that receives its state via `@Input()` and communicates changes via `@Output()` events.
 * It contains a reactive form to capture the details of a menu node (name, path, icon, etc.).
 * The parent component (`NodeManagementComponent`) is responsible for handling the form submission.
 *
 * Connections:
 *   NodeManagementComponent -> (via @Input) -> NODE-FORM.TS -> (via @Output) -> NodeManagementComponent
 */
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-node-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './node-form.html',
  styleUrls: ['./node-form.css']
})
export class NodeFormComponent implements OnInit, OnChanges {
  @Input() node: any = null;
  @Output() save = new EventEmitter<any>();
  @Output() handleCancel = new EventEmitter<void>();

  nodeForm!: FormGroup;

  constructor(private readonly fb: FormBuilder) { }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node'] && !changes['node'].firstChange) {
      this.initForm();
    }
  }

  initForm() {
    this.nodeForm = this.fb.group({
      name: [this.node?.name || '', Validators.required],
      path: [this.node?.path || '', Validators.required],
      icon: [this.node?.icon || '', Validators.required],
      order: [this.node?.order || 1, [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit() {
    if (this.nodeForm.invalid) {
      this.nodeForm.markAllAsTouched();
      return;
    }

    // Auto-generate a key from the name if creating
    const formValue = this.nodeForm.value;
    if (!this.node) {
      formValue.key = formValue.name.toUpperCase().replaceAll(/\s+/g, '_');
    }

    this.save.emit(formValue);
  }
}