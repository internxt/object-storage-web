import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Input from './Input';
import { T } from '../sub-account/tokens';
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

export const PasswordRequirements = ({ errors }: { errors: string[] }) => (
  <div className='p-2 bg-red/10 border border-red rounded-md mt-2'>
    <div className='flex items-start gap-2'>
      <AlertCircle className='w-4 h-4 text-red flex-shrink-0 mt-0.5' />
      <div className='text-xs text-red-dark'>
        <p className='font-medium mb-1'>Password must contain:</p>
        <ul className='space-y-1'>
          {errors.map((error) => (
            <li key={error}>• {error}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export const FieldError = ({ message }: { message: string }) => (
  <p style={{ fontSize: 12, color: T.red, margin: '6px 0 0' }}>{message}</p>
);

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
      {showError && <FieldError message={error} />}
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
        accent={requirements.length > 0 ? 'error' : undefined}
      />
      {requirements.length > 0 && <PasswordRequirements errors={requirements} />}
      {showError && <FieldError message={error} />}
    </>
  );
};
