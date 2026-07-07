import { Switch } from '../Switch';

interface BucketLoggingSetupProps {
  enabled: boolean;
  prefix: string;
  target: string;
  buckets: string[];
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onPrefixChange: (prefix: string) => void;
  onTargetChange: (target: string) => void;
}

const inputClassName =
  'box-border h-10 w-full rounded-lg border border-[var(--gray-20,#E5E5EB)] bg-[var(--gray-10,#F4F4F7)] px-3 text-sm text-[var(--gray-100,#18181B)] outline-none';

export const BucketLoggingSetup = ({
  enabled, prefix, target, buckets, disabled = false,
  onEnabledChange, onPrefixChange, onTargetChange,
}: BucketLoggingSetupProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--gray-100,#18181B)]">Bucket Logging</span>
      <Switch checked={enabled} disabled={disabled} onChange={onEnabledChange} />
    </div>
    <p className="m-0 text-[13px] leading-normal text-[var(--gray-60,#636367)]">
      When logging is enabled a text log file of all access to a bucket is created in the bucket specified.
    </p>
    {enabled && (
      <>
        <input
          type="text"
          placeholder="Logging Prefix"
          value={prefix}
          disabled={disabled}
          onChange={(e) => onPrefixChange(e.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
        <select
          value={target}
          disabled={disabled}
          onChange={(e) => onTargetChange(e.target.value)}
          className={`${inputClassName} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <option value="">Bucket to store logs</option>
          {buckets.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </>
    )}
  </div>
);
