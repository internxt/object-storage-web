import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { CreateSubAccountDto } from '../services/management.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateSubAccountDto) => Promise<void>;
}

type FormValues = CreateSubAccountDto & { confirmPassword?: string };

export const CreateSubAccountModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({ mode: 'onChange' });

  const isTrial = watch('isTrial');

  const handleClose = () => {
    reset();
    setError(undefined);
    onClose();
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
      handleClose();
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to create sub-account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold text-gray-900'>Create Sub-Account</h2>

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
            <input
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
              type='password'
              placeholder='Password'
              className={inputClass}
            />
          </Field>

          <Field label='Customer ID' error={errors.customerId?.message}>
            <input
              {...register('customerId', { required: 'Customer ID is required' })}
              placeholder='Customer ID'
              className={inputClass}
            />
          </Field>

          <div className='flex items-center gap-2'>
            <input
              {...register('isTrial')}
              type='checkbox'
              id='isTrial'
              className='w-4 h-4 rounded'
            />
            <label htmlFor='isTrial' className='text-sm text-gray-700'>
              Trial account
            </label>
          </div>

          {isTrial && (
            <>
              <Field label='Trial Quota (TB)' error={errors.trialQuotaTB?.message}>
                <input
                  {...register('trialQuotaTB')}
                  type='number'
                  step='0.01'
                  placeholder='e.g. 1'
                  className={inputClass}
                />
              </Field>
              <Field label='Trial Days' error={errors.trialDays?.message}>
                <input
                  {...register('trialDays')}
                  type='number'
                  placeholder='e.g. 30'
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {error && (
            <p className='text-sm text-red-600'>{error}</p>
          )}

          <div className='flex justify-end gap-3 pt-2'>
            <Button variant='secondary' type='button' onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={!isValid || isSubmitting} loading={isSubmitting}>
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
    <label className='text-sm font-medium text-gray-700'>{label}</label>
    {children}
    {error && <span className='text-xs text-red-600'>{error}</span>}
  </div>
);
