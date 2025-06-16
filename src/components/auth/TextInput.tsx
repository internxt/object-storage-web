import {
  FieldError,
  Path,
  UseFormRegister,
  ValidationRule,
} from 'react-hook-form';
import { JSX } from 'react';
import { IFormValues } from '../PasswordInput';

interface InputProps {
  label: Path<IFormValues>;
  type: 'text' | 'email' | 'number' | 'password';
  disabled?: boolean;
  register: UseFormRegister<IFormValues>;
  minLength?: ValidationRule<number> | undefined;
  maxLength?: ValidationRule<number> | undefined;
  placeholder: string;
  pattern?: ValidationRule<RegExp> | undefined;
  error: FieldError | undefined;
  min?: ValidationRule<number | string> | undefined;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoComplete?: string;
  inputDataCy?: string;
}

export default function TextInput({
  label,
  type,
  disabled,
  register,
  minLength,
  maxLength,
  placeholder,
  pattern,
  error,
  min,
  required,
  className,
  autoFocus,
  inputDataCy,
}: Readonly<InputProps>): JSX.Element {
  const borderColor = error
    ? 'border-red-200 border-2'
    : 'border-gray-30 disabled:border-gray-10';

  const placeholderColor = 'placeholder-gray-30';

  const padding = 'pl-4 pr-10';

  return (
    <div className={`${className}`}>
      <input
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={'off'}
        id={label}
        min={0}
        required={true}
        autoFocus={autoFocus}
        data-cy={inputDataCy}
        {...register(label, {
          required,
          minLength,
          min,
          maxLength,
          pattern,
        })}
        className={` h-10 w-full rounded-md border bg-transparent text-lg font-normal text-gray-800 outline-none disabled:text-gray-40 disabled:placeholder-gray-20
          ${borderColor} ${placeholderColor} ${padding}`}
      />
    </div>
  );
}
