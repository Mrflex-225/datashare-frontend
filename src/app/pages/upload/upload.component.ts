import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FileMetadata, FileService } from '../../core/services/file.service';
import { getFormattedExpirationDuration } from '../../utils/date.utils';
import { MAX_FILE_SIZE, formatFileSize } from '../../utils/file.utils';

export const EXPIRATION_OPTIONS = [
  { days: 1, label: 'Une journée' },
  { days: 2, label: 'Deux jours' },
  { days: 3, label: 'Trois jours' },
  { days: 4, label: 'Quatre jours' },
  { days: 5, label: 'Cinq jours' },
  { days: 7, label: 'Une semaine' },
];

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['../home/home.component.scss', './upload.component.scss'],
})
export class UploadComponent {
  private readonly fileService = inject(FileService);

  readonly expirationOptions = EXPIRATION_OPTIONS;
  readonly formatFileSize = formatFileSize;

  readonly selectedFile = signal<File | null>(null);
  readonly password = signal('');
  readonly expiration = signal(1);

  readonly uploading = signal(false);
  readonly uploaded = signal<FileMetadata | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly linkCopied = signal(false);

  readonly tooLarge = computed(() => (this.selectedFile()?.size ?? 0) > MAX_FILE_SIZE);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.selectedFile.set(file);
    this.uploaded.set(null);
    this.errorMessage.set(null);
    input.value = '';
  }

  changeFile(): void {
    this.selectedFile.set(null);
    this.password.set('');
    this.expiration.set(1);
    this.errorMessage.set(null);
  }

  uploadFile(): void {
    const file = this.selectedFile();
    const password = this.password();
    if (!file || this.uploading() || this.tooLarge()) {
      return;
    }
    if (password && password.length < 6) {
      this.errorMessage.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.fileService.upload(file, this.expiration(), password).subscribe({
      next: (metadata) => {
        this.uploading.set(false);
        this.uploaded.set(metadata);
        this.linkCopied.set(false);
        this.changeFile();
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.errorMessage.set(
          err.status === 400
            ? 'Fichier manquant ou format non autorisé.'
            : 'Le téléversement a échoué. Veuillez réessayer.',
        );
      },
    });
  }

  async copyLink(link: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(link);
      this.linkCopied.set(true);
    } catch {
      this.errorMessage.set('Impossible de copier le lien.');
    }
  }

  getDownloadLink(token: string): string {
    return `${window.location.origin}/download/${encodeURIComponent(token)}`;
  }

  getExpirationText(expirationDate: string): string {
    return getFormattedExpirationDuration(expirationDate, 'pendant');
  }
}
