import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@phosphor-icons/react';
import { S3Bucket, s3Service } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { bucketsService, SubAccountRegion } from '../../services/buckets.service';
import { isValidBucketName } from '../../utils/isBucketNameValid';
import Button from '../../components/Button';
import { Pagination } from '../../components/ui/Pagination';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { useSubAccountS3Client } from '../hooks/useSubAccountS3Client';
import { S3Client } from '@aws-sdk/client-s3';
import { useSubAccount } from '../context/SubAccountContext';
import { usePaginatedUsageData } from '../../hooks/usePaginatedUserData';
import { LoadingRowSkeleton } from '../../components/LoadingSkeleton';

export const SubAccountBucketsPage = () => {
  const navigate = useNavigate();
  const { entityId, memberId, isAdmin } = useSubAccount();
  const { client, credentials } = useSubAccountS3Client(entityId, memberId);
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<SubAccountRegion[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bucketName, setBucketName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<SubAccountRegion | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    bucketsService.getSubAccountRegions().then((r) => {
      setRegions(r);
      if (r.length > 0) setSelectedRegion(r[0]);
    }).catch(() => {});
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

  const onCreateBucket = async () => {
    if (!credentials || !selectedRegion || !isValidBucketName(bucketName)) return;
    setIsCreating(true);
    const regionClient = new S3Client({
      endpoint: `https://${selectedRegion.endpoint}`,
      region: selectedRegion.slug,
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
    try {
      await s3Service.createBucket(regionClient, bucketName, selectedRegion.slug);
      await getBuckets();
      setIsCreateOpen(false);
      setBucketName('');
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      regionClient.destroy();
      setIsCreating(false);
    }
  };

  const HEADERS = ['Bucket', 'Region', 'Creation Time'];

  return (
    <section className='flex flex-col items-center p-7 w-full'>
      <div className='flex flex-col p-8 w-full bg-white gap-5 rounded-md'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='font-semibold text-lg'>Buckets</p>
          {isAdmin && (
            <Button className='rounded-md' onClick={() => setIsCreateOpen(true)}>
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

        <div className='overflow-x-auto'>
          {isLoading ? (
            <table className='w-full'>
              <thead>
                <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
                  {HEADERS.map((h) => <th key={h} className='w-[33%] px-5 text-left'>{h}</th>)}
                </tr>
              </thead>
              <tbody><LoadingRowSkeleton numberOfColumns={3} numberOfRows={5} /></tbody>
            </table>
          ) : (
            <table className='w-full'>
              <thead className='sticky top-0 z-10'>
                <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
                  {HEADERS.map((h) => <th key={h} className='w-[33%] px-5 text-left'>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={3} className='text-center py-8 text-gray-400 text-sm'>No buckets found</td></tr>
                ) : (
                  paginatedData.map((bucket) => {
                    const region = regions.find((r) => r.slug === bucket.region);
                    const query = region ? `?endpoint=${encodeURIComponent(region.endpoint)}&region=${region.slug}` : '';
                    return (
                      <tr
                        key={bucket.name}
                        className='w-full h-12 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer border-b border-gray-100'
                        onClick={() => navigate(`/subaccount/buckets/${bucket.name}${query}`)}
                      >
                        <td className='w-[33%] px-5'>
                          <div className='flex items-center gap-2'>
                            <Database size={18} className='text-blue-600' />
                            <span className='font-medium text-blue-700'>{bucket.name}</span>
                          </div>
                        </td>
                        <td className='w-[33%] px-5'>{region?.name ?? bucket.region ?? '—'}</td>
                        <td className='w-[33%] px-5 text-gray-400'>
                          {bucket.creationDate ? new Date(bucket.creationDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className='flex flex-row items-center justify-end w-full'>
          <Pagination currentPage={currentPage} totalItems={totalItems} pageSize={20} onPageChange={setCurrentPage} />
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => !isCreating && setIsCreateOpen(false)}>
        <div className='flex flex-col gap-5 w-full min-w-[400px]'>
          <p className='text-black text-xl font-semibold'>Create Bucket</p>
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-700'>Bucket Name</label>
            <input
              type='text'
              placeholder='my-bucket'
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCreateBucket()}
              className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400'
              autoFocus
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-700'>Region</label>
            <select
              value={selectedRegion?.slug ?? ''}
              onChange={(e) => setSelectedRegion(regions.find((r) => r.slug === e.target.value) ?? null)}
              className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400'
            >
              {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </select>
          </div>
          <div className='flex gap-3 justify-end'>
            <Button variant='secondary' className='rounded-md' onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              className='rounded-md'
              disabled={!isValidBucketName(bucketName) || !selectedRegion || isCreating}
              loading={isCreating}
              onClick={onCreateBucket}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
