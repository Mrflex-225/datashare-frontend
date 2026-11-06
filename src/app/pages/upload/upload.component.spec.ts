import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { EXPIRATION_OPTIONS, UploadComponent } from './upload.component';
import { FileMetadata, FileService } from '../../core/services/file.service';

describe('UploadComponent', () => {
  let fixture: ComponentFixture<UploadComponent>;
  let component: UploadComponent;
  let el: HTMLElement;
  let fileServiceSpy: jest.Mocked<FileService>;

  const selectFile = (file: File) => {
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  const submitButton = () => el.querySelector<HTMLButtonElement>('.submit-btn')!;

  const clickUpload = () => {
    submitButton().click();
    fixture.detectChanges();
  };

  const file = new File(['contenu'], 'rapport.pdf');

  beforeEach(async () => {
    fileServiceSpy = { upload: jest.fn() } as unknown as jest.Mocked<FileService>;

    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [{ provide: FileService, useValue: fileServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should open the file picker when clicking the upload button', () => {
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = jest.spyOn(input, 'click');

    el.querySelector<HTMLButtonElement>('.upload-btn')!.click();

    expect(click).toHaveBeenCalled();
  });

  it('should show the selected file without uploading it yet', () => {
    selectFile(file);

    expect(el.querySelector('.file-name')?.textContent).toContain('rapport.pdf');
    expect(el.querySelector('.file-size')?.textContent).toContain('7 o');
    expect(el.querySelector<HTMLSelectElement>('#expiration')?.options.length).toBe(EXPIRATION_OPTIONS.length);
    expect(fileServiceSpy.upload).not.toHaveBeenCalled();
  });

  it('should upload with expiration and password, then show the share link', () => {
    fileServiceSpy.upload.mockReturnValue(
      of({
        originalName: 'rapport.pdf',
        size: 7,
        downloadToken: 'abc-123',
        expirationDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      } as FileMetadata),
    );
    selectFile(file);
    component.expiration.set(3);
    component.password.set('secret1');

    clickUpload();

    expect(fileServiceSpy.upload).toHaveBeenCalledWith(file, 3, 'secret1');
    expect(el.querySelector('.success-message')?.textContent).toContain('pendant une semaine');
    expect(el.querySelector<HTMLInputElement>('#downloadLink')?.value).toContain('/download/abc-123');
  });

  it('should block files larger than 1 Go', () => {
    const bigFile = new File(['x'], 'video.mp4');
    Object.defineProperty(bigFile, 'size', { value: 3.1 * 1024 ** 3 });

    selectFile(bigFile);

    expect(el.querySelector('.size-error')?.textContent).toContain('La taille des fichiers est limitée à 1 Go');
    expect(el.querySelector('.file-size')?.textContent).toContain('3,1 Go');
    expect(submitButton().disabled).toBe(true);
  });

  it('should reject a password shorter than 6 characters', () => {
    selectFile(file);
    component.password.set('abc');

    clickUpload();

    expect(fileServiceSpy.upload).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('au moins 6 caractères');
  });

  it('should show an error message when the backend rejects the file', () => {
    fileServiceSpy.upload.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    selectFile(file);

    clickUpload();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('format non autorisé');
  });
});
