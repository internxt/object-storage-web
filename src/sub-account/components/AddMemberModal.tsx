import { useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface AddMemberModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onAdd: (email: string, password: string | undefined, role: 'admin' | 'standard') => Promise<void>;
}

export const AddMemberModal = ({ isOpen, isLoading, onClose, onAdd }: AddMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'standard'>('standard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(email, password || undefined, role);
    setEmail('');
    setPassword('');
    setRole('standard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 pt-2'>
        <p className='font-semibold text-lg'>Add Member</p>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>Email</label>
          <Input value={email} onChange={setEmail} placeholder='member@example.com' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>Password (optional)</label>
          <Input value={password} onChange={setPassword} placeholder='Leave empty for SSO-only' type='password' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'standard')}
            className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='standard'>Standard</option>
            <option value='admin'>Admin</option>
          </select>
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={!email || isLoading} isLoading={isLoading}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};
