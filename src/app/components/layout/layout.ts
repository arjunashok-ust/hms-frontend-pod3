/**
 * @file layout.ts
 * @description
 * This file defines the main layout component that structures the authenticated user interface.
 *
 * @overview
 * This component acts as the primary structural container for the application after a user logs in.
 * It combines the `Header` and `Sidebar` components with a `RouterOutlet` to render the main content of the currently active route.
 *
 * Connections:
 *   Angular Router -> LAYOUT.TS -> [HeaderComponent, SidebarComponent, RouterOutlet]
 */
import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [Header, Sidebar, RouterOutlet],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class LayoutComponent {
  public isBrowser = false;
  constructor(
    @Inject(PLATFORM_ID)
    private readonly platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
}
