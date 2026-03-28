import {
  FieldError,
  Path,
  UseFormRegister,
  ValidationRule,
} from 'react-hook-form';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { useState } from 'react';

export interface IFormValues {
  name: string;
  lastname: string;
  email: string;
  password: string;
  lastPassword: string;
  currentPassword: string;
  twoFactorCode: string;
  confirmPassword: string;
  acceptTerms: boolean;
  backupKey: string;
  createFolder: string;
  teamMembers: number;
  token: string;
  userRole: string;
  companyName: string;
  companyVatId: string;
  newPassword: string;
  repeatNewPassword: string;
}

import { JSX } from 'react';
import TextInput from './auth/TextInput';

interface InputProps {
  label: Path<IFormValues>;
  disabled?: boolean;
  register: UseFormRegister<IFormValues>;
  minLength?: ValidationRule<number> | undefined;
  maxLength?: ValidationRule<number> | undefined;
  placeholder: string;
  pattern?: ValidationRule<RegExp> | undefined;
  error: FieldError | undefined;
  min?: ValidationRule<number | string> | undefined;
  required?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  value?: string;
  autoComplete?: string;
  inputDataCy?: string;
}

const PasswordInput = ({
  label,
  disabled,
  register,
  placeholder,
  error,
  onFocus,
  onBlur,
  className,
}: InputProps): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={`relative flex-1 ${className}`}>
      <TextInput
        error={error}
        label={label}
        disabled={disabled}
        register={register}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        min={0}
        required={true}
        autoComplete={'off'}
        onFocus={() => {
          if (onFocus) onFocus();
        }}
        onBlur={() => {
          if (onBlur) onBlur();
        }}
      />
      <button
        type='button'
        className='absolute inset-y-0 right-0 flex items-center pr-3'
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <Eye className='h-5 w-5 text-gray-400' />
        ) : (
          <EyeSlash className='h-5 w-5 text-gray-400' />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
