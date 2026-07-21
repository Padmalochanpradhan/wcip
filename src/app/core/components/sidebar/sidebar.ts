import { Component ,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { UserDataService } from '../../../services/user-data-service';
import { Router } from '@angular/router'; 
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})


export class Sidebar implements OnInit{
  userRole: any;
    constructor(     
    private readonly userData: UserDataService,private readonly router: Router 
  ) {
      const user = this.userData.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }    
  }

  ngOnInit(): void {
      const user = this.userData.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }else{
      this.userRole = user.role_id;

    }      
  }  
     
     
}
