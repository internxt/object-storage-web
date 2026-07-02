import { useMemo, useState } from 'react';
import type { S3Client } from '@aws-sdk/client-s3';
import { XIcon, PlusIcon } from '@phosphor-icons/react';
import { BucketPicker } from './BucketPicker';
import { ALL_BUCKETS, BucketRule, AccessLevel, ACCESS_LEVEL_LABELS, ACCESS_LEVELS } from '../../services/iamPolicy.service';

interface BucketRulesBuilderProps {
  client: S3Client | null;
  rules: BucketRule[];
  onChange: (rules: BucketRule[]) => void;
}

const AccessLevelSelector = ({ value, onChange }: { value: AccessLevel; onChange: (accessLevel: AccessLevel) => void }) => (
  <div className='flex gap-2'>
    {ACCESS_LEVELS.map((p) => (
      <button
        key={p}
        type='button'
        onClick={() => onChange(p)}
        className={`px-3 py-1 rounded-full text-xs font-medium border-none cursor-pointer ${
          value === p ? 'bg-gray-100 text-white' : 'bg-gray-10 text-gray-60'
        }`}
      >
        {ACCESS_LEVEL_LABELS[p]}
      </button>
    ))}
  </div>
);

export const BucketRulesBuilder = ({ client, rules, onChange }: BucketRulesBuilderProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const usedBucketNames = useMemo(() => new Set(rules.map((r) => r.bucketName)), [rules]);

  const addBucket = (bucketName: string) => {
    onChange([...rules, { bucketName, accessLevel: 'read' }]);
    setIsPickerOpen(false);
  };

  const setAccessLevel = (index: number, accessLevel: AccessLevel) =>
    onChange(rules.map((r, i) => (i === index ? { ...r, accessLevel } : r)));

  const removeBucket = (index: number) => onChange(rules.filter((_, i) => i !== index));

  return (
    <div className='flex flex-col gap-2 min-h-0 overflow-y-auto'>
      <button
        type='button'
        onClick={() => setIsPickerOpen((v) => !v)}
        className='self-start flex items-center gap-1 text-sm font-medium text-primary bg-transparent border-none cursor-pointer py-1'
      >
        <PlusIcon size={14} weight='bold' />
        Add bucket
      </button>

      <BucketPicker client={client} isOpen={isPickerOpen} excludedNames={usedBucketNames} onSelect={addBucket} />

      {rules.length === 0 ? (
        <p className='text-xs text-gray-60 m-0'>No buckets assigned yet. Add a bucket (or all buckets) to grant access.</p>
      ) : (
        rules.map((rule, index) => (
          <div key={rule.bucketName} className='border border-gray-20 rounded-lg p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-100'>
                {rule.bucketName === ALL_BUCKETS ? 'All buckets' : rule.bucketName}
              </span>
              <button
                type='button'
                onClick={() => removeBucket(index)}
                className='bg-transparent border-none cursor-pointer text-gray-60 hover:text-gray-80 flex items-center'
              >
                <XIcon size={16} />
              </button>
            </div>
            <AccessLevelSelector value={rule.accessLevel} onChange={(p) => setAccessLevel(index, p)} />
          </div>
        ))
      )}
    </div>
  );
};
