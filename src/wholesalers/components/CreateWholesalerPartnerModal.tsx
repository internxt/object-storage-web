import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { passwordPolicyErrors } from '../../utils/passwordPolicy';
import { PasswordRequirements } from '../../components/FieldFeedback';
import { Field, inputClass } from '../../components/FormField';
import { Switch } from '../../components/Switch';
import { storageLimitValidationError } from '../utils/storageLimit';
import { StorageLimitInfo } from './StorageLimitInfo';
import { apiErrorMessage } from '../../utils/apiError';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; email: string; password: string; storageLimitTB?: number }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string; storageLimitTB: string };

const MIN_PASSWORD_LENGTH = 8;

export const CreateWholesalerPartnerModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const [isStorageLimitEnabled, setIsStorageLimitEnabled] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    unregister,
    formState: { errors, isValid },
  } = useForm<FormValues>({ mode: 'onChange' });

  const password = watch('password');
  const passwordErrors = password ? passwordPolicyErrors(password, MIN_PASSWORD_LENGTH) : [];

  const handleClose = () => {
    reset();
    setError(undefined);
    setShowPassword(false);
    setIsStorageLimitEnabled(false);
    onClose();
  };

  const onFormSubmit = async ({ storageLimitTB, ...data }: FormValues) => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(isStorageLimitEnabled ? { ...data, storageLimitTB: Number(storageLimitTB) } : data);
      handleClose();
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't create the partner. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = !!password && passwordErrors.length === 0;
  const isFormValid = isValid && isPasswordValid;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold text-gray-100'>Create Partner</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className='flex flex-col gap-3'>
          <Field label='Name' error={errors.name?.message}>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder='Partner name'
              className={inputClass(errors.name)}
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
              className={inputClass(errors.email)}
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
                className={`${inputClass(passwordErrors.length > 0)} pr-10`}
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
            {passwordErrors.length > 0 && (
              <PasswordRequirements errors={passwordErrors} />
            )}
          </Field>

          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1.5'>
              <Switch
                label='Storage limit'
                checked={isStorageLimitEnabled}
                onChange={(checked) => {
                  setIsStorageLimitEnabled(checked);
                  if (!checked) unregister('storageLimitTB');
                }}
              />
              <StorageLimitInfo />
            </div>
            {isStorageLimitEnabled && (
              <Field label='Storage limit (TB)' error={errors.storageLimitTB?.message}>
                <input
                  {...register('storageLimitTB', { validate: (value) => storageLimitValidationError(value) ?? true })}
                  inputMode='numeric'
                  placeholder='1–10'
                  className={inputClass(errors.storageLimitTB)}
                />
              </Field>
            )}
          </div>

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

