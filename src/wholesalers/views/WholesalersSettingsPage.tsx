import { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { wholesalersService } from '../services/wholesalers.service';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import notificationsService from '../../services/notifications.service';
import { passwordPolicyErrors } from '../../utils/passwordPolicy';
import { apiErrorMessage } from '../../utils/apiError';
import { T, text } from '../../sub-account/tokens';

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div
    style={{
      background: T.white,
      border: `1px solid ${T.gray20}`,
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    }}
  >
    <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>{title}</h2>
    {subtitle && <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{subtitle}</p>}
    <div style={{ marginTop: 16 }}>{children}</div>
  </div>
);

const ReadField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p style={{ ...text.label, marginBottom: 6 }}>{label}</p>
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: T.gray5,
        border: `1px solid ${T.gray20}`,
        borderRadius: 8,
        fontSize: 14,
        color: T.gray80,
      }}
    >
      {value || '—'}
    </div>
  </div>
);

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
            color: T.gray100,
            outline: 'none',
          }}
        />
        <button
          type='button'
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 8,
            top: 0,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            color: T.gray50,
            cursor: 'pointer',
          }}
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export const WholesalersSettingsPage = () => {
  const profile = wholesalersAuthService.getPayload();

  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ newPassword: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);

  const policyErrors = touched.newPassword ? passwordPolicyErrors(newPassword) : [];
  const sameAsCurrent = touched.newPassword && newPassword.length > 0 && newPassword === current;
  const mismatch = touched.confirm && confirm.length > 0 && newPassword !== confirm;

  const isValid =
    current.length > 0 &&
    newPassword.length > 0 &&
    confirm.length > 0 &&
    passwordPolicyErrors(newPassword).length === 0 &&
    !sameAsCurrent &&
    newPassword === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirm: true });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await wholesalersService.changePassword(current, newPassword);
      notificationsService.success({ text: 'Password changed successfully' });
      setCurrent('');
      setNewPassword('');
      setConfirm('');
      setTouched({ newPassword: false, confirm: false });
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to change password') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <SectionCard title='Account'>
        <ReadField label='Email' value={profile?.email ?? ''} />
      </SectionCard>

      <SectionCard title='Change password' subtitle='Changing your password signs out every other session.'>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PasswordField label='Current password' value={current} onChange={setCurrent} />

          <PasswordField
            label='New password'
            placeholder='At least 6 characters'
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v);
              setTouched((t) => ({ ...t, newPassword: true }));
            }}
          />

          {sameAsCurrent && (
            <p style={{ fontSize: 12, color: T.red, margin: 0 }}>New password must differ from current</p>
          )}

          {!sameAsCurrent && policyErrors.length > 0 && (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: 0, padding: 0, listStyle: 'none' }}>
              {policyErrors.map((error) => (
                <li key={error} style={{ fontSize: 12, color: T.red }}>
                  · {error}
                </li>
              ))}
            </ul>
          )}

          <PasswordField
            label='Confirm new password'
            placeholder='Repeat new password'
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setTouched((t) => ({ ...t, confirm: true }));
            }}
          />

          {mismatch && <p style={{ fontSize: 12, color: T.red, margin: 0 }}>Passwords do not match</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type='submit'
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
              {isSaving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
