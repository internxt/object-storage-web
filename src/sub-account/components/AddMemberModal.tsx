import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { T, shadow, text } from '../tokens';

const selectStyle: React.CSSProperties = {
  height: 40, width: '100%', padding: '0 12px',
  border: `1px solid ${T.gray20}`, borderRadius: 8,
  fontSize: 14, color: T.gray100,
  background: '#fff', outline: 'none',
  fontFamily: 'inherit', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238E8E94' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};

const labelStyle: React.CSSProperties = {
  ...text.label, marginBottom: 4, display: 'block',
};

interface AddMemberModalProps {
  isOpen: boolean;
  isLoading: boolean;
  ssoEnabled: boolean;
  onClose: () => void;
  onAdd: (email: string, password: string | undefined, role: 'admin' | 'standard') => Promise<void>;
}

export const AddMemberModal = ({ isOpen, isLoading, ssoEnabled, onClose, onAdd }: AddMemberModalProps) => {
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

  const passwordRequired = !ssoEnabled;
  const canSubmit = !!email && (!passwordRequired || password.length >= 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onAdd(email, password || undefined, role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <p style={{ ...text.heading, margin: 0 }}>Add Member</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Email</label>
          <Input value={email} onChange={setEmail} placeholder='member@example.com' variant='email' />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>
            Password{' '}
            {passwordRequired
              ? <span style={{ color: T.red }}>*</span>
              : <span style={{ color: T.gray60 }}>(optional)</span>}
          </label>
          <Input
            value={password}
            onChange={setPassword}
            placeholder={passwordRequired ? 'At least 8 characters' : 'Leave empty for SSO-only'}
            variant='password'
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'standard')} style={selectStyle}>
            <option value='standard'>Standard</option>
            <option value='admin'>Admin</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={!canSubmit || isLoading} loading={isLoading}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};
