import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../../services/survey.service';

@Component({
  selector: 'app-section-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './section-form-dialog.html'
})
export class SectionFormDialog implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMsg = '';
  isEdit = false;

  readonly icons = ['building', 'house', 'environment', 'exposure', 'safety', 'transport', 'food', 'green', 'leaf', 'climate', 'experience', 'narrative', 'pencil'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<SectionFormDialog>,
    private readonly surveyService: SurveyService
  ) {}

  ngOnInit() {
    this.isEdit = !!this.data?.section;
    const s = this.data?.section;
    this.form = this.fb.group({
      title:          [s?.title          || '', Validators.required],
      subtitle:       [s?.subtitle       || ''],
      icon:           [s?.icon           || ''],
      badge_label:    [s?.badge_label    || ''],
      is_collapsible: [s?.is_collapsible ?? true],
      is_required:    [s?.is_required    ?? false],
      display_order:  [s?.display_order  ?? this.data?.displayOrder ?? 1],
    });
  }

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    try {
      const payload: any = { ...this.form.value };
      if (this.isEdit) {
        payload.action = 'update_section';
        payload.id = this.data.section.id;
      } else {
        payload.action = 'create_section';
        payload.survey_id = this.data.surveyId;
      }
      await this.surveyService.manageSurvey(payload);
      this.dialogRef.close({ refresh: true });
    } catch (err: any) {
      this.errorMsg = err?.message || 'Failed to save section.';
    } finally {
      this.isLoading = false;
    }
  }

  close() { this.dialogRef.close({ refresh: false }); }
}
