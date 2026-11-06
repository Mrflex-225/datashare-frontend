import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FileHistory, FileService } from '../../core/services/file.service';
import { formatExpiresIn, isExpired } from '../../utils/date.utils';

type HistoryFilter = 'all' | 'active' | 'expired';

@Component({
  selector: 'app-history',
  imports: [RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly router = inject(Router);

  readonly filters: { value: HistoryFilter; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'expired', label: 'Expiré' },
  ];

  readonly files = signal<FileHistory[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly openMenuId = signal<number | null>(null);
  readonly filter = signal<HistoryFilter>('all');

  readonly filteredFiles = computed(() => {
    const filter = this.filter();
    return this.files().filter((file) => {
      if (filter === 'active') return !this.isExpired(file);
      if (filter === 'expired') return this.isExpired(file);
      return true;
    });
  });

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.fileService.getMyFiles().subscribe({
      next: (files) => {
        this.files.set(files);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Impossible de charger vos fichiers.');
      },
    });
  }

  isExpired(file: FileHistory): boolean {
    return isExpired(file.expirationDate);
  }

  expirationLabel(file: FileHistory): string {
    return this.isExpired(file) ? 'Expiré' : `Expire ${formatExpiresIn(file.expirationDate)}`;
  }

  toggleMenu(file: FileHistory): void {
    this.openMenuId.update((id) => (id === file.id ? null : file.id));
  }

  accessFile(file: FileHistory): void {
    this.router.navigate(['/download', file.downloadToken]);
  }

  deleteFile(file: FileHistory): void {
    this.openMenuId.set(null);
    if (this.isExpired(file) || this.deletingId() !== null) {
      return;
    }
    if (!window.confirm(`Voulez-vous supprimer "${file.originalName}" ?`)) {
      return;
    }

    this.deletingId.set(file.id);
    this.errorMessage.set(null);

    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.files.update((files) => files.filter((item) => item.id !== file.id));
        this.deletingId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.errorMessage.set(
          err.status === 409 ? 'Ce fichier est déjà expiré.' : 'Impossible de supprimer le fichier.',
        );
      },
    });
  }
}
