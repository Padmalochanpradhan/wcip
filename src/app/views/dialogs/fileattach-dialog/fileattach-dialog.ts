import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserDataService } from '../../../services/user-data-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConfigService } from '../../../services/api.service';
import { AppEnvService } from '../../../services/app-env.service';
import {
  attchFileremoveRequest,
  fileAttachRequest,
  FileRequest,
  S3UploadResponse,
  UpdateFileRequest,
  UpdateFileStatusRequest
} from '../../../models/requests/planRequest';
interface Attachment {
  id: number;
  attachment: string;
  status: number;
}

@Component({
  selector: 'app-fileattach-dialog',
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
  templateUrl: './fileattach-dialog.html',
  styleUrls: ['./fileattach-dialog.css']
})
 
export class FileattachDialog implements OnInit {

  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  isLoading = false;
  currentId: number | null = null; 
  isAddMode = true; 
  isStatusOnlyUpdate = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      attachments: Attachment[];
      entity: any;
      type: string;
    },
    private readonly fb: FormBuilder,
    private readonly apiService: ConfigService,
    private readonly envService: AppEnvService,
    private readonly userData: UserDataService,
    private readonly dialogRef: MatDialogRef<FileattachDialog>
  ) {
    
  }

  ngOnInit(): void {
    
    this.uploadForm = this.fb.group({
      file: [null, Validators.required],
      status: [0, Validators.required]
    });
    
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.setFileRequired(true); 
    this.selectedFile = file;
    this.isStatusOnlyUpdate = false; // 🔁 now file + status
    this.uploadForm.patchValue({ file });

  }


 upload(): void {
   if (this.isLoading) return;
  const { status } = this.uploadForm.getRawValue();

  // 🔹 STATUS ONLY UPDATE
  if (this.isStatusOnlyUpdate) {
    this.updateStatusOnly(status);
    return;
  }

  // 🔹 FILE REQUIRED (add / replace)
  if (!this.selectedFile || this.uploadForm.invalid) return;

  this.fileupload(status);
}

private async updateStatusOnly(status: number): Promise<void> {
  if (this.currentId == null) return;

  this.isLoading = true;

  try {
    const payload: UpdateFileStatusRequest = {
      table_name: 'MEM_ATTACHMENT',
      id_field_name: 'id',
      id_field_value: this.currentId,
      updateData: { status }
    };

    await this.apiService.update<any, UpdateFileStatusRequest>(payload);

    // 🔄 Update UI immediately
    const item = this.data.attachments.find(a => a.id === this.currentId);
    if (item) item.status = status;

   

  } catch (err) {
    console.error('❌ Status update failed', err);
  } finally {
    this.isLoading = false;
    this.resetForm();
  }
}

  // ===============================
  // S3 UPLOAD
  // ===============================
  private async fileupload(fileStatus: number): Promise<void> {
    if (!this.selectedFile) return;

    this.isLoading = true;
    const file = this.selectedFile;
    const uploadType = this.data.type;  

    const request: fileAttachRequest = {
      fileName: file.name,
      fileType: file.type,
      directory: uploadType,
      id: this.data.entity.id,
      env: this.envService.envType(),
      bucket: this.envService.s3bucket()
    };

    try {
      const res = await this.apiService.s3fileupload<S3UploadResponse>(request);
      const parsed = JSON.parse(res.body);

      await this.uploadToS3(parsed.uploadUrl, file);

      if (this.isAddMode) {
        await this.insertFiletoDB(fileStatus, parsed.fileUrl);
      } else {
        await this.updateFileUrlToDB(fileStatus, parsed.fileUrl);
      }

      // 🔁 refresh list from DB
        await this.loadAttachments();

     

    } catch (error) {
      console.error('❌ File upload failed:', error);
    } finally {
      this.isLoading = false;
      this.selectedFile = null;
      this.uploadForm.reset({ status: 0 });
    }
  }

  private async loadAttachments(): Promise<void> {
  try {
    console.log(this.data.type+'===='+this.data.entity.id);
    const res = await this.apiService.attachments<any>({
      type: this.data.type,
      type_id: this.data.entity.id
    });

    this.data.attachments = res.data;
    console.log(this.data.attachments);
  } catch (err) {
    console.error('❌ Failed to load attachments', err);
  }
}

  private async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    if (!response.ok) {
      throw new Error('S3 upload failed');
    }
  }

  // ===============================
  // DB INSERT
  // ===============================
  private async insertFiletoDB(fileStatus: number, fileUrl: string): Promise<void> { 
    const user = this.userData.getUser();
    const payload: FileRequest = {
      table_name: 'MEM_ATTACHMENT',
      insertDataArray: [{
        type: this.data.type,
        type_id: this.data.entity.id,
        attachment: fileUrl,
        title: 'Add Attachment',
        added_by: user.ID,
        status: fileStatus
      }]
    };

    await this.apiService.insert<any, FileRequest>(payload);
  }

  // ===============================
  // DB UPDATE
  // ===============================
private async updateFileUrlToDB(
  fileStatus: number,
  fileUrl: string
): Promise<void> {

  if (this.currentId == null) {
    throw new Error('currentId is not set. Cannot update attachment.');
  }

  const payload: UpdateFileRequest = {
    table_name: 'MEM_ATTACHMENT',
    id_field_name: 'id',
    id_field_value: this.currentId, // ✅ now guaranteed number
    updateData: {
      attachment: fileUrl,
      title: 'Update Attachment',
      status: fileStatus
    }
  };

  await this.apiService.update<any, UpdateFileRequest>(payload);
}


  // ===============================
  // UI ACTIONS
  // ===============================
  edit(row: any): void {
  
    this.isAddMode = false; 
    this.currentId = row.id;
    this.isStatusOnlyUpdate = true; 
    this.setFileRequired(false);

    this.uploadForm.patchValue({
      status: row.status, 
    });

    this.selectedFile = null;
  }

  private setFileRequired(required: boolean): void {
    const fileCtrl = this.uploadForm.get('file');
    if (!fileCtrl) return;

    if (required) {
      fileCtrl.setValidators(Validators.required);
    } else {
      fileCtrl.clearValidators(); // ❗ remove required in edit mode
    }

    fileCtrl.updateValueAndValidity();
  }

  async remove(row: Attachment): Promise<void> {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    this.isLoading = true;

    try {
      await this.apiService.deleteAttachment({ id: row.id });
      this.data.attachments =
        this.data.attachments.filter(a => a.id !== row.id);
    } catch (err) {
      console.error('❌ Delete failed', err);
    } finally {
      this.isLoading = false;
    }
  }

  deleteAttachment(request: attchFileremoveRequest): Promise<any> {
       return this.apiService.deleteAttachment<attchFileremoveRequest>(request);
  }

  private resetForm(): void {
    this.uploadForm.reset({ status: 0 });
    this.selectedFile = null;
    this.currentId = null;
    this.isAddMode = true;
    this.isStatusOnlyUpdate = false;
  }

  close(): void {
    this.isLoading = false;
    this.dialogRef.close();
  }
}
