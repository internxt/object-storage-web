import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Separator } from '../../components/Separator';
import { BucketsTable, HeaderItemsTableProps } from '../../components/buckets/Table';
import { S3Bucket, s3Service } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { usePaginatedUsageData } from '../../hooks/usePaginatedUserData';
import { CreateBucketModal } from '../../components/buckets/CreateBucketModal';
import { BucketSettingsModal } from '../../components/buckets/BucketSettingsModal';
import { isValidBucketName } from '../../utils/isBucketNameValid';
import Button from '../../components/Button';
import { Pagination } from '../../components/ui/Pagination';
import Input from '../../components/Input';
import { useSubAccountS3Client } from '../hooks/useSubAccountS3Client';
import { S3Client } from '@aws-sdk/client-s3';
import { useSubAccount } from '../context/SubAccountContext';
import { bucketsService, Region } from '../../services/buckets.service';

dayjs.extend(utc);
dayjs.extend(timezone);

const HEADER_ITEMS: HeaderItemsTableProps[] = [
  { title: 'Bucket', sortKey: 'bucket', defaultDirection: 'ASC' },
  { title: 'Region', sortKey: 'region', defaultDirection: 'ASC' },
  { title: 'Creation Time', sortKey: 'createdAt', defaultDirection: 'ASC' },
];

export const SubAccountBucketsPage = () => {
  const navigate = useNavigate();
  const { entityId, memberId, isAdmin } = useSubAccount();
  const { client, credentials } = useSubAccountS3Client(entityId, memberId);
  const [isCreateBucketOpened, setIsCreateBucketOpened] = useState(false);
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [selectedBucketForSettings, setSelectedBucketForSettings] = useState<S3Bucket>();
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    bucketsService.getRegions().then(setRegions).catch(() => {});
  }, []);

  const filteredBuckets = useMemo(
    () => buckets.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [buckets, searchQuery],
  );

  const { paginatedData, currentPage, setCurrentPage, totalItems } = usePaginatedUsageData(filteredBuckets, 20);

  useEffect(() => {
    if (client) getBuckets();
  }, [client]);

  const getBuckets = async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      const list = await s3Service.listBuckets(client);
      const withRegion = await Promise.all(
        list.map(async (b) => ({
          ...b,
          region: await s3Service.getBucketLocation(client, b.name).catch(() => undefined),
        })),
      );
      setBuckets(withRegion);
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateBucket = async (bucketName: string, bucketRegion: string, endpoint: string) => {
    if (import.meta.env.DEV) console.log('[create-bucket] onCreateBucket called', { bucketName, bucketRegion, endpoint, hasCredentials: !!credentials, nameValid: isValidBucketName(bucketName) });
    if (!credentials || !isValidBucketName(bucketName)) return;
    setIsCreatingBucket(true);
    const regionClient = new S3Client({
      endpoint: `https://${endpoint}`,
      region: bucketRegion,
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
    try {
      if (import.meta.env.DEV) console.log('[create-bucket] calling s3Service.createBucket', { bucketName, bucketRegion, endpoint });
      await s3Service.createBucket(regionClient, bucketName, bucketRegion);
      if (import.meta.env.DEV) console.log('[create-bucket] bucket created successfully');
      await getBuckets();
      setIsCreateBucketOpened(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[create-bucket] s3Service.createBucket failed', err);
      notificationsService.error({ text: (err as Error).message });
    } finally {
      regionClient.destroy();
      setIsCreatingBucket(false);
    }
  };

  const onBucketDeleted = async () => {
    setSelectedBucketForSettings(undefined);
    await getBuckets();
  };

  return (
    <section className='flex flex-col items-center p-7 w-full'>
      <div className='flex flex-col p-8 w-full bg-white gap-5 rounded-md'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='font-semibold text-lg'>Buckets</p>
          {isAdmin && (
            <Button className='rounded-md' onClick={() => setIsCreateBucketOpened(true)}>
              Create Bucket
            </Button>
          )}
        </div>
        <div className='flex flex-row w-full justify-between items-center'>
          <Input
            placeholder='Search'
            variant='search'
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>
        <Separator />
        <div className='flex flex-col w-full'>
          <div className='overflow-x-auto'>
            <BucketsTable
              headers={HEADER_ITEMS}
              buckets={paginatedData}
              onBucketClick={(b) => {
                const endpoint = regions.find((r) => r.slug === b.region)?.endpoint;
                const query = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}&region=${b.region}` : '';
                navigate(`/subaccount/buckets/${b.name}${query}`);
              }}
              onSettingsClicked={(b) => isAdmin && setSelectedBucketForSettings(b)}
              isLoading={isLoading}
            />
          </div>
          <div className='flex flex-row items-center justify-end w-full mt-4'>
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={20}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {isAdmin && (
        <CreateBucketModal
          isCreateBucketOpened={isCreateBucketOpened}
          isLoading={isCreatingBucket}
          onClose={() => setIsCreateBucketOpened(false)}
          onCreateBucket={onCreateBucket}
        />
      )}

      {selectedBucketForSettings && (
        <BucketSettingsModal
          isOpen={!!selectedBucketForSettings}
          bucket={selectedBucketForSettings}
          onClose={() => setSelectedBucketForSettings(undefined)}
          onDeleted={onBucketDeleted}
        />
      )}
    </section>
  );
};
