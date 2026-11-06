import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface FileMetadata {
  id: number;
  originalName: string;
  size: number;
  downloadToken: string;
  expirationDate: string;
  password: string;
}

export interface PublicFileMetadata {
  originalName: string;
  contentType: string;
  size: number;
  expirationDate: string;
  password: boolean;
}

export interface DownloadResponse {
  downloadUrl: string;
}

export interface FileHistory {
  id: number;
  originalName: string;
  size: number;
  createdAt: string;
  expirationDate: string;
  downloadToken: string;
  password: boolean;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/files';

  upload(file: File, expirationDays?: number, password?: string): Observable<FileMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    if (expirationDays != null) {
      formData.append('expirationDays', expirationDays.toString());
    }
    if (password?.trim()) {
      formData.append('password', password);
    }
    return this.http.post<FileMetadata>(this.apiUrl, formData);
  }

  getPublicFile(token: string): Observable<PublicFileMetadata> {
    return this.http.get<PublicFileMetadata>(`${this.apiUrl}/download/${encodeURIComponent(token)}/metadata`);
  }

  getDownloadUrl(token: string, password: string | null): Observable<DownloadResponse> {
    return this.http.post<DownloadResponse>(`${this.apiUrl}/download/${encodeURIComponent(token)}`, { password });
  }

  getMyFiles(): Observable<FileHistory[]> {
    return this.http.get<FileHistory[]>(`${this.apiUrl}/me`);
  }

  deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
