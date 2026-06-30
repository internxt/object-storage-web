import { useEffect, useState } from 'react';
import { T } from '../../sub-account/tokens';
import { Switch } from '../Switch';
import Button from '../Button';
import { RetentionMode } from '../../services/s3.service';

type TimeScale = 'days' | 'years';

interface ObjectLockRetentionConfig {
  enabled: boolean;
  mode?: RetentionMode;
  days?: number;
  years?: number;
}

interface ObjectLockingControlProps {
  lockEnabledAtCreation: boolean;
  retentionConfig: ObjectLockRetentionConfig;
  disabled?: boolean;
  isSaving?: boolean;
  onSave: (mode: RetentionMode, scale: TimeScale, value: number) => void;
  onDisable: () => void;
}

const Option = ({ title, description, badge, selected, disabled, onSelect }: {
  title: string; description: string; badge?: string; selected: boolean; disabled?: boolean; onSelect: () => void;
}) => (
  <label style={{
    display: 'flex', alignItems: 'flex-start', gap: 10,
    cursor: disabled ? 'default' : 'pointer',
  }}>
    <input
      type="radio"
      checked={selected}
      disabled={disabled}
      onChange={onSelect}
      style={{ marginTop: 3, cursor: disabled ? 'default' : 'pointer' }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: T.gray100 }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#15803d', background: '#dcfce7',
            padding: '2px 8px', borderRadius: 999,
          }}>{badge}</span>
        )}
      </span>
      <span style={{ fontSize: 13, color: T.gray60, lineHeight: 1.5 }}>{description}</span>
    </div>
  </label>
);

export const ObjectLockingControl = ({
  lockEnabledAtCreation, retentionConfig, disabled = false, isSaving = false, onSave, onDisable,
}: ObjectLockingControlProps) => {
  const [retentionOpen, setRetentionOpen] = useState(retentionConfig.enabled);
  const [mode, setMode] = useState<RetentionMode>(retentionConfig.mode ?? RetentionMode.COMPLIANCE);
  const [scale, setScale] = useState<TimeScale>(retentionConfig.years ? 'years' : 'days');
  const [value, setValue] = useState<string>(String(retentionConfig.days ?? retentionConfig.years ?? ''));

  useEffect(() => {
    setRetentionOpen(retentionConfig.enabled);
    setMode(retentionConfig.mode ?? RetentionMode.COMPLIANCE);
    setScale(retentionConfig.years ? 'years' : 'days');
    setValue(String(retentionConfig.days ?? retentionConfig.years ?? ''));
  }, [retentionConfig.enabled, retentionConfig.mode, retentionConfig.days, retentionConfig.years]);

  const inputStyle: React.CSSProperties = {
    height: 40, padding: '0 12px',
    border: `1px solid ${T.gray20}`, borderRadius: 8,
    fontSize: 14, color: T.gray100, outline: 'none', background: T.gray10,
    width: '100%', boxSizing: 'border-box',
  };

  if (!lockEnabledAtCreation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <span style={{
          fontSize: 12, fontWeight: 500, color: T.gray60,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>Object Locking</span>
        <p style={{ fontSize: 13, color: T.gray60, lineHeight: 1.5, margin: 0 }}>
          Object Lock must be enabled at the time a bucket is created. Buckets using Object Lock must also have
          Versioning enabled.
        </p>
      </div>
    );
  }

  const numericValue = Number(value);
  const canSave = !!value && numericValue > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
      <span style={{
        fontSize: 12, fontWeight: 500, color: T.gray60,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>Object Locking</span>

      <p style={{ fontSize: 13, color: T.gray60, lineHeight: 1.5, margin: 0 }}>
        Objects placed in this bucket are subject to retention modes set at the bucket or object level.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: T.gray100 }}>Enable Bucket-Level Object Retention</span>
        <Switch
          checked={retentionOpen}
          disabled={disabled}
          onChange={(next) => {
            setRetentionOpen(next);
            if (!next && retentionConfig.enabled) onDisable();
          }}
        />
      </div>

      {retentionOpen && (
        <>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            These settings will automatically apply to all new objects placed into the bucket after you confirm the
            settings.
          </p>

          <Option
            title="Enable Governance Mode"
            badge={retentionConfig.enabled && retentionConfig.mode === RetentionMode.GOVERNANCE ? 'Enabled' : undefined}
            description="Objects placed in Governance Mode remain immutable until after they have reached the retain until date, unless a user has specific IAM permissions to alter the settings."
            selected={mode === RetentionMode.GOVERNANCE}
            disabled={disabled}
            onSelect={() => setMode(RetentionMode.GOVERNANCE)}
          />
          <Option
            title="Compliance Mode"
            badge={retentionConfig.enabled && retentionConfig.mode === RetentionMode.COMPLIANCE ? 'Enabled' : undefined}
            description="Objects placed in Compliance Mode remain immutable until after they have reached the retain until date. This cannot be reversed for any reason, by any user, regardless of user permissions."
            selected={mode === RetentionMode.COMPLIANCE}
            disabled={disabled}
            onSelect={() => setMode(RetentionMode.COMPLIANCE)}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label htmlFor="lock-time-scale" style={{ fontSize: 12, color: T.gray60 }}>Time Scale*</label>
              <select
                id="lock-time-scale"
                value={scale}
                disabled={disabled}
                onChange={(e) => setScale(e.target.value as TimeScale)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="days">Day(s)</option>
                <option value="years">Year(s)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label htmlFor="lock-retention-time" style={{ fontSize: 12, color: T.gray60 }}>Retention Time*</label>
              <input
                id="lock-retention-time"
                type="number"
                min={1}
                value={value}
                disabled={disabled}
                onChange={(e) => setValue(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              disabled={disabled || !canSave}
              loading={isSaving}
              onClick={() => onSave(mode, scale, numericValue)}
            >
              Update
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
