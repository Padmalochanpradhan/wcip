import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../../services/survey.service';
import { Location } from '../../../models/survey.models';

@Component({
  selector: 'app-survey-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './survey-form-dialog.html',
  styleUrl: './survey-form-dialog.css'
})
export class SurveyFormDialog implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMsg = '';
  isEdit = false;

  locations: Location[] = [];
  locationsLoading = false;

  readonly surveyTypes = ['narrative', 'environmental', 'general'];
  readonly icons = ['pencil', 'scan', 'leaf', 'building', 'map', 'camera', 'heart', 'target'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<SurveyFormDialog>,
    private readonly surveyService: SurveyService
  ) {}

  async ngOnInit() {
    this.isEdit = !!this.data?.survey;
    const s = this.data?.survey;
    // Coerce to number — MySQL returns integers as strings via JSON
    const locationId = s?.location_id ? Number(s.location_id) : null;

    this.form = this.fb.group({
      title:        [s?.title        || '', Validators.required],
      short_title:  [s?.short_title  || '', Validators.maxLength(60)],
      description:  [s?.description  || ''],
      survey_type:  [s?.survey_type  || 'general', Validators.required],
      icon:         [s?.icon         || 'pencil'],
      daily_prompt: [s?.daily_prompt || ''],
      status:       [s?.status       || 'draft', Validators.required],
      location_id:  [locationId],
    });

    this.locationsLoading = true;
    try {
      this.locations = await this.surveyService.getLocations();
      // Re-patch after options load so mat-select can match the value
      if (locationId) {
        this.form.patchValue({ location_id: locationId });
      }
    } finally {
      this.locationsLoading = false;
    }
  }

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    try {
      const payload: any = { ...this.form.value };
      if (this.isEdit) {
        payload.action = 'update_survey';
        payload.id = this.data.survey.id;
      } else {
        payload.action = 'create_survey';
        payload.slug = this.form.value.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      await this.surveyService.manageSurvey(payload);
      this.dialogRef.close({ refresh: true });
    } catch (err: any) {
      this.errorMsg = err?.message || 'Failed to save survey.';
    } finally {
      this.isLoading = false;
    }
  }

  close() { this.dialogRef.close({ refresh: false }); }
}
