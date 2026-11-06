import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HistoryComponent } from './history.component';
import { FileHistory, FileService } from '../../core/services/file.service';

const DAY = 24 * 3600 * 1000;

describe('HistoryComponent', () => {
  let fixture: ComponentFixture<HistoryComponent>;
  let el: HTMLElement;
  let fileServiceSpy: jest.Mocked<FileService>;
  let router: Router;

  const files: FileHistory[] = [
    {
      id: 1,
      originalName: 'rapport.pdf',
      size: 2048,
      createdAt: new Date(Date.now() - DAY).toISOString(),
      expirationDate: new Date(Date.now() + 2 * DAY).toISOString(),
      downloadToken: 'token-actif',
      password: true,
    },
    {
      id: 2,
      originalName: 'ancien.zip',
      size: 1024,
      createdAt: new Date(Date.now() - 10 * DAY).toISOString(),
      expirationDate: new Date(Date.now() - 3 * DAY).toISOString(),
      downloadToken: 'token-expire',
      password: false,
    },
  ];

  const items = () => Array.from(el.querySelectorAll('.file-item'));
  const names = () => items().map((item) => item.querySelector('.file-name')?.textContent?.trim());
  const itemFor = (name: string) => items().find((item) => item.textContent?.includes(name))!;
  const buttonIn = (item: Element, label: string) =>
    Array.from(item.querySelectorAll('button')).find((b) => b.textContent?.includes(label))!;
  const clickFilter = (label: string) => {
    Array.from(el.querySelectorAll<HTMLButtonElement>('.filters button'))
      .find((b) => b.textContent?.trim() === label)!
      .click();
    fixture.detectChanges();
  };

  const createComponent = async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [provideRouter([]), { provide: FileService, useValue: fileServiceSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(HistoryComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };

  beforeEach(() => {
    fileServiceSpy = {
      getMyFiles: jest.fn().mockReturnValue(of(files)),
      deleteFile: jest.fn(),
    } as unknown as jest.Mocked<FileService>;
  });

  afterEach(() => jest.restoreAllMocks());

  it('should list the files with their expiration', async () => {
    await createComponent();

    expect(names()).toEqual(['rapport.pdf', 'ancien.zip']);
    expect(itemFor('rapport.pdf').querySelector('.file-status')?.textContent).toContain('Expire dans 2 jours');
    expect(itemFor('rapport.pdf').querySelector('.lock-icon')).not.toBeNull();
    expect(itemFor('ancien.zip').querySelector('.file-status')?.textContent).toContain('Expiré');
    expect(itemFor('ancien.zip').textContent).toContain("il n'est plus stocké chez nous");
    expect(itemFor('ancien.zip').querySelectorAll('button').length).toBe(0);
  });

  it('should filter active and expired files', async () => {
    await createComponent();

    clickFilter('Actifs');
    expect(names()).toEqual(['rapport.pdf']);

    clickFilter('Expiré');
    expect(names()).toEqual(['ancien.zip']);
  });

  it('should navigate to the download page', async () => {
    await createComponent();

    buttonIn(itemFor('rapport.pdf'), 'Accéder').click();

    expect(router.navigate).toHaveBeenCalledWith(['/download', 'token-actif']);
  });

  it('should open the mobile action menu', async () => {
    await createComponent();

    itemFor('rapport.pdf').querySelector<HTMLButtonElement>('.menu-toggle')!.click();
    fixture.detectChanges();

    expect(itemFor('rapport.pdf').querySelector('.menu-panel')?.textContent).toContain('Supprimer');
  });

  it('should delete a file after confirmation', async () => {
    fileServiceSpy.deleteFile.mockReturnValue(of(undefined));
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    await createComponent();

    buttonIn(itemFor('rapport.pdf'), 'Supprimer').click();
    fixture.detectChanges();

    expect(fileServiceSpy.deleteFile).toHaveBeenCalledWith(1);
    expect(names()).toEqual(['ancien.zip']);
  });

  it('should not delete when the user cancels', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    await createComponent();

    buttonIn(itemFor('rapport.pdf'), 'Supprimer').click();

    expect(fileServiceSpy.deleteFile).not.toHaveBeenCalled();
  });

  it('should display an error when the files cannot be loaded', async () => {
    fileServiceSpy.getMyFiles.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await createComponent();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger vos fichiers.');
  });
});
