import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should POST the file as multipart form data to /api/files', () => {
    const file = new File(['contenu'], 'rapport.pdf', { type: 'application/pdf' });

    service.upload(file).subscribe((res) => expect(res.originalName).toBe('rapport.pdf'));

    const req = httpMock.expectOne('/api/files');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toEqual(file);
    req.flush({ id: 1, originalName: 'rapport.pdf' });
  });

  it('should add expirationDays and password to the form data when provided', () => {
    service.upload(new File(['x'], 'a.txt'), 3, 'secret1').subscribe();

    const body = httpMock.expectOne('/api/files').request.body as FormData;
    expect(body.get('expirationDays')).toBe('3');
    expect(body.get('password')).toBe('secret1');
  });

  it('should not send an empty password', () => {
    service.upload(new File(['x'], 'a.txt'), 3, '   ').subscribe();

    const body = httpMock.expectOne('/api/files').request.body as FormData;
    expect(body.has('password')).toBe(false);
  });

  it('should GET the public metadata of a shared file', () => {
    service.getPublicFile('abc-123').subscribe();

    const req = httpMock.expectOne('/api/files/download/abc-123/metadata');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should POST the password to get the download URL', () => {
    service.getDownloadUrl('abc-123', 'secret1').subscribe((res) => expect(res.downloadUrl).toBe('https://s3/x'));

    const req = httpMock.expectOne('/api/files/download/abc-123');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'secret1' });
    req.flush({ downloadUrl: 'https://s3/x' });
  });

  it('should GET the files of the current user', () => {
    service.getMyFiles().subscribe((files) => expect(files.length).toBe(0));

    const req = httpMock.expectOne('/api/files/me');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should DELETE a file by id', () => {
    service.deleteFile(42).subscribe();

    const req = httpMock.expectOne('/api/files/42');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
