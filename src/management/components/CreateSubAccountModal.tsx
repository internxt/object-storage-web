import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { CreateSubAccountDto } from '../services/management.service';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateSubAccountDto) => Promise<void>;
}

type FormValues = CreateSubAccountDto & { confirmPassword?: string };

interface SuccessData {
  email: string;
  password: string;
}

const CONSOLE_URL = 'https://console.internxt.com';

const flag = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const COUNTRIES: { value: string; label: string }[] = [
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AL', label: 'Albania' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BR', label: 'Brazil' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'CA', label: 'Canada' },
  { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'HR', label: 'Croatia' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'DK', label: 'Denmark' },
  { value: 'EG', label: 'Egypt' },
  { value: 'EE', label: 'Estonia' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'GR', label: 'Greece' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MT', label: 'Malta' },
  { value: 'MX', label: 'Mexico' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'NO', label: 'Norway' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'RO', label: 'Romania' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'RS', label: 'Serbia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'KR', label: 'South Korea' },
  { value: 'ES', label: 'Spain' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TR', label: 'Turkey' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VN', label: 'Vietnam' },
];

// Validación de password

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('At least one digit');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&* etc)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const CreateSubAccountModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | 'url' | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, touchedFields },
  } = useForm<FormValues>({ mode: 'onChange' });

  const password = watch('password');

  // Validar password en tiempo real
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleClose = () => {
    reset();
    setError(undefined);
    setSuccessData(null);
    setPasswordErrors([]);
    setShowPassword(false);
    onClose();
  };

  const handleCopy = async (text: string, field: 'email' | 'password' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const onFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      const { confirmPassword, ...dto } = data;
      await onSubmit({
        ...dto,
        trialQuotaTB: dto.trialQuotaTB ? Number(dto.trialQuotaTB) : undefined,
        trialDays: dto.trialDays ? Number(dto.trialDays) : undefined,
      });
      // Mostrar modal de éxito con credenciales
      setSuccessData({
        email: data.email,
        password: data.password,
      });
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to create sub-account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = password && validatePassword(password).isValid;
  const isFormValid = isValid && isPasswordValid;

  // Modal de éxito con credenciales
  if (successData) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-center w-12 h-12 mx-auto bg-green/20 rounded-full'>
            <Check className='w-6 h-6 text-green' />
          </div>

          <h2 className='text-lg font-semibold text-center text-gray-100'>
            Sub-Account Created Successfully
          </h2>

          <p className='text-sm text-gray-60 text-center'>
            Share these credentials with the new account owner:
          </p>

          <div className='space-y-3'>
            <CredentialField
              label='Console URL'
              value={CONSOLE_URL}
              isCopied={copiedField === 'url'}
              onCopy={() => handleCopy(CONSOLE_URL, 'url')}
            />
            <CredentialField
              label='Email'
              value={successData.email}
              isCopied={copiedField === 'email'}
              onCopy={() => handleCopy(successData.email, 'email')}
            />
            <CredentialField
              label='Password'
              value={successData.password}
              isCopied={copiedField === 'password'}
              onCopy={() => handleCopy(successData.password, 'password')}
              isPassword={true}
            />
          </div>

          <div className='p-3 bg-yellow/10 border border-yellow rounded-md'>
            <p className='text-xs text-yellow-dark'>
              ⚠️ Make sure to share these credentials securely. The password will not be shown again.
            </p>
          </div>

          <Button onClick={handleClose} className='w-full'>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  // Modal de formulario
  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold text-gray-100'>Create Sub-Account</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className='flex flex-col gap-3'>
          <Field label='Name' error={errors.name?.message}>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder='Account name'
              className={inputClass}
            />
          </Field>

          <Field label='Email' error={errors.email?.message}>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
              type='email'
              placeholder='email@example.com'
              className={inputClass}
            />
          </Field>

          <Field label='Password' error={errors.password?.message}>
            <div className='relative'>
              <input
                {...register('password', {
                  required: 'Password is required',
                  validate: (value) => validatePassword(value).isValid || 'Password does not meet the requirements',
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                className={`${inputClass} pr-10 ${
                  passwordErrors.length > 0 ? 'border-red focus:ring-red' : ''
                }`}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 flex items-center pr-3'
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <Eye className='h-5 w-5 text-gray-40' />
                ) : (
                  <EyeSlash className='h-5 w-5 text-gray-40' />
                )}
              </button>
            </div>
            {passwordErrors.length > 0 && touchedFields.password && (
              <div className='p-2 bg-red/10 border border-red rounded-md mt-2'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='w-4 h-4 text-red flex-shrink-0 mt-0.5' />
                  <div className='text-xs text-red-dark'>
                    <p className='font-medium mb-1'>Password must contain:</p>
                    <ul className='space-y-1'>
                      {passwordErrors.map((err) => (
                        <li key={err}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Field>

          <Field label='Country' error={errors.country?.message}>
            <div className='relative'>
              <select
                {...register('country', { required: 'Country is required' })}
                className={`${inputClass} appearance-none bg-white pr-8`}
                defaultValue=''
              >
                <option value='' disabled>
                  Select a country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {flag(c.value)} {c.label}
                  </option>
                ))}
              </select>
              <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>
                ▾
              </span>
            </div>
          </Field>

          <Field label='Postal Code' error={errors.postalCode?.message}>
            <input
              {...register('postalCode', { required: 'Postal code is required' })}
              placeholder='12345'
              className={inputClass}
            />
          </Field>

          {error && (
            <p className='text-sm text-red-600'>{error}</p>
          )}

          <div className='flex justify-end gap-3 pt-2'>
            <Button variant='secondary' type='button' onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={!isFormValid || isSubmitting} loading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const inputClass =
  'w-full border border-gray-20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className='flex flex-col gap-1'>
    <label className='text-sm font-medium text-gray-80'>{label}</label>
    {children}
    {error && <span className='text-xs text-red'>{error}</span>}
  </div>
);

const CredentialField = ({
  label,
  value,
  isCopied,
  onCopy,
  isPassword = false,
}: {
  label: string;
  value: string;
  isCopied: boolean;
  onCopy: () => void;
  isPassword?: boolean;
}) => {
  const displayValue = isPassword ? '•'.repeat(value.length) : value;

  return (
    <div className='flex items-center justify-between p-3 border border-gray-20 rounded-md bg-gray-5'>
      <div>
        <p className='text-xs font-medium text-gray-60'>{label}</p>
        <p className='text-sm font-mono text-gray-100 break-all'>{displayValue}</p>
      </div>
      <button
        type='button'
        onClick={onCopy}
        className='ml-2 p-2 hover:bg-gray-20 rounded transition-colors flex-shrink-0'
        title='Copy to clipboard'
      >
        {isCopied ? (
          <Check className='w-5 h-5 text-green' />
        ) : (
          <Copy className='w-5 h-5 text-gray-60' />
        )}
      </button>
    </div>
  );
};
