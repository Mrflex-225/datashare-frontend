import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { DownloadComponent } from './download.component';
import { FileService, PublicFileMetadata } from '../../core/services/file.service';

const DAY = 24 * 3600 * 1000;

describe('DownloadComponent', () => {
  let fixture: ComponentFixture<DownloadComponent>;
  let el: HTMLElement;
  let fileServiceSpy: jest.Mocked<FileService>;

  const metadata = (password: boolean, expiresInDays = 3): PublicFileMetadata => ({
    originalName: 'rapport.pdf',
    contentType: 'application/pdf',
    size: 2048,
    expirationDate: new Date(Date.now() + expiresInDays * DAY).toISOString(),
    password,
  });

  const createComponent = async (token: string | null) => {
    await TestBed.configureTestingModule({
      imports: [DownloadComponent],
      providers: [
        { provide: FileService, useValue: fileServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(token ? { token } : {}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };

  const downloadButton = () => el.querySelector<HTMLButtonElement>('.download-action')!;

  beforeEach(() => {
    fileServiceSpy = {
      getPublicFile: jest.fn(),
      getDownloadUrl: jest.fn().mockReturnValue(NEVER),
    } as unknown as jest.Mocked<FileService>;
  });

  it('should display the file and its expiration', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(of(metadata(false)));
    await createComponent('abc-123');

    expect(fileServiceSpy.getPublicFile).toHaveBeenCalledWith('abc-123');
    expect(el.querySelector('.file-name')?.textContent).toContain('rapport.pdf');
    expect(el.querySelector('.file-info')?.textContent).toContain('2,0 Ko');
    expect(el.querySelector('.banner--info')?.textContent).toContain('Ce fichier expirera dans 3 jours.');
    expect(el.querySelector('#downloadPassword')).toBeNull();
  });

  it('should show a warning when the file expires tomorrow', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(of(metadata(false, 1)));
    await createComponent('abc-123');

    expect(el.querySelector('.banner--warning')?.textContent).toContain('Ce fichier expirera demain.');
  });

  it('should request the download URL without password for an unprotected file', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(of(metadata(false)));
    await createComponent('abc-123');

    downloadButton().click();

    expect(fileServiceSpy.getDownloadUrl).toHaveBeenCalledWith('abc-123', null);
  });

  it('should keep the button disabled until the password is typed', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(of(metadata(true)));
    await createComponent('abc-123');

    expect(downloadButton().disabled).toBe(true);

    fixture.componentInstance.password.set('secret1');
    fixture.detectChanges();
    expect(downloadButton().disabled).toBe(false);

    downloadButton().click();
    expect(fileServiceSpy.getDownloadUrl).toHaveBeenCalledWith('abc-123', 'secret1');
  });

  it('should show an error when the password is wrong', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(of(metadata(true)));
    fileServiceSpy.getDownloadUrl.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    await createComponent('abc-123');

    fixture.componentInstance.password.set('wrong');
    fixture.detectChanges();
    downloadButton().click();
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Mot de passe incorrect.');
  });

  it('should show the expired message (410)', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 410 })));
    await createComponent('abc-123');

    expect(el.querySelector('.banner--error')?.textContent).toContain('car il a expiré');
    expect(el.querySelector('.download-action')).toBeNull();
  });

  it('should show an error for an invalid link (404)', async () => {
    fileServiceSpy.getPublicFile.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await createComponent('abc-123');

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Ce lien de partage est invalide.');
  });

  it('should show an error when the token is missing', async () => {
    await createComponent(null);

    expect(fileServiceSpy.getPublicFile).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Lien de partage invalide.');
  });
});
