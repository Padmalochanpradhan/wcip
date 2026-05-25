import { Component, Input,OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router'; 
import { MatIconModule, MatIcon } from '@angular/material/icon';  
import { MatMenuModule, MatMenu } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider'; 
import { CommonModule } from '@angular/common'; 
import { MatSidenav } from '@angular/material/sidenav';
import { UserDataService } from '../../../services/user-data-service';
import { HeaderService } from '../../../services/header.service';
import { SystemLogService } from '../../../services/system-log';
import { Observable } from 'rxjs/internal/Observable';
import { USER_KEY } from '../../../constants/constant';
import { IdleTimeoutService } from '../../../services/idle-timeout';
@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIcon, MatMenu, MatDivider,CommonModule,MatMenuModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
 @Input() drawer!: MatSidenav;
  pageTitle = 'Dashboard';
  userName: string | undefined;
  userId!: number;
  userEmail!: string;
  title$!: Observable<string>;
  constructor(private readonly router: Router,private readonly userData: UserDataService,private readonly headerService: HeaderService,private readonly idleService: IdleTimeoutService, private readonly systemLogService:SystemLogService ) {}
   ngOnInit(): void {
    this.title$ = this.headerService.title$;
    const user = this.userData.getUser(); 
    if (!user) {      
      this.router.navigate(['/login']);
      return;
    }
    this.userName = user.FistName+' '+user.LastName+' ('+user.ROLE_NAME+')';
    this.userId = user.ID;
    this.userEmail = user.EmailID;     
  }  
  logout() {
    this.systemLogService.addSystemLog({
      log_name: 'LOGOUT',
      log_details: `Logout by ${this.userEmail}`,
      log_status: 'SUCCESS',
      log_by: this.userId,
      action_type: this.userEmail
    }).catch(() => {});
    localStorage.removeItem(USER_KEY);
    this.idleService.stopWatching();
    this.router.navigate(['/login']);
    return;
  }
}
