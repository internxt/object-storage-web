import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; email: string; password: string }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string };

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

  return { isValid: errors.length === 0, errors };
};

export const CreateWholesalerPartnerModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, touchedFields },
  } = useForm<FormValues>({ mode: 'onChange' });

  const password = watch('password');

  useEffect(() => {
    setPasswordErrors(password ? validatePassword(password).errors : []);
  }, [password]);

  const handleClose = () => {
    reset();
    setError(undefined);
    setPasswordErrors([]);
    onClose();
  };

  const onFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(data);
      handleClose();
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to create partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = password && validatePassword(password).isValid;
  const isFormValid = isValid && isPasswordValid;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold text-gray-900'>Create Partner</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className='flex flex-col gap-3'>
          <Field label='Name' error={errors.name?.message}>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder='Partner name'
              className={`${inputClass} ${errors.name ? 'border-red focus:ring-red' : ''}`}
            />
          </Field>

          <Field label='Contact Email' error={errors.email?.message}>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
              type='email'
              placeholder='contact@example.com'
              className={`${inputClass} ${errors.email ? 'border-red focus:ring-red' : ''}`}
            />
          </Field>

          <Field label='Password' error={errors.password?.message}>
            <input
              {...register('password', {
                required: 'Password is required',
                validate: (value: string) =>
                  validatePassword(value).isValid || 'Password does not meet the requirements',
              })}
              type='password'
              placeholder='••••••••'
              className={`${inputClass} ${passwordErrors.length > 0 ? 'border-red focus:ring-red' : ''}`}
            />
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

          {error && <p className='text-sm text-red'>{error}</p>}

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
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className='flex flex-col gap-1'>
    <label className='text-sm font-medium text-gray-700'>{label}</label>
    {children}
    {error && <span className='text-xs text-red'>{error}</span>}
  </div>
);
