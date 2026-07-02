import { useEffect, useMemo, useState } from 'react';
import type { S3Client } from '@aws-sdk/client-s3';
import Input from '../../../components/Input';
import { s3Service } from '../../../services/s3.service';
import notificationsService from '../../../services/notifications.service';
import { ALL_BUCKETS, BucketOption } from '../../services/iamPolicy.service';

const BUCKETS_PAGE_SIZE = 50;

interface BucketPickerProps {
  client: S3Client | null;
  isOpen: boolean;
  excludedNames: Set<string>;
  onSelect: (bucketName: string) => void;
}

export const BucketPicker = ({ client, isOpen, excludedNames, onSelect }: BucketPickerProps) => {
  const [search, setSearch] = useState('');
  const [buckets, setBuckets] = useState<BucketOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const loadPage = async (token?: string) => {
    if (!client) return;
    try {
      const { buckets: listed, continuationToken: nextToken, isTruncated } = await s3Service.listBuckets(
        client, token, BUCKETS_PAGE_SIZE,
      );
      const enriched = await Promise.all(
        listed.map(async (b) => ({
          name: b.name,
          region: await s3Service.getBucketLocation(client, b.name).catch(() => ''),
        })),
      );
      setBuckets((prev) => (token ? [...prev, ...enriched] : enriched));
      setContinuationToken(nextToken);
      setHasMore(isTruncated);
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    }
  };

  useEffect(() => {
    if (!isOpen || !client) return;
    setIsLoading(true);
    loadPage().finally(() => setIsLoading(false));
  }, [isOpen, client]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setBuckets([]);
      setContinuationToken(undefined);
      setHasMore(false);
    }
  }, [isOpen]);

  const filteredBuckets = useMemo(
    () => buckets.filter((b) => !excludedNames.has(b.name) && b.name.toLowerCase().includes(search.toLowerCase())),
    [buckets, search, excludedNames],
  );

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadPage(continuationToken);
    setIsLoadingMore(false);
  };

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
      {hasMore && (
        <button
          type='button'
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className='self-start bg-transparent border-none py-1 text-sm font-medium text-primary cursor-pointer'
        >
          {isLoadingMore ? 'Loading...' : 'Load more buckets'}
        </button>
      )}
    </div>
  );
};
