import { useEffect, useState } from 'react';
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
          <label style={form.label}>Email</label>
          <Input value={email} onChange={setEmail} placeholder='member@example.com' variant='email' />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>
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
          <label style={form.label}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'standard')} style={form.select}>
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
