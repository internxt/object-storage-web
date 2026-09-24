import { useTranslation } from 'react-i18next';
import { T } from '../../sub-account/tokens';
import { VersioningStatus } from '../../services/s3.service';

interface VersioningControlProps {
  status: VersioningStatus;
  loading?: boolean;
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

export const VersioningControl = ({ status, loading = false, disabled = false, onChange }: VersioningControlProps) => {
  const { t } = useTranslation('subaccount');
  const enabled = status === 'Enabled';
  const unversioned = status === 'Unversioned';
  return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
    <span style={{
      fontSize: 12, fontWeight: 500, color: T.gray60,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>{t('versioningControl.title')}</span>
    {loading && (
      <span className="text-sm text-gray-50">{t('versioningControl.loading')}</span>
    )}
    <Option
      title={unversioned ? t('versioningControl.unversioned') : t('versioningControl.suspended')}
      description={unversioned
        ? t('versioningControl.unversionedDescription')
        : t('versioningControl.suspendedDescription')}
      selected={!enabled}
      disabled={disabled || loading}
      onSelect={() => onChange(false)}
    />
    <Option
      title={t('versioningControl.enabled')}
      description={t('versioningControl.enabledDescription')}
      selected={enabled}
      disabled={disabled || loading}
      onSelect={() => onChange(true)}
    />
  </div>
  );
};
