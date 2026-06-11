import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { T, text, form } from '../tokens';

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

  useEffect(() => {
    if (!isOpen) {
      setBucketName('');
      setPrefixesInput('');
      setPermission('read');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefixes = prefixesInput
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    await onAssign(bucketName, prefixes, permission);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <div>
          <p style={{ ...text.heading, margin: '0 0 2px' }}>Assign Permissions</p>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>{memberEmail}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Bucket name</label>
          <Input value={bucketName} onChange={setBucketName} placeholder='my-bucket' />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Prefixes</label>
          <textarea
            value={prefixesInput}
            onChange={(e) => setPrefixesInput(e.target.value)}
            placeholder={'folder/\nother-folder/'}
            style={form.textarea}
          />
          <p style={form.hint}>One per line. Leave empty to grant access to the entire bucket.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Permission</label>
          <select value={permission} onChange={(e) => setPermission(e.target.value as 'read' | 'write' | 'full')} style={form.select}>
            <option value='read'>Read</option>
            <option value='write'>Write</option>
            <option value='full'>Full</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
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
