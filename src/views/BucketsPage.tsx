import { Separator } from '../components/Separator';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  BucketsTable,
  HeaderItemsTableProps,
} from '../components/buckets/Table';
import { useEffect, useMemo, useState } from 'react';
// import Dialog from '../components/Dialog';
import { Bucket, bucketsService } from '../services/buckets.service';
import notificationsService from '../services/notifications.service';
import { usePaginatedUsageData } from '../hooks/usePaginatedUserData';
import { CreateBucketModal } from '../components/buckets/CreateBucketModal';
import { BucketUsageModal } from '../components/buckets/BucketUsageModal';
import { isValidBucketName } from '../utils/isBucketNameValid';
import Button from '../components/Button';
import { Pagination } from '../components/ui/Pagination';
import Input from '../components/Input';

dayjs.extend(utc);
dayjs.extend(timezone);

export const FORMATTED_DATE_WITH_TIMEZONE = 'DD-MMM-YYYY hh:mm A [(UTC]Z[)]';

const HEADER_ITEMS: HeaderItemsTableProps[] = [
  {
    title: 'Bucket',
    sortKey: 'bucket',
    defaultDirection: 'ASC',
  },
  {
    title: 'Region',
    sortKey: 'region',
    defaultDirection: 'ASC',
  },
  {
    title: 'Creation Time',
    sortKey: 'createdAt',
    defaultDirection: 'ASC',
  },
];

export const BucketsPage = () => {
  // const [isDeleteBucketDialogOpened, setIsDeleteBucketDialogOpened] =
  //   useState(false);
  const [isCreateBucketOpened, setIsCreateBucketOpened] = useState(false);
  const [isBucketUsageModalOpened, setIsBucketUsageModalOpened] =
    useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  // const [isDeletingBucket, setIsDeletingBucket] = useState(false);
  // const [bucketToDelete, setBucketToDelete] = useState<Bucket>();
  const [selectedBucketForUsage, setSelectedBucketForUsage] =
    useState<Bucket>();
  const [isLoading, setIsLoading] = useState(false);

  const filteredBuckets = useMemo(
    () =>
      buckets.filter((bucket) =>
        bucket.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [buckets, searchQuery]
  );

  const { paginatedData, currentPage, setCurrentPage, totalItems } =
    usePaginatedUsageData(filteredBuckets, 20);

  useEffect(() => {
    getBuckets();
  }, []);

  const getBuckets = async () => {
    try {
      setIsLoading(true);
      const userBuckets = await bucketsService.getBuckets();
      setBuckets(userBuckets);
    } catch (err) {
      const error = err as Error;

      notificationsService.error({
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateBucket = async (
    bucketName: Bucket['name'],
    bucketRegion: Bucket['region']
  ) => {
    if (!isValidBucketName(bucketName)) return;

    setIsCreatingBucket(true);

    try {
      await bucketsService.createBucket(bucketName, bucketRegion);
      await getBuckets();
      onCloseCreateBucketModal();
    } catch (err) {
      const error = err as Error;

      notificationsService.error({
        text: error.message,
      });
    } finally {
      setIsCreatingBucket(false);
    }
  };

  // const onDeleteBucket = async () => {
  //   if (!bucketToDelete) return;

  //   setIsDeletingBucket(true);
  //   try {
  //     await bucketsService.deleteBucket(
  //       bucketToDelete.name,
  //       bucketToDelete.region
  //     );
  //     await getBuckets();
  //     onCloseDeleteBucketModal();
  //   } catch (err) {
  //     const error = err as Error;

  //     notificationsService.error({
  //       text: error.message,
  //     });
  //   } finally {
  //     setIsDeletingBucket(false);
  //   }
  // };

  const onCreateBucketButtonClicked = () => {
    setIsCreateBucketOpened(true);
  };

  // const onOpenDeleteBucketModal = (bucket: Bucket) => {
  //   setIsDeleteBucketDialogOpened(true);
  //   setBucketToDelete(bucket);
  // };

  const onOpenBucketUsageModal = (bucket: Bucket) => {
    setSelectedBucketForUsage(bucket);
    setIsBucketUsageModalOpened(true);
  };

  const onCloseCreateBucketModal = () => {
    setIsCreateBucketOpened(false);
  };

  // const onCloseDeleteBucketModal = () => {
  //   setIsDeleteBucketDialogOpened(false);
  // };

  const onCloseBucketUsageModal = () => {
    setIsBucketUsageModalOpened(false);
    setSelectedBucketForUsage(undefined);
  };

  return (
    <section className='flex flex-col items-center p-7 w-full'>
      <div className='flex flex-col p-8 w-full bg-white gap-5 rounded-md'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='font-semibold text-lg'>Buckets</p>
          <Button
            className='rounded-md hidden'
            onClick={onCreateBucketButtonClicked}
            disabled
          >
            Create Bucket
          </Button>
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
              // onDeleteBucketsClicked={onOpenDeleteBucketModal}
              onViewUsageClicked={onOpenBucketUsageModal}
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

      {/* <Dialog
        isOpen={isDeleteBucketDialogOpened}
        onClose={onCloseDeleteBucketModal}
        onPrimaryAction={onDeleteBucket}
        onSecondaryAction={onCloseDeleteBucketModal}
        isLoading={isDeletingBucket}
        primaryAction='Delete'
        secondaryAction='Cancel'
        primaryActionColor='danger'
        title='Delete bucket'
        subtitle='By deleting this bucket, all associated usage data will also be permanently removed.'
      /> */}

      <CreateBucketModal
        isCreateBucketOpened={isCreateBucketOpened}
        isLoading={isCreatingBucket}
        onClose={onCloseCreateBucketModal}
        onCreateBucket={onCreateBucket}
      />

      {selectedBucketForUsage?.bucketNumber && (
        <BucketUsageModal
          isOpen={isBucketUsageModalOpened}
          onClose={onCloseBucketUsageModal}
          bucketNumber={selectedBucketForUsage.bucketNumber}
          bucketName={selectedBucketForUsage.name}
          bucketRegion={selectedBucketForUsage.region}
        />
      )}
    </section>
  );
};
