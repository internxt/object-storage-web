import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { COUNTRIES, flag } from '../../utils/countries';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; email: string; password: string; country: string; postalCode: string }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string; country: string; postalCode: string };

export const CreatePartnerModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({ mode: 'onChange' });

  const handleClose = () => {
    reset();
    setError(undefined);
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold text-gray-900'>Create Partner</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className='flex flex-col gap-3'>
          <Field label='Name' error={errors.name?.message}>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder='Partner name'
              className={inputClass}
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
              className={inputClass}
            />
          </Field>

          <Field label='Password' error={errors.password?.message}>
            <input
              {...register('password', { required: 'Password is required' })}
              type='password'
              placeholder='••••••••'
              className={inputClass}
            />
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

          {error && <p className='text-sm text-red-600'>{error}</p>}

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
