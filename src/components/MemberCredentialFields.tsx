import { useState } from 'react';
import Input from './Input';
import {
  FieldErrorMessage,
  PasswordRequirements,
} from './FieldFeedback';
import { passwordPolicyErrors } from '../utils/passwordPolicy';

export const MIN_MEMBER_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export type MemberEmailErrorCode = 'required' | 'invalid';
export type MemberPasswordErrorCode = 'required' | 'policy';

export interface MemberCredentialLabels {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordPolicy: string;
}

const defaultLabels: MemberCredentialLabels = {
  emailRequired: 'Email is required',
  emailInvalid: 'Invalid email',
  passwordRequired: 'Password is required',
  passwordPolicy: 'Password does not meet the requirements',
};

export const memberEmailError = (
  email: string,
): MemberEmailErrorCode | undefined => {
  if (!email) return 'required';
  return EMAIL_PATTERN.test(email) ? undefined : 'invalid';
};

export const memberPasswordError = (
  password: string,
  optional = false,
): MemberPasswordErrorCode | undefined => {
  if (!password) return optional ? undefined : 'required';
  return passwordPolicyErrors(password, MIN_MEMBER_PASSWORD_LENGTH).length > 0
    ? 'policy'
    : undefined;
};

export const MemberEmailField = ({
  value,
  onChange,
  placeholder,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  labels?: Partial<MemberCredentialLabels>;
}) => {
  const copy = { ...defaultLabels, ...labels };
  const [touched, setTouched] = useState(false);
  const error = touched || value.length > 0 ? memberEmailError(value) : undefined;

  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        variant='email'
        accent={error ? 'error' : undefined}
      />
      {error && (
        <FieldErrorMessage
          message={error === 'required' ? copy.emailRequired : copy.emailInvalid}
        />
      )}
    </>
  );
};

export const MemberPasswordField = ({
  value,
  onChange,
  placeholder,
  optional = false,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  labels?: Partial<MemberCredentialLabels>;
}) => {
  const copy = { ...defaultLabels, ...labels };
  const [touched, setTouched] = useState(false);
  const error =
    touched || value.length > 0
      ? memberPasswordError(value, optional)
      : undefined;
  const requirements = value
    ? passwordPolicyErrors(value, MIN_MEMBER_PASSWORD_LENGTH)
    : [];

  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        variant='password'
        accent={error ? 'error' : undefined}
      />
      {requirements.length > 0 && <PasswordRequirements errors={requirements} />}
      {error && (
        <FieldErrorMessage
          message={
            error === 'required' ? copy.passwordRequired : copy.passwordPolicy
          }
        />
      )}
    </>
  );
};
