import { useState } from 'react';
import Input from './Input';
import {
  FieldErrorMessage,
  PasswordRequirements,
} from './FieldFeedback';
import { passwordPolicyErrors } from '../utils/passwordPolicy';

export const MIN_MEMBER_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export const memberEmailError = (email: string): string | undefined => {
  if (!email) return 'Email is required';
  return EMAIL_PATTERN.test(email) ? undefined : 'Invalid email';
};

export const memberPasswordError = (
  password: string,
  optional = false,
): string | undefined => {
  if (!password) return optional ? undefined : 'Password is required';
  return passwordPolicyErrors(password, MIN_MEMBER_PASSWORD_LENGTH).length > 0
    ? 'Password does not meet the requirements'
    : undefined;
};

export const MemberEmailField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const [touched, setTouched] = useState(false);
  const error = memberEmailError(value);
  const showError = (touched || value.length > 0) && error;

  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        variant='email'
        accent={showError ? 'error' : undefined}
      />
      {showError && <FieldErrorMessage message={error} />}
    </>
  );
};

export const MemberPasswordField = ({
  value,
  onChange,
  placeholder,
  optional = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
}) => {
  const [touched, setTouched] = useState(false);
  const error = memberPasswordError(value, optional);
  const requirements = value
    ? passwordPolicyErrors(value, MIN_MEMBER_PASSWORD_LENGTH)
    : [];
  const showError = (touched || value.length > 0) && error;

  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        variant='password'
        accent={showError ? 'error' : undefined}
      />
      {requirements.length > 0 && <PasswordRequirements errors={requirements} />}
      {showError && <FieldErrorMessage message={error} />}
    </>
  );
};
