import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FileService, PublicFileMetadata } from '../../core/services/file.service';
import { expiresWithinADay, formatExpiresIn, isExpired } from '../../utils/date.utils';
import { formatFileSize } from '../../utils/file.utils';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrl: './download.component.scss',
})
export class DownloadComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fileService = inject(FileService);

  readonly formatFileSize = formatFileSize;

  readonly token = signal('');
  readonly file = signal<PublicFileMetadata | null>(null);
  readonly password = signal('');
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly expired = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canDownload = computed(() => {
    const file = this.file();
    return !!file && !this.downloading() && (!file.password || this.password().trim().length > 0);
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.errorMessage.set('Lien de partage invalide.');
      return;
    }
    this.token.set(token);
    this.loadFile(token);
  }

  loadFile(token: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.fileService.getPublicFile(token).subscribe({
      next: (metadata) => {
        this.loading.set(false);
        if (isExpired(metadata.expirationDate)) {
          this.expired.set(true);
        } else {
          this.file.set(metadata);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleError(err);
      },
    });
  }

  downloadFile(): void {
    const file = this.file();
    if (!file || !this.canDownload()) {
      return;
    }

    this.downloading.set(true);
    this.errorMessage.set(null);

    this.fileService.getDownloadUrl(this.token(), file.password ? this.password() : null).subscribe({
      next: (response) => {
        this.downloading.set(false);
        window.location.assign(response.downloadUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.downloading.set(false);
        this.handleError(err);
      },
    });
  }

  expirationText(file: PublicFileMetadata): string {
    return `Ce fichier expirera ${formatExpiresIn(file.expirationDate)}.`;
  }

  expiresSoon(file: PublicFileMetadata): boolean {
    return expiresWithinADay(file.expirationDate);
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 410:
        this.expired.set(true);
        this.file.set(null);
        break;
      case 404:
        this.errorMessage.set('Ce lien de partage est invalide.');
        break;
      case 401:
      case 403:
        this.errorMessage.set('Mot de passe incorrect.');
        break;
      default:
        this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
    }
  }
}
