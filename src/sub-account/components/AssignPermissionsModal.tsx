import { useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface AssignPermissionsModalProps {
  isOpen: boolean;
  isLoading: boolean;
  memberEmail: string;
  onClose: () => void;
  onAssign: (bucketName: string, prefixes: string[], permission: 'read' | 'write' | 'full') => Promise<void>;
}

export const AssignPermissionsModal = ({ isOpen, isLoading, memberEmail, onClose, onAssign }: AssignPermissionsModalProps) => {
  const [bucketName, setBucketName] = useState('');
  const [prefixesInput, setPrefixesInput] = useState('');
  const [permission, setPermission] = useState<'read' | 'write' | 'full'>('read');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefixes = prefixesInput
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    await onAssign(bucketName, prefixes, permission);
    setBucketName('');
    setPrefixesInput('');
    setPermission('read');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 pt-2'>
        <p className='font-semibold text-lg'>Assign Permissions — {memberEmail}</p>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>Bucket name</label>
          <Input value={bucketName} onChange={setBucketName} placeholder='my-bucket' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>Prefixes (one per line, leave empty for full bucket)</label>
          <textarea
            value={prefixesInput}
            onChange={(e) => setPrefixesInput(e.target.value)}
            placeholder={'folder/\nother-folder/'}
            className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium text-gray-700'>Permission</label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'read' | 'write' | 'full')}
            className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='read'>Read</option>
            <option value='write'>Write</option>
            <option value='full'>Full</option>
          </select>
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={!bucketName || isLoading} loading={isLoading}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
};
