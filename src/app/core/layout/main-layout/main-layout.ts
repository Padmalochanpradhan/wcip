 
import { Component, signal,ViewChild  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavContent, MatSidenavContainer, MatSidenavModule } from '@angular/material/sidenav';
import { Sidebar } from "../../components/sidebar/sidebar"; 
import { Footer } from "../../components/footer/footer";
import { Header } from "../../components/header/header";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-main-layout',
   //imports: [Sidebar, RouterOutlet, Footer, Header],
    imports: [RouterOutlet, MatSidenavContent, Sidebar, MatSidenav, MatSidenavContainer, Header, Footer,MatSidenavModule,  MatToolbarModule,  MatIconModule],
    
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
   @ViewChild('drawer') drawer!: MatSidenav;

}
