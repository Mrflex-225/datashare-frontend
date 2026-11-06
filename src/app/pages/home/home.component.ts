import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  onUploadClick(): void {
    this.router.navigate([this.auth.isAuthenticated() ? '/upload' : '/login']);
  }
}
