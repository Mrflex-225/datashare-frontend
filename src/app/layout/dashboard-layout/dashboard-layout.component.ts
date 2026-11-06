import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly userEmail = this.auth.getUserEmail();
  readonly menuOpen = signal(false);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
