import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { COUNTRIES, getFlagEmoji } from '../../utils/countries';
import { apiErrorMessage } from '../../utils/apiError';
import { validatePassword } from '../../components/auth/passwordPolicy';
import { PasswordRequirements } from '../../components/FieldFeedback';
import { Field } from '../../components/FormField';
import { inputClass } from '../../components/inputClass';
import { requiredNameRules } from '../../utils/clientName';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: {
    name: string;
    email: string;
    password: string;
    country: string;
    postalCode: string;
  }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string; country: string; postalCode: string };

export const CreatePartnerModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({ mode: 'all' });

  const password = useWatch({ control, name: 'password' });
  const passwordErrors = password ? validatePassword(password) : [];

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
      setError(apiErrorMessage(err, 'Failed to create partner'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Create Partner</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-3">
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register('name', requiredNameRules())}
              placeholder="Partner name"
              className={inputClass(errors.name)}
            />
          </Field>

          <Field label="Contact Email" error={errors.email?.message}>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
              type="email"
              placeholder="contact@example.com"
              className={inputClass(errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              {...register('password', {
                required: 'Password is required',
                validate: (value: string) =>
                  validatePassword(value).length === 0 || 'Password does not meet the requirements',
              })}
              type="password"
              placeholder="••••••••"
              className={inputClass(errors.password)}
            />
            {passwordErrors.length > 0 && <PasswordRequirements errors={passwordErrors} />}
          </Field>

          <Field label="Country" error={errors.country?.message}>
            <div className="relative">
              <select
                {...register('country', { required: 'Country is required' })}
                className={`${inputClass(errors.country)} appearance-none bg-white pr-8`}
                defaultValue=""
              >
                <option value="" disabled>
                  Select a country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {getFlagEmoji(c.value)} {c.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
            </div>
          </Field>

          <Field label="Postal Code" error={errors.postalCode?.message}>
            <input
              {...register('postalCode', { required: 'Postal code is required' })}
              placeholder="12345"
              className={inputClass(errors.postalCode)}
            />
          </Field>

          {error && <p className="text-sm text-red">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting} loading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
