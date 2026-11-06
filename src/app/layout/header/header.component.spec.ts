import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../core/services/auth.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let el: HTMLElement;
  const isAuthenticated = signal(false);

  beforeEach(async () => {
    isAuthenticated.set(false);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated } }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should display the DataShare logo linking to home', () => {
    const logo = el.querySelector<HTMLAnchorElement>('.logo')!;
    expect(logo.textContent?.trim()).toBe('DataShare');
    expect(logo.getAttribute('href')).toBe('/');
  });

  it('should display "Se connecter" linking to /login when logged out', () => {
    const btn = el.querySelector<HTMLAnchorElement>('.btn-login')!;
    expect(btn.textContent?.trim()).toBe('Se connecter');
    expect(btn.getAttribute('href')).toBe('/login');
  });

  it('should display "Mon espace" linking to /history when logged in', () => {
    isAuthenticated.set(true);
    fixture.detectChanges();

    const btn = el.querySelector<HTMLAnchorElement>('.btn-login')!;
    expect(btn.textContent?.trim()).toBe('Mon espace');
    expect(btn.getAttribute('href')).toBe('/history');
  });
});
