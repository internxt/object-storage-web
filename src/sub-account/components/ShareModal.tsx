import { ReactNode, useState } from 'react';
import { HttpStatusCode } from 'axios';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { S3Object } from '../../services/s3.service';
import { shareService } from '../services/share.service';
import { useSubAccount } from '../context/SubAccountContext';
import { displayName } from '../../utils/displayName';
import { hasApiErrorStatus } from '../../utils/apiError';
import { ShareLink } from './ShareLink';
import { T, text } from '../tokens';

interface ShareModalProps {
  obj: S3Object;
  bucket: string;
  endpoint?: string;
  region?: string;
  onClose: () => void;
}

type DurationPreset = '24h' | '7d' | '30d' | 'custom';

const MAX_CUSTOM_DAYS = 30;

const PRESET_HOURS: Record<Exclude<DurationPreset, 'custom'>, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * MAX_CUSTOM_DAYS,
};

const DurationOption = ({ title, selected, onSelect }: {
  title: string; selected: boolean; onSelect: () => void;
}) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
    <input type="radio" checked={selected} onChange={onSelect} style={{ cursor: 'pointer' }} />
    <span style={text.body}>{title}</span>
  </label>
);

export const ShareModal = ({ obj, bucket, endpoint, region, onClose }: ShareModalProps) => {
  const { entityId } = useSubAccount();
  const [duration, setDuration] = useState<DurationPreset>('24h');
  const [customDays, setCustomDays] = useState('1');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!entityId) return;
    let expiresInHours = PRESET_HOURS[duration as Exclude<DurationPreset, 'custom'>];
    if (duration === 'custom') {
      const days = Number(customDays);
      if (!Number.isInteger(days) || days < 1 || days > MAX_CUSTOM_DAYS) {
        setValidationError(`Enter a whole number of days between 1 and ${MAX_CUSTOM_DAYS}.`);
        return;
      }
      expiresInHours = days * 24;
    }
    setValidationError(null);
    setCreating(true);
    try {
      const share = await shareService.createShare(entityId, {
        bucket, key: obj.key, isFolder: obj.isFolder, endpoint, region, expiresInHours,
      });
      setUrl(`${window.location.origin}/share/${share.token}`);
    } catch (err) {
      const isForbidden = hasApiErrorStatus(err, HttpStatusCode.Forbidden);
      const isBadRequest = hasApiErrorStatus(err, HttpStatusCode.BadRequest);
      setError(
        isForbidden
          ? "You don't have access to this resource."
          : isBadRequest
            ? `Duration must be between 1 hour and ${MAX_CUSTOM_DAYS} days.`
            : 'Could not create the share link. Please try again.',
      );
    } finally {
      setCreating(false);
    }
  };

  let body: ReactNode;
  if (error) {
    body = <p style={{ fontSize: 14, color: T.red, margin: 0 }}>{error}</p>;
  } else if (creating) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <Loader type="spinner" size={24} />
      </div>
    );
  } else if (url) {
    body = <ShareLink url={url} isFolder={obj.isFolder} />;
  } else {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={text.label}>Link expires in</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DurationOption title="24 hours" selected={duration === '24h'} onSelect={() => setDuration('24h')} />
          <DurationOption title="7 days" selected={duration === '7d'} onSelect={() => setDuration('7d')} />
          <DurationOption title="30 days" selected={duration === '30d'} onSelect={() => setDuration('30d')} />
          <DurationOption title="Custom" selected={duration === 'custom'} onSelect={() => setDuration('custom')} />
        </div>
        {duration === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM_DAYS}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              style={{
                width: 72, height: 34, padding: '0 10px',
                border: `1px solid ${T.gray20}`, borderRadius: 8,
                fontSize: 14, color: T.gray100,
              }}
            />
            <span style={text.hint}>days (max {MAX_CUSTOM_DAYS})</span>
          </div>
        )}
        {validationError && <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{validationError}</p>}
      </div>
    );
  }

  return (
    <Modal isOpen onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 440 }}>
        <p style={{ ...text.heading, margin: 0 }}>
          Share {obj.isFolder ? 'folder' : 'file'} “{displayName(obj.key)}”
        </p>

        {body}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" type="button" onClick={onClose}>
            Close
          </Button>
          {!url && !error && !creating && (
            <Button type="button" onClick={handleCreate}>
              Create link
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
