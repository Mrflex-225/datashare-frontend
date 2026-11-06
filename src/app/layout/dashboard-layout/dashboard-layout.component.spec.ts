import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { AuthService } from '../../core/services/auth.service';

describe('DashboardLayoutComponent', () => {
  let fixture: ComponentFixture<DashboardLayoutComponent>;
  let el: HTMLElement;
  let authSpy: jest.Mocked<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = {
      logout: jest.fn(),
      getUserEmail: jest.fn().mockReturnValue('user@example.com'),
    } as unknown as jest.Mocked<AuthService>;

    await TestBed.configureTestingModule({
      imports: [DashboardLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(DashboardLayoutComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should link to the upload page and to the history', () => {
    expect(el.querySelector('.add-button')?.getAttribute('href')).toBe('/upload');
    expect(el.querySelector('.sidebar-link')?.getAttribute('href')).toBe('/history');
  });

  it('should display the user email', () => {
    expect(el.querySelector('.user-email')?.textContent).toContain('user@example.com');
  });

  it('should open and close the mobile menu', () => {
    el.querySelector<HTMLButtonElement>('.burger')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.sidebar')?.classList).toContain('open');

    el.querySelector<HTMLElement>('.overlay')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.sidebar')?.classList).not.toContain('open');
  });

  it('should log out and go back to home', () => {
    el.querySelector<HTMLButtonElement>('.logout-button')!.click();

    expect(authSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
