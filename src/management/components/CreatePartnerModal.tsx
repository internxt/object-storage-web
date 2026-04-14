import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getData as getCountries } from 'country-list';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; email: string; password: string; country: string; postalCode: string }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string; country: string; postalCode: string };

const countries = getCountries().sort((a: { code: string; name: string }, b: { code: string; name: string }) => a.name.localeCompare(b.name));

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}

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

          <div className='flex gap-3'>
            <Field label='Country' error={errors.country?.message}>
              <select
                {...register('country', { required: 'Country is required' })}
                className={selectClass}
                defaultValue=''
              >
                <option value='' disabled>Select country…</option>
                {countries.map(({ code, name }: { code: string; name: string }) => (
                  <option key={code} value={code}>
                    {countryFlag(code)} {name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label='Postal Code' error={errors.postalCode?.message}>
              <input
                {...register('postalCode', {
                  required: 'Postal code is required',
                  maxLength: { value: 20, message: 'Too long' },
                })}
                placeholder='28001'
                className={inputClass}
              />
            </Field>
          </div>

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

const selectClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

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
