import { T } from '../../sub-account/tokens';

interface VersioningControlProps {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}

const Option = ({ title, description, selected, disabled, onSelect }: {
  title: string; description: string; selected: boolean; disabled?: boolean; onSelect: () => void;
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
      <span style={{ fontSize: 14, fontWeight: 500, color: T.gray100 }}>{title}</span>
      <span style={{ fontSize: 13, color: T.gray60, lineHeight: 1.5 }}>{description}</span>
    </div>
  </label>
);

export const VersioningControl = ({ enabled, disabled = false, onChange }: VersioningControlProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
    <span style={{
      fontSize: 12, fontWeight: 500, color: T.gray60,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>Versioning</span>
    <Option
      title="Suspend Versioning"
      description="Suspending versioning will suspend the creation of object versions for all operations but keeps any existing object versions."
      selected={!enabled}
      disabled={disabled}
      onSelect={() => onChange(false)}
    />
    <Option
      title="Enabled"
      description="Versioning is a means of keeping multiple variants of an object in the same bucket. You can use versioning to preserve, retrieve, and restore every version of every object stored in your bucket. With versioning, you can easily recover from both unintended user actions and application failures."
      selected={enabled}
      disabled={disabled}
      onSelect={() => onChange(true)}
    />
  </div>
);
