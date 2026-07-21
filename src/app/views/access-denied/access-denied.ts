import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserDataService } from '../../services/user-data-service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css'
})
export class AccessDenied {
  readonly userName: string;

  constructor(private readonly userData: UserDataService) {
    const user = this.userData.getUser<any>();
    this.userName = user?.name || user?.FistName || '';
  }
}
