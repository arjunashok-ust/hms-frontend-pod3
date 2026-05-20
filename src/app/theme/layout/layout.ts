import { Component } from '@angular/core';
import { HeaderComponent } from './header/header';
import { SidePanel } from "./side-panel/side-panel";
import { MainComponent } from "./main/main";

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, SidePanel, MainComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})

export class LayoutComponent {}
