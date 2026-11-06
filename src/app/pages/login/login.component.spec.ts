import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let el: HTMLElement;
  let authSpy: jest.Mocked<AuthService>;
  let router: Router;

  const fillForm = (email: string, password: string) => {
    component.form.setValue({ email, password });
    fixture.detectChanges();
  };

  const submit = () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authSpy = { login: jest.fn() } as unknown as jest.Mocked<AuthService>;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render the login form as in the mockup', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Connexion');
    expect(el.querySelector('#login-email')?.getAttribute('placeholder')).toBe('Saisissez votre email...');
    expect(el.querySelector('#login-password')?.getAttribute('placeholder')).toBe(
      'Saisissez votre mot de passe...',
    );
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Connexion');
  });

  it('should link to the register page', () => {
    const link = el.querySelector<HTMLAnchorElement>('.auth-switch')!;
    expect(link.textContent?.trim()).toBe('Créer un compte');
    expect(link.getAttribute('href')).toBe('/register');
  });

  it('should be invalid when empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should reject an invalid email', () => {
    fillForm('not-an-email', 'password123');
    expect(component.form.controls.email.hasError('email')).toBe(true);
  });

  it('should reject a password shorter than 8 characters', () => {
    fillForm('user@example.com', 'short');
    expect(component.form.controls.password.hasError('minlength')).toBe(true);
  });

  it('should show field errors and not call the API when submitting an invalid form', () => {
    submit();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(el.querySelector('#login-email-error')).toBeTruthy();
    expect(el.querySelector('#login-password-error')).toBeTruthy();
  });

  it('should log in and redirect to /upload on success', () => {
    authSpy.login.mockReturnValue(of('jwt'));
    fillForm('user@example.com', 'password123');

    submit();

    expect(authSpy.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    expect(router.navigate).toHaveBeenCalledWith(['/upload']);
    expect(component.loading()).toBe(false);
  });

  it('should display a specific message on 401', () => {
    authSpy.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    fillForm('user@example.com', 'wrongpassword');

    submit();

    expect(el.querySelector('.form-error')?.textContent).toContain('Email ou mot de passe incorrect.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should display a generic message on other errors', () => {
    authSpy.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    fillForm('user@example.com', 'password123');

    submit();

    expect(el.querySelector('.form-error')?.textContent).toContain('Une erreur est survenue');
  });
});
