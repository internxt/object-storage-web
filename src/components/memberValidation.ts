import { validatePassword } from './auth/passwordPolicy';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export type MemberEmailErrorCode = 'required' | 'invalid';
export type MemberPasswordErrorCode = 'required' | 'policy';

export const memberEmailError = (email: string): MemberEmailErrorCode | undefined => {
  if (!email) return 'required';
  return EMAIL_PATTERN.test(email) ? undefined : 'invalid';
};

export const memberPasswordError = (password: string, optional = false): MemberPasswordErrorCode | undefined => {
  if (!password) return optional ? undefined : 'required';
  return validatePassword(password).length > 0 ? 'policy' : undefined;
};
