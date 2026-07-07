import { useEffect, useMemo, useState } from 'react';
import type { S3Client } from '@aws-sdk/client-s3';
import Input from '../../../components/Input';
import { s3Service } from '../../../services/s3.service';
import notificationsService from '../../../services/notifications.service';
import { ALL_BUCKETS, BucketOption } from '../../services/iamPolicy.service';

interface BucketPickerProps {
  client: S3Client | null;
  isOpen: boolean;
  excludedNames: Set<string>;
  onSelect: (bucketName: string) => void;
}

const fetchAllBuckets = async (client: S3Client): Promise<BucketOption[]> => {
  const all: BucketOption[] = [];
  let continuationToken: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const result = await s3Service.listBuckets(client, continuationToken, 1000);
    all.push(...result.buckets.map((b) => ({ name: b.name, region: b.region ?? '' })));
    hasMore = !!result.isTruncated && !!result.continuationToken;
    continuationToken = result.continuationToken;
  }
  return all;
};

export const BucketPicker = ({ client, isOpen, excludedNames, onSelect }: BucketPickerProps) => {
  const [search, setSearch] = useState('');
  const [buckets, setBuckets] = useState<BucketOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !client) return;
    setIsLoading(true);
    fetchAllBuckets(client)
      .then(setBuckets)
      .catch((err) => notificationsService.error({ text: (err as Error).message }))
      .finally(() => setIsLoading(false));
  }, [isOpen, client]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setBuckets([]);
    }
  }, [isOpen]);

  const filteredBuckets = useMemo(
    () => buckets.filter((b) => !excludedNames.has(b.name) && b.name.toLowerCase().includes(search.toLowerCase())),
    [buckets, search, excludedNames],
  );

  if (!isOpen) return null;

  return (
    <div className='border border-gray-20 rounded-lg p-2 flex flex-col gap-2'>
      <Input variant='search' value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder='Search bucket' />
      <div className='max-h-[160px] overflow-y-auto'>
        {!excludedNames.has(ALL_BUCKETS) && (
          <button
            type='button'
            onClick={() => onSelect(ALL_BUCKETS)}
            className='flex items-center justify-between gap-2 w-full px-2 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-gray-10 rounded'
          >
            <span className='text-sm font-medium text-gray-80'>All buckets</span>
          </button>
        )}
        {isLoading ? (
          <p className='text-xs text-gray-60 px-2 py-2 m-0'>Loading buckets...</p>
        ) : filteredBuckets.length === 0 ? (
          <p className='text-xs text-gray-60 px-2 py-2 m-0'>No buckets found</p>
        ) : (
          filteredBuckets.map((b) => (
            <button
              key={b.name}
              type='button'
              onClick={() => onSelect(b.name)}
              className='flex items-center justify-between gap-2 w-full px-2 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-gray-10 rounded'
            >
              <span className='text-sm text-gray-80'>{b.name}</span>
              <span className='text-xs text-gray-60'>{b.region}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
