import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { T } from '../tokens';

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

const textareaStyle: React.CSSProperties = {
  width: '100%', height: 96, padding: '10px 12px',
  border: `1px solid ${T.gray20}`, borderRadius: 8,
  fontSize: 14, color: T.gray100, lineHeight: 1.5,
  background: '#fff', outline: 'none', resize: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: T.gray80, marginBottom: 4, display: 'block',
};

const hintStyle: React.CSSProperties = {
  fontSize: 12, color: T.gray60, marginTop: 3,
};

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
          <p style={{ fontSize: 18, fontWeight: 600, color: T.gray100, margin: '0 0 2px' }}>Assign Permissions</p>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>{memberEmail}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Bucket name</label>
          <Input value={bucketName} onChange={setBucketName} placeholder='my-bucket' />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Prefixes</label>
          <textarea
            value={prefixesInput}
            onChange={(e) => setPrefixesInput(e.target.value)}
            placeholder={'folder/\nother-folder/'}
            style={textareaStyle}
          />
          <p style={hintStyle}>One per line. Leave empty to grant access to the entire bucket.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Permission</label>
          <select value={permission} onChange={(e) => setPermission(e.target.value as 'read' | 'write' | 'full')} style={selectStyle}>
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
