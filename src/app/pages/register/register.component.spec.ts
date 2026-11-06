import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let el: HTMLElement;
  let authSpy: jest.Mocked<AuthService>;
  let router: Router;

  const fillForm = (email: string, password: string, confirmPassword: string) => {
    component.form.setValue({ email, password, confirmPassword });
    component.form.markAllAsTouched();
    fixture.detectChanges();
  };

  const submit = () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authSpy = { register: jest.fn() } as unknown as jest.Mocked<AuthService>;

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render the register form as in the mockup', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Créer un compte');
    expect(el.querySelector('#register-email')).toBeTruthy();
    expect(el.querySelector('#register-password')).toBeTruthy();
    expect(el.querySelector('#register-confirm')?.getAttribute('placeholder')).toBe('Saisissez le à nouveau');
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Créer mon compte');
  });

  it('should link to the login page', () => {
    const link = el.querySelector<HTMLAnchorElement>('.auth-switch')!;
    expect(link.textContent?.trim()).toBe("J'ai déjà un compte");
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('should flag mismatching passwords', () => {
    fillForm('user@example.com', 'password123', 'password456');

    expect(component.form.hasError('passwordMismatch')).toBe(true);
    expect(el.querySelector('#register-confirm-error')?.textContent).toContain(
      'Les mots de passe ne correspondent pas.',
    );
  });

  it('should not call the API when the form is invalid', () => {
    fillForm('user@example.com', 'password123', 'password456');
    submit();
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should register with email and password only, then redirect to /login', () => {
    authSpy.register.mockReturnValue(
      of({ id: 1, email: 'user@example.com', createdAt: '2026-10-07T21:32:00Z' }),
    );
    fillForm('user@example.com', 'password123', 'password123');

    submit();

    expect(authSpy.register).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should display a specific message when the email is already used (409)', () => {
    authSpy.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    fillForm('user@example.com', 'password123', 'password123');

    submit();

    expect(el.querySelector('.form-error')?.textContent).toContain('Cet email est déjà utilisé.');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should display a generic message on other errors', () => {
    authSpy.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    fillForm('user@example.com', 'password123', 'password123');

    submit();

    expect(el.querySelector('.form-error')?.textContent).toContain('Une erreur est survenue');
  });
});
