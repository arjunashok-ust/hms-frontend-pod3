import { Component } from '@angular/core';
import { SidePanelComponent } from "./sidepanel/sidepanel";
import { MainPanelComponent } from "./mainpanel/mainpanel";
import { HeaderComponent } from "./header/header";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.htm',
    styleUrl: './dashboard.css',
    standalone: true,
    imports: [SidePanelComponent, MainPanelComponent, HeaderComponent],
})

export class DashboardComponent{}