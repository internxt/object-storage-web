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

  const canSubmit = !!email && (ssoEnabled || password.length >= 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    let userPassword = password;
    if (ssoEnabled) {
      // Generates a random password if SSO is enabled
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      userPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(n => chars[n % chars.length])
        .join('');
    }
    await onAdd(email, userPassword ?? undefined, role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <p style={{ ...text.heading, margin: 0 }}>Add Member</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Email</label>
          <Input value={email} onChange={setEmail} placeholder='member@example.com' variant='email' />
        </div>

        {!ssoEnabled ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>
              Password <span style={{ color: T.red }}>*</span>
            </label>
            <Input value={password} onChange={setPassword} placeholder='At least 8 characters' variant='password' />
          </div>
        ) : (
          <p style={form.hint}>
            Single sign-on is enabled for this organization, so no password is needed — this member will sign in with Microsoft.
          </p>
        )}

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
