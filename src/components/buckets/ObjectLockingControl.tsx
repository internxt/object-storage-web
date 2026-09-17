import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  <label className={`flex items-start gap-2.5 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
    <input
      type="radio"
      checked={selected}
      disabled={disabled}
      onChange={onSelect}
      className={`mt-[3px] ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    />
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-100">{title}</span>
        {badge && (
          <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[13px] leading-normal text-gray-60">{description}</span>
    </div>
  </label>
);

export const ObjectLockingControl = ({
  lockEnabledAtCreation, retentionConfig, disabled = false, isSaving = false, onSave, onDisable,
}: ObjectLockingControlProps) => {
  const { t } = useTranslation('subaccount');
  const [retentionOpen, setRetentionOpen] = useState(retentionConfig.enabled);
  const [mode, setMode] = useState<RetentionMode>(retentionConfig.mode ?? RetentionMode.COMPLIANCE);
  const [scale, setScale] = useState<TimeScale | ''>('');
  const [value, setValue] = useState<string>(String(retentionConfig.days ?? retentionConfig.years ?? ''));

  useEffect(() => {
    setRetentionOpen(retentionConfig.enabled);
    setMode(retentionConfig.mode ?? RetentionMode.COMPLIANCE);
    setScale(retentionConfig.years ? 'years' : retentionConfig.days ? 'days' : '');
    setValue(String(retentionConfig.days ?? retentionConfig.years ?? ''));
  }, [retentionConfig.enabled, retentionConfig.mode, retentionConfig.days, retentionConfig.years]);

  const inputClass =
    'box-border w-full h-10 px-3 rounded-lg border border-gray-20 bg-gray-10 text-sm text-gray-100 outline-none';

  if (!lockEnabledAtCreation) {
    return (
      <div className="flex max-w-[480px] flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.04em] text-gray-60">{t('objectLockingControl.title')}</span>
        <p className="m-0 text-[13px] leading-normal text-gray-60">
          {t('objectLockingControl.notEnabledAtCreationDescription')}
        </p>
      </div>
    );
  }

  const numericValue = Number(value);
  const canSave = !!scale && !!value && numericValue > 0;

  return (
    <div className="flex max-w-[480px] flex-col gap-3.5">
      <span className="text-xs font-medium uppercase tracking-[0.04em] text-gray-60">{t('objectLockingControl.title')}</span>

      <p className="m-0 text-[13px] leading-normal text-gray-60">
        {t('objectLockingControl.description')}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-100">{t('objectLockingControl.enableRetentionLabel')}</span>
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
          <p className="m-0 text-[13px] text-gray-60">
            {t('objectLockingControl.applyNoticeDescription')}
          </p>

          <Option
            title={t('objectLockingControl.governanceModeTitle')}
            badge={retentionConfig.enabled && retentionConfig.mode === RetentionMode.GOVERNANCE ? t('objectLockingControl.enabledBadge') : undefined}
            description={t('objectLockingControl.governanceDescription')}
            selected={mode === RetentionMode.GOVERNANCE}
            disabled={disabled}
            onSelect={() => setMode(RetentionMode.GOVERNANCE)}
          />
          <Option
            title={t('objectLockingControl.complianceModeTitle')}
            badge={retentionConfig.enabled && retentionConfig.mode === RetentionMode.COMPLIANCE ? t('objectLockingControl.enabledBadge') : undefined}
            description={t('objectLockingControl.complianceDescription')}
            selected={mode === RetentionMode.COMPLIANCE}
            disabled={disabled}
            onSelect={() => setMode(RetentionMode.COMPLIANCE)}
          />

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="lock-time-scale" className="text-xs text-gray-60">{t('objectLockingControl.timeScaleLabel')}</label>
              <select
                id="lock-time-scale"
                value={scale}
                disabled={disabled}
                onChange={(e) => setScale(e.target.value as TimeScale)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="" disabled>{t('objectLockingControl.selectTimeScale')}</option>
                <option value="days">{t('objectLockingControl.days')}</option>
                <option value="years">{t('objectLockingControl.years')}</option>
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="lock-retention-time" className="text-xs text-gray-60">{t('objectLockingControl.retentionTimeLabel')}</label>
              <input
                id="lock-retention-time"
                type="number"
                min={1}
                value={value}
                disabled={disabled}
                onChange={(e) => setValue(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={disabled || !canSave}
              loading={isSaving}
              onClick={() => scale && onSave(mode, scale, numericValue)}
            >
              {t('objectLockingControl.update')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
