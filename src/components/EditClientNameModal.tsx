import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PencilSimple } from '@phosphor-icons/react';
import Modal from './Modal';
import Button from './Button';
import { Field, inputClass } from './FormField';
import notificationsService from '../services/notifications.service';
import { apiErrorMessage } from '../utils/apiError';
import { requiredNameRules } from '../utils/clientName';

interface Props {
  isOpen: boolean;
  currentName: string | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

type FormValues = { name: string };

export const EditClientNameModal = ({ isOpen, currentName, onClose, onSubmit }: Props) => {
  const [error, setError] = useState<string>();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({ mode: 'onChange', defaultValues: { name: currentName ?? '' } });

  useEffect(() => {
    if (isOpen) {
      reset({ name: currentName ?? '' });
      setError(undefined);
    }
  }, [isOpen, currentName, reset]);

  const isUnchanged = watch('name') === (currentName ?? '');

  const onFormSubmit = async ({ name }: FormValues) => {
    setError(undefined);
    try {
      await onSubmit(name);
      notificationsService.success({ text: 'Name updated' });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update the name'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-lg font-semibold text-gray-100'>Edit name</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className='flex flex-col gap-3'>
          <Field label='Name' error={errors.name?.message}>
            <input
              {...register('name', requiredNameRules())}
              placeholder='Name'
              autoFocus
              className={inputClass(errors.name)}
            />
          </Field>

          {error && <p className='text-sm text-red'>{error}</p>}

          <div className='flex justify-end gap-3 pt-2'>
            <Button variant='secondary' type='button' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={!isValid || isUnchanged || isSubmitting} loading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

/** Pencil button that opens EditClientNameModal, for detail page headers. */
export const EditClientNameButton = ({
  currentName,
  onSubmit,
}: {
  currentName: string | null;
  onSubmit: (name: string) => Promise<void>;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label='Edit name'
        title='Edit name'
        className='p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors'
      >
        <PencilSimple size={16} />
      </button>
      <EditClientNameModal
        isOpen={isOpen}
        currentName={currentName}
        onClose={() => setIsOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
};
