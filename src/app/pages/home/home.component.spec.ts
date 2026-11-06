import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  const isAuthenticated = signal(false);

  beforeEach(async () => {
    isAuthenticated.set(false);
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated } }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('should display the call to action', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Tu veux partager un fichier ?');
    expect(el.querySelector('button[aria-label="Téléverser un fichier"]')).toBeTruthy();
  });

  it('should redirect to /login when the user is not authenticated', () => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.upload-btn')!.click();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /upload when the user is authenticated', () => {
    isAuthenticated.set(true);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.upload-btn')!.click();
    expect(router.navigate).toHaveBeenCalledWith(['/upload']);
  });
});
