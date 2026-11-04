import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Field } from '../../components/FormField';
import { inputClass } from '../../components/inputClass';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';

interface Props {
  isOpen: boolean;
  currentEmail: string | null;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}

type FormValues = { email: string };

export const MigrateToNewConsoleModal = ({ isOpen, currentEmail, onClose, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({ mode: 'onChange', defaultValues: { email: currentEmail ?? '' } });

  useEffect(() => {
    if (isOpen) reset({ email: currentEmail ?? '' });
  }, [isOpen, currentEmail, reset]);

  const onFormSubmit = async ({ email }: FormValues) => {
    try {
      await onSubmit(email.trim());
      notificationsService.success({ text: 'Sub-account migrated. A welcome email has been sent.' });
      onClose();
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to migrate the sub-account') });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" preventClosing={isSubmitting}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-100">Migrate to new console</h2>
          <p className="text-sm text-gray-60">
            An admin user with full storage access will be created with this email, and they'll receive a link to set
            their password. Buckets, data and access keys stay unchanged.
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-3">
          <Field label="Admin email" error={errors.email?.message}>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
              type="email"
              placeholder="email@example.com"
              autoFocus
              className={inputClass(errors.email)}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting} loading={isSubmitting}>
              Migrate
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
