import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConfigService } from '../../../../services/api.service';
import { UserDataService } from '../../../../services/user-data-service'; 

@Component({
  selector: 'app-addpage-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinner
  ],
  templateUrl: './addpage-access.html',
  styleUrl: './addpage-access.css',
})
export class AddpageAccess implements OnInit {
  
  addUserFormGroup!: FormGroup; 
  isLoading = false;
  isEditMode = false;
  currentUserId: number | null = null; 
  errorMessage: string = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly fb: FormBuilder,
    private readonly userData: UserDataService,
    private readonly apiService: ConfigService,
    private readonly dialogRef: MatDialogRef<AddpageAccess>
  ) { }

  // 🔹 INIT
  ngOnInit(): void {
    this.buildForm();

    if (this.data?.isEditMode && this.data?.list) {
      this.enableEditMode(this.data.list);
    }
      
  }

  // 🔹 FORM BUILDER
  private buildForm(): void {
    this.addUserFormGroup = this.fb.group({ 
      role_id: ['', Validators.required],
      page_id: ['', Validators.required],    
      status: ['', Validators.required]
    });
  }

  // 🔹 EDIT MODE SETUP
  private enableEditMode(list: any): void {
    this.isEditMode = true;
    this.currentUserId = list.id;

    this.addUserFormGroup.patchValue({     
      role_id: list.role_id,
      page_id: list.page_id,
      status: Number(list.status)
    }); 
  }


  // 🔹 SUBMIT HANDLER
  async submitUser(): Promise<void> {
    if (this.addUserFormGroup.invalid) {
      this.addUserFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.addUserFormGroup.getRawValue();

    try {
      await this.processUser(formValue);
      this.dialogRef.close({ refresh: true });

    } catch (error: any) {
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // 🔹 PROCESS ADD / UPDATE
  private async processUser(formValue: any): Promise<void> {
    if (this.isEditMode) {
      await this.update(formValue);
    } else {
       
      await this.insert(formValue);
    }
  }

  

  // 🔹 INSERT USER
  private async insert(formValue: any): Promise<void> {
    try {     
     const user = this.userData.getUser();

      // 2️⃣ Insert into DB  
      const payload = {
        table_name: 'ROLE_PAGE_ACCESS',
        insertDataArray: [{
          page_id: formValue.page_id,
          role_id: formValue.role_id,
          status: Number(formValue.status),
          added_by: user.ID,
        }]
      };

      await this.apiService.insert(payload);

    } catch (error) {
      console.error('Page access creation failed:', error);
      throw error;
    }
  }

   
private async update(formValue: any): Promise<void> {

  if (!this.currentUserId) {
    throw new Error('ID MISSING');
  }

  try {

    // Update
    const payload = {
      table_name: 'ROLE_PAGE_ACCESS',
      id_field_name: 'id',
      id_field_value: this.currentUserId,
      updateData: {
        page_id: formValue.page_id,
        role_id: formValue.role_id,
        status: Number(formValue.status),
      }
    }; 
  
    await this.apiService.update(payload);
  }
  catch (error: any) { 
    throw error;
  }
} 

  // 🔹 CLOSE DIALOG
  close(): void {
    this.dialogRef.close({ refresh: false });
  }

}
