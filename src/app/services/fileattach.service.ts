import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileattachDialog } from '../views/dialogs/fileattach-dialog/fileattach-dialog';
import { ConfigService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { attachmentRequest } from '../models/requests/planRequest';

@Injectable({ providedIn: 'root' })
export class FileAttachService {

  constructor(
    private readonly dialog: MatDialog,
    private readonly apiService: ConfigService
  ) {}

  async openAttachDialog(data: {
    entity: any;
    type: string;
  }): Promise<MatDialogRef<FileattachDialog>> {

    let attachments: any[] = [];

    try {
      const req = { type: data.type, type_id: data.entity.id };
      const res = await this.apiService.attachments<any>(req);
      attachments = res?.data ?? [];
    } catch (err) {
      console.error('Failed to load attachments', err);
    }

    return this.dialog.open(FileattachDialog, {
      width: '900px',
      maxWidth: '95vw',
      minHeight: '580px',
      disableClose: true,
      autoFocus: false,
      data: { ...data, attachments }
    });
  }
}
