import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { passwordPolicyErrors } from '../../utils/passwordPolicy';
import { PasswordRequirements } from '../../components/FieldFeedback';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; email: string; password: string }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string };

const MIN_PASSWORD_LENGTH = 8;

export const CreateWholesalerPartnerModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
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

  useEffect(() => {
    setPasswordErrors(password ? passwordPolicyErrors(password, MIN_PASSWORD_LENGTH) : []);
  }, [password]);

  const handleClose = () => {
    reset();
    setError(undefined);
    setPasswordErrors([]);
    setShowPassword(false);
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

  const isPasswordValid = password && passwordPolicyErrors(password, MIN_PASSWORD_LENGTH).length === 0;
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
            <div className='relative'>
              <input
                {...register('password', {
                  required: 'Password is required',
                  validate: (value: string) =>
                    passwordPolicyErrors(value, MIN_PASSWORD_LENGTH).length === 0 ||
                    'Password does not meet the requirements',
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                className={`${inputClass} pr-10 ${passwordErrors.length > 0 ? 'border-red focus:ring-red' : ''}`}
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
              <PasswordRequirements errors={passwordErrors} />
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
