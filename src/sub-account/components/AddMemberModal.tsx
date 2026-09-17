import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { T, text, form } from '../tokens';

interface AddMemberModalProps {
  isOpen: boolean;
  isLoading: boolean;
  ssoEnabled: boolean;
  onClose: () => void;
  onAdd: (email: string, password: string | undefined, role: 'admin' | 'standard') => Promise<void>;
}

export const AddMemberModal = ({ isOpen, isLoading, ssoEnabled, onClose, onAdd }: AddMemberModalProps) => {
  const { t } = useTranslation('subaccount');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'standard'>('standard');

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setRole('standard');
    }
  }, [isOpen]);

  const canSubmit = !!email && (ssoEnabled || password.length >= 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // No password for SSO members as the backend creates them as SSO-managed (password: null)
    // and they get linked to their Microsoft identity automatically on first login.
    await onAdd(email, ssoEnabled ? undefined : password, role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <p style={{ ...text.heading, margin: 0 }}>{t('addMemberModal.title')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>{t('addMemberModal.emailLabel')}</label>
          <Input value={email} onChange={setEmail} placeholder={t('addMemberModal.emailPlaceholder')} variant='email' />
        </div>

        {!ssoEnabled ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>
              {t('addMemberModal.passwordLabel')} <span style={{ color: T.red }}>*</span>
            </label>
            <Input value={password} onChange={setPassword} placeholder={t('addMemberModal.passwordPlaceholder')} variant='password' />
          </div>
        ) : (
          <p style={form.hint}>
            {t('addMemberModal.ssoHint')}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>{t('addMemberModal.roleLabel')}</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'standard')} style={form.select}>
            <option value='standard'>{t('addMemberModal.roleStandard')}</option>
            <option value='admin'>{t('addMemberModal.roleAdmin')}</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            {t('actions.cancel')}
          </Button>
          <Button type='submit' disabled={!canSubmit || isLoading} loading={isLoading}>
            {t('addMemberModal.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
