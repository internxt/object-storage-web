import { CSSProperties, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { passwordPolicyErrors } from '../../utils/passwordPolicy';
import { PasswordRequirements } from '../../components/FieldFeedback';
import { requiredNameRules } from '../../utils/clientName';
import { T, form, text } from '../../sub-account/tokens';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; email: string; password: string }) => Promise<void>;
}

type FormValues = { name: string; email: string; password: string };

const MIN_PASSWORD_LENGTH = 8;

const inputStyle = (hasError: unknown): CSSProperties => ({
  width: '100%',
  height: 40,
  padding: '0 12px',
  background: T.gray5,
  border: `1px solid ${hasError ? T.red : T.gray20}`,
  borderRadius: 8,
  fontSize: 14,
  color: T.gray80,
  outline: 'none',
  boxSizing: 'border-box',
});

const errorStyle: CSSProperties = { display: 'block', fontSize: 12, color: T.red, marginTop: 4 };

export const CreateWholesalerPartnerModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({ mode: 'onChange' });

  const password = watch('password');
  const passwordErrors = password ? passwordPolicyErrors(password, MIN_PASSWORD_LENGTH) : [];

  const handleClose = () => {
    reset();
    setError(undefined);
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

  const isPasswordValid = !!password && passwordErrors.length === 0;
  const isFormValid = isValid && isPasswordValid;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth='max-w-md'>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ ...text.heading, margin: 0 }}>Create Partner</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={form.label}>Name</label>
            <input
              {...register('name', requiredNameRules())}
              placeholder='Partner name'
              style={inputStyle(errors.name)}
            />
            {errors.name?.message && <span style={errorStyle}>{errors.name.message}</span>}
          </div>

          <div>
            <label style={form.label}>Contact Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
              type='email'
              placeholder='contact@example.com'
              style={inputStyle(errors.email)}
            />
            {errors.email?.message && <span style={errorStyle}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={form.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password', {
                  required: 'Password is required',
                  validate: (value: string) =>
                    passwordPolicyErrors(value, MIN_PASSWORD_LENGTH).length === 0 ||
                    'Password does not meet the requirements',
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                style={{ ...inputStyle(passwordErrors.length > 0), paddingRight: 40 }}
              />
              <button
                type='button'
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', background: 'transparent', border: 'none',
                  color: T.gray50, cursor: 'pointer', padding: 0,
                }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={16} /> : <EyeSlash size={16} />}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <PasswordRequirements errors={passwordErrors} />
            )}
            {errors.password?.message && <span style={errorStyle}>{errors.password.message}</span>}
          </div>

          {error && <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
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

