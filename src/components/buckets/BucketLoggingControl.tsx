import { T } from '../../sub-account/tokens';
import { Switch } from '../Switch';
import Button from '../Button';

interface BucketLoggingControlProps {
  enabled: boolean;
  targetBucket: string;
  targetPrefix: string;
  buckets: string[];
  disabled?: boolean;
  isSaving?: boolean;
  onToggle: (enabled: boolean) => void;
  onTargetBucketChange: (bucket: string) => void;
  onTargetPrefixChange: (prefix: string) => void;
  onSave: () => void;
}

const inputStyle: React.CSSProperties = {
  boxSizing: 'border-box', width: '100%', height: 40, padding: '0 12px',
  borderRadius: 8, border: `1px solid ${T.gray20}`, background: T.gray10,
  fontSize: 14, color: T.gray100, outline: 'none',
};

export const BucketLoggingControl = ({
  enabled, targetBucket, targetPrefix, buckets, disabled = false, isSaving = false,
  onToggle, onTargetBucketChange, onTargetPrefixChange, onSave,
}: BucketLoggingControlProps) => {
  const canSave = !enabled || !!targetBucket;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
      <span style={{
        fontSize: 12, fontWeight: 500, color: T.gray60,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>Logging</span>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: T.gray60 }}>
        When logging is enabled a text log file of all access to a bucket is created in the bucket specified.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: T.gray100 }}>Enable Bucket Logging</span>
        <Switch checked={enabled} disabled={disabled} onChange={onToggle} />
      </div>

      {enabled && (
        <>
          <input
            type="text"
            placeholder="Logging Prefix"
            value={targetPrefix}
            disabled={disabled}
            onChange={(e) => onTargetPrefixChange(e.target.value)}
            style={inputStyle}
          />
          <select
            value={targetBucket}
            disabled={disabled}
            onChange={(e) => onTargetBucketChange(e.target.value)}
            style={{ ...inputStyle, cursor: disabled ? 'default' : 'pointer' }}
          >
            <option value="">Bucket to store logs</option>
            {buckets.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="button" disabled={disabled || !canSave} loading={isSaving} onClick={onSave}>
          Update
        </Button>
      </div>
    </div>
  );
};
