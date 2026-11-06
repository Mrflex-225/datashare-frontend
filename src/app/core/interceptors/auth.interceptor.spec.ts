import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jest.Mocked<AuthService>;
  let routerSpy: jest.Mocked<Router>;

  beforeEach(() => {
    authSpy = { getToken: jest.fn(), logout: jest.fn() } as unknown as jest.Mocked<AuthService>;
    routerSpy = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should add the Bearer token to protected requests', () => {
    authSpy.getToken.mockReturnValue('jwt-token');

    http.get('/api/files').subscribe();

    const req = httpMock.expectOne('/api/files');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush([]);
  });

  it('should not add a header when there is no token', () => {
    authSpy.getToken.mockReturnValue(null);

    http.get('/api/files').subscribe();

    const req = httpMock.expectOne('/api/files');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('should not add the token to auth endpoints', () => {
    authSpy.getToken.mockReturnValue('jwt-token');

    http.post('/api/login', {}).subscribe();

    const req = httpMock.expectOne('/api/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should log out and redirect to /login on 401 from a protected route', () => {
    authSpy.getToken.mockReturnValue('expired-token');

    http.get('/api/files').subscribe({ error: (err) => expect(err.status).toBe(401) });
    httpMock.expectOne('/api/files').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should let a 401 from /api/login reach the component untouched', () => {
    authSpy.getToken.mockReturnValue(null);

    http.post('/api/login', {}).subscribe({ error: (err) => expect(err.status).toBe(401) });
    httpMock.expectOne('/api/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should not log out on a 401 from a public download', () => {
    authSpy.getToken.mockReturnValue('jwt-token');
    const url = '/api/files/download/abc-123';

    http.post(url, { password: 'wrong' }).subscribe({ error: () => undefined });
    httpMock.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
  });
});
