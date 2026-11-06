import { FormControl, FormGroup } from '@angular/forms';
import { passwordMatchValidator } from './password-match.validator';

describe('passwordMatchValidator', () => {
  const buildGroup = (password: string, confirmPassword: string) =>
    new FormGroup({
      password: new FormControl(password),
      confirmPassword: new FormControl(confirmPassword),
    });

  it('should return null when passwords match', () => {
    expect(passwordMatchValidator(buildGroup('password123', 'password123'))).toBeNull();
  });

  it('should return an error when passwords differ', () => {
    expect(passwordMatchValidator(buildGroup('password123', 'other1234'))).toEqual({
      passwordMismatch: true,
    });
  });

  it('should return null while the confirmation is empty', () => {
    expect(passwordMatchValidator(buildGroup('password123', ''))).toBeNull();
  });
});
