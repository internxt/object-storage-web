import { FormEvent, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { T, text } from '../sub-account/tokens';
import { PASSWORD_MIN_LENGTH, validatePassword } from './auth/passwordPolicy';
import { apiErrorMessage, isTwoFactorRequiredError } from '../utils/apiError';
import notificationsService from '../services/notifications.service';
import { PasswordRequirements } from './FieldFeedback';
import { TwoFactorCodeInput, TWO_FACTOR_CODE_LENGTH } from './two-factor/TwoFactorCodeInput';

const PasswordField = ({
  label,
  placeholder = '',
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <p style={{ ...text.label, marginBottom: 6 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            background: T.gray5,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '0 40px 0 12px',
            fontSize: 14,
            color: T.gray80,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: T.gray50,
            cursor: 'pointer',
          }}
        >
          {show ? <Eye size={16} /> : <EyeSlash size={16} />}
        </button>
      </div>
    </div>
  );
};

export interface ChangePasswordLabels {
  oldPassword: string;
  newPassword: string;
  newPasswordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  sameAsCurrent: string;
  mismatch: string;
  code: string;
  codeHint: string;
  submit: string;
  saving: string;
  success: string;
  failure: string;
}

const defaultLabels: ChangePasswordLabels = {
  oldPassword: 'Old password',
  newPassword: 'New password',
  newPasswordPlaceholder: `At least ${PASSWORD_MIN_LENGTH} characters`,
  confirmPassword: 'Confirm new password',
  confirmPasswordPlaceholder: 'Repeat new password',
  sameAsCurrent: 'New password must differ from current',
  mismatch: 'Passwords do not match',
  code: 'Verification code',
  codeHint: 'Enter the 6-digit code from your authenticator app.',
  submit: 'Change password',
  saving: 'Saving…',
  success: 'Password changed successfully',
  failure: 'Failed to change password',
};

export const ChangePasswordForm = ({
  onSubmit,
  labels,
}: {
  onSubmit: (currentPassword: string, newPassword: string, code?: string) => Promise<void>;
  labels?: Partial<ChangePasswordLabels>;
}) => {
  const copy = { ...defaultLabels, ...labels };
  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ newPassword: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState('');

  const policyErrors = touched.newPassword ? validatePassword(newPassword) : [];
  const sameAsCurrent = touched.newPassword && newPassword.length > 0 && newPassword === current;
  const mismatch = touched.confirm && confirm.length > 0 && newPassword !== confirm;

  const isValid =
    current.length > 0 &&
    newPassword.length > 0 &&
    confirm.length > 0 &&
    validatePassword(newPassword).length === 0 &&
    !sameAsCurrent &&
    newPassword === confirm &&
    (!needsCode || code.length === TWO_FACTOR_CODE_LENGTH);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ newPassword: true, confirm: true });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSubmit(current, newPassword, needsCode ? code : undefined);
      notificationsService.success({ text: copy.success });
      setCurrent('');
      setNewPassword('');
      setConfirm('');
      setCode('');
      setNeedsCode(false);
      setTouched({ newPassword: false, confirm: false });
    } catch (err) {
      if (isTwoFactorRequiredError(err)) {
        setNeedsCode(true);
        return;
      }
      notificationsService.error({
        text: apiErrorMessage(err, copy.failure),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PasswordField label={copy.oldPassword} value={current} onChange={setCurrent} />

      <PasswordField
        label={copy.newPassword}
        placeholder={copy.newPasswordPlaceholder}
        value={newPassword}
        onChange={(v) => {
          setNewPassword(v);
          setTouched((t) => ({ ...t, newPassword: true }));
        }}
      />

      {sameAsCurrent && <p style={{ fontSize: 12, color: T.red, margin: 0 }}>{copy.sameAsCurrent}</p>}

      {!sameAsCurrent && policyErrors.length > 0 && <PasswordRequirements errors={policyErrors} variant="list" />}

      <PasswordField
        label={copy.confirmPassword}
        placeholder={copy.confirmPasswordPlaceholder}
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
          setTouched((t) => ({ ...t, confirm: true }));
        }}
      />

      {mismatch && <p style={{ fontSize: 12, color: T.red, margin: 0 }}>{copy.mismatch}</p>}

      {needsCode && (
        <div>
          <p style={{ ...text.label, marginBottom: 6 }}>{copy.code}</p>
          <TwoFactorCodeInput value={code} onChange={setCode} placeholder='000000' />
          <p style={{ fontSize: 12, color: T.gray50, margin: '6px 0 0' }}>{copy.codeHint}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          type="submit"
          disabled={isSaving || !isValid}
          style={{
            height: 40,
            padding: '0 16px',
            background: T.primary,
            color: T.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: isSaving || !isValid ? 'not-allowed' : 'pointer',
            opacity: isSaving || !isValid ? 0.4 : 1,
          }}
        >
          {isSaving ? copy.saving : copy.submit}
        </button>
      </div>
    </form>
  );
};
