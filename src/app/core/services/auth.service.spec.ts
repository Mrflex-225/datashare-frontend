import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, TOKEN_EXPIRY_KEY, TOKEN_KEY } from './auth.service';


const fakeJwt = (exp: number): string => `header.${btoa(JSON.stringify({ sub: 'user', exp }))}.signature`;

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const credentials = { email: 'user@example.com', password: 'password123' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should not be authenticated by default', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  describe('login', () => {
    it('should POST credentials to /api/login', () => {
      service.login(credentials).subscribe();

      const req = httpMock.expectOne('/api/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush('raw-token');
    });

    it('should store a raw text JWT and use its exp claim as expiry', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const jwt = fakeJwt(exp);

      service.login(credentials).subscribe((token) => expect(token).toBe(jwt));
      httpMock.expectOne('/api/login').flush(jwt);

      expect(localStorage.getItem(TOKEN_KEY)).toBe(jwt);
      expect(localStorage.getItem(TOKEN_EXPIRY_KEY)).toBe(String(exp * 1000));
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getToken()).toBe(jwt);
    });

    it('should also accept the JSON format from the API contract', () => {
      service.login(credentials).subscribe((token) => expect(token).toBe('json-token'));
      httpMock
        .expectOne('/api/login')
        .flush(JSON.stringify({ token: 'json-token', type: 'Bearer', expiresIn: 86400 }));

      expect(localStorage.getItem(TOKEN_KEY)).toBe('json-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should fail when the response contains no token', () => {
      const next = jest.fn();
      const error = jest.fn();
      service.login(credentials).subscribe({ next, error });
      httpMock.expectOne('/api/login').flush('');

      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should not store anything when credentials are rejected', () => {
      const next = jest.fn();
      const error = jest.fn();
      service.login(credentials).subscribe({ next, error });
      httpMock.expectOne('/api/login').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  it('should POST credentials to /api/register', () => {
    service.register(credentials).subscribe();

    const req = httpMock.expectOne('/api/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(null, { status: 201, statusText: 'Created' });

    expect(service.isAuthenticated()).toBe(false);
  });

  it('should clear the token on logout', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-token');
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 60_000));
    service.isAuthenticated.set(true);

    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(TOKEN_EXPIRY_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should ignore an expired token', () => {
    localStorage.setItem(TOKEN_KEY, 'old-token');
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() - 1000));

    expect(service.getToken()).toBeNull();
  });

  it('should read the user email from the token subject', () => {
    localStorage.setItem(TOKEN_KEY, fakeJwt(Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 60_000));

    expect(service.getUserEmail()).toBe('user');
  });
});
