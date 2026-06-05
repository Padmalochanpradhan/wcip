import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../../../services/survey.service';

@Component({
  selector: 'app-question-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './question-form-dialog.html'
})
export class QuestionFormDialog implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMsg = '';
  isEdit = false;

  readonly questionTypes = ['text','textarea','dropdown','single_chip','multi_chip','number','date','boolean'];
  readonly colorVariants = ['positive','neutral','warning','critical','info'];

  get needsOptions(): boolean {
    const t = this.form?.get('question_type')?.value;
    return ['dropdown','single_chip','multi_chip'].includes(t);
  }

  get options(): FormArray { return this.form.get('options') as FormArray; }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<QuestionFormDialog>,
    private readonly surveyService: SurveyService
  ) {}

  ngOnInit() {
    this.isEdit = !!this.data?.question;
    const q = this.data?.question;
    this.form = this.fb.group({
      label:         [q?.label       || '', Validators.required],
      question_type: [q?.question_type || 'text', Validators.required],
      helper_text:   [q?.helper_text  || ''],
      placeholder:   [q?.placeholder  || ''],
      is_required:   [q?.is_required  ?? false],
      display_order: [q?.display_order ?? this.data?.displayOrder ?? 1],
      options: this.fb.array(
        (q?.options || []).map((o: any) => this.buildOption(o))
      )
    });
  }

  private buildOption(o: any = {}): FormGroup {
    return this.fb.group({
      id:            [o.id || null],
      label:         [o.label || '', Validators.required],
      value:         [o.value || ''],
      color_variant: [o.color_variant || 'neutral'],
      display_order: [o.display_order || this.options?.length + 1 || 1],
    });
  }

  addOption() { this.options.push(this.buildOption()); }

  removeOption(i: number) { this.options.removeAt(i); }

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    try {
      const v = this.form.value;
      const opts = v.options.map((o: any, i: number) => ({
        ...o,
        value: o.value || o.label.toLowerCase().replace(/\s+/g, '_'),
        display_order: i + 1
      }));
      const payload: any = {
        label:         v.label,
        question_type: v.question_type,
        helper_text:   v.helper_text || null,
        placeholder:   v.placeholder || null,
        is_required:   v.is_required,
        display_order: v.display_order,
        options:       opts
      };
      if (this.isEdit) {
        payload.action     = 'update_question';
        payload.id         = this.data.question.id;
        payload.map_id     = this.data.question.map_id;
      } else {
        payload.action     = 'create_question';
        payload.section_id = this.data.sectionId;
        payload.survey_id  = this.data.surveyId;
      }
      await this.surveyService.manageSurvey(payload);
      this.dialogRef.close({ refresh: true });
    } catch (err: any) {
      this.errorMsg = err?.message || 'Failed to save question.';
    } finally {
      this.isLoading = false;
    }
  }

  close() { this.dialogRef.close({ refresh: false }); }
}
