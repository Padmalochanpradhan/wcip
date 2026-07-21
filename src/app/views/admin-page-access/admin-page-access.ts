import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../../services/api.service';
import { PageAccessDialogService } from '../../services/page-access-dialog.service';
import { HeaderService } from '../../services/header.service';

/**
 * AdminPageAccess — displays and manages ROLE_PAGE_ACCESS rules.
 *
 * Loads list/roles/pagelist in one call from WCGetPageAccessList.
 * filteredList is a computed getter (no extra request) — filtering is client-side
 * because the full dataset is small and already in memory.
 */
@Component({
  selector: 'app-admin-page-access',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-page-access.html',
  styleUrl: './admin-page-access.css'
})
export class AdminPageAccess implements OnInit {
  list:           any[] = [];
  roles:          any[] = [];
  pagelist:       any[] = [];
  isLoading = true;
  loadError = '';
  searchQuery = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ConfigService,
    private readonly pageAccessDialog: PageAccessDialogService,
    private readonly snackBar: MatSnackBar,
    private readonly headerService: HeaderService
  ) {}

  async ngOnInit() {
    this.headerService.setTitle('PAGE ACCESS');
    await this.load();
  }

  async load() {
    this.isLoading = true;
    this.loadError = '';
    try {
      const res = await this.apiService.pageaccess<any>();
      this.list     = res?.list     ?? [];
      this.roles    = res?.roles    ?? [];
      this.pagelist = res?.pagelist ?? [];
    } catch (err: any) {
      this.loadError = err?.message || 'Failed to load page access list.';
    } finally {
      this.isLoading = false;
    }
  }

  addAccess() {
    const ref = this.pageAccessDialog.addDialog(this.roles, this.pagelist);
    ref.afterClosed().subscribe((r: any) => {
      if (r?.refresh) {
        this.load();
        this.snackBar.open('Page access added.', 'Close', { duration: 3000 });
      }
    });
  }

  editAccess(item: any) {
    const ref = this.pageAccessDialog.editDialog(this.roles, this.pagelist, item);
    ref.afterClosed().subscribe((r: any) => {
      if (r?.refresh) {
        this.load();
        this.snackBar.open('Page access updated.', 'Close', { duration: 3000 });
      }
    });
  }

  get filteredList(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.list;
    return this.list.filter(item =>
      item.role_name?.toLowerCase().includes(q) ||
      item.page_name?.toLowerCase().includes(q)
    );
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Inactive';
  }

  statusClass(status: number): string {
    return status === 0 ? 'pa-active' : 'pa-inactive';
  }

  goBack() { this.router.navigate(['/admin']); }
}
