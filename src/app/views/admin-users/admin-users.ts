import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../../services/api.service';
import { UsersDialogService } from '../../services/users-dialog.service';
import { UnlockUserConfirm } from '../dialogs/unlock-user-confirm/unlock-user-confirm';
import { ResetMfaConfirm } from '../dialogs/reset-mfa-confirm/reset-mfa-confirm';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  users:       any[] = [];
  roles:       any[] = [];
  isLoading  = true;
  loadError  = '';
  searchQuery = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ConfigService,
    private readonly usersDialog: UsersDialogService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly headerService: HeaderService
  ) {}

  async ngOnInit() {
    this.headerService.setTitle('MANAGE USERS');
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
    ref.afterClosed().subscribe((r: any) => {
      if (r?.refresh) {
        this.loadUsers();
        this.snackBar.open('User added successfully.', 'Close', { duration: 3000 });
      }
    });
  }

  editUser(user: any) {
    const ref = this.usersDialog.editUsersDialog(this.roles, user);
    ref.afterClosed().subscribe((r: any) => {
      if (r?.refresh) {
        this.loadUsers();
        this.snackBar.open('User updated successfully.', 'Close', { duration: 3000 });
      }
    });
  }

  unlockUser(user: any) {
    const ref = this.dialog.open(UnlockUserConfirm, {
      width: '440px',
      disableClose: true,
      data: {
        userId:           user.ID,
        cognito_username: user.cognito_username,
        email:            user.EmailID,
        role:             user.ROLE_NAME,
        name:             user.name,
        title:            'UNLOCK USER',
        messaage:         'Are you sure you want to unlock this user?'
      }
    });
    ref.afterClosed().subscribe((r: any) => { if (r?.refresh) this.loadUsers(); });
  }

  resetMfa(user: any) {
    const ref = this.dialog.open(ResetMfaConfirm, {
      width: '440px',
      disableClose: true,
      data: {
        userId:           user.ID,
        cognito_username: user.cognito_username,
        email:            user.EmailID,
        role:             user.ROLE_NAME,
        name:             user.name
      }
    });
    ref.afterClosed().subscribe((r: any) => {
      if (r?.refresh) {
        this.snackBar.open('Account recreated. The user will set up their authenticator app fresh on next login.', 'Close', { duration: 4000 });
        this.loadUsers();
      }
    });
  }

  get filteredUsers(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.ROLE_NAME?.toLowerCase().includes(q)
    );
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Inactive';
  }

  statusClass(status: number): string {
    return status === 0 ? 'au-active' : 'au-inactive';
  }

  goBack() { this.router.navigate(['/admin']); }
}
