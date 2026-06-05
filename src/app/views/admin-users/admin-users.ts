import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ConfigService } from '../../services/api.service';
import { UsersDialogService } from '../../services/users-dialog.service';
import { UnlockUserConfirm } from '../dialogs/unlock-user-confirm/unlock-user-confirm';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  isLoading = true;
  loadError = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ConfigService,
    private readonly usersDialog: UsersDialogService,
    private readonly dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.isLoading = true;
    this.loadError = '';
    try {
      const res = await this.apiService.users<any>();
      const payload = typeof res?.body === 'string' ? JSON.parse(res.body) : (res?.body ?? res);
      this.users = payload?.data  ?? [];
      this.roles = payload?.roles ?? [];
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load users.';
    } finally {
      this.isLoading = false;
    }
  }

  addUser() {
    const ref = this.usersDialog.addUsersDialog(this.roles);
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.loadUsers(); });
  }

  editUser(user: any) {
    const ref = this.usersDialog.editUsersDialog(this.roles, user);
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.loadUsers(); });
  }

  unlockUser(user: any) {
    const ref = this.dialog.open(UnlockUserConfirm, {
      width: '440px',
      disableClose: true,
      data: {
        userId: user.ID,
        cognito_username: user.cognito_username,
        email: user.EmailID,
        role: user.ROLE_NAME
      }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.loadUsers(); });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Inactive';
  }

  statusClass(status: number): string {
    return status === 0 ? 'au-active' : 'au-inactive';
  }

  goBack() { this.router.navigate(['/admin']); }
}
