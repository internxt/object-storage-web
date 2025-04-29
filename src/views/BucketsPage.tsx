import { Separator } from '../components/Separator';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  BucketsTable,
  HeaderItemsTableProps,
} from '../components/buckets/Table';
import { useEffect, useState } from 'react';
import Dialog from '../components/Dialog';
import { Bucket, bucketsService } from '../services/buckets.service';
import notificationsService from '../services/notifications.service';
import { usePaginatedUsageData } from '../hooks/usePaginatedUserData';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { CreateBucketModal } from '../components/buckets/CreateBucketModal';
import { isValidBucketName } from '../utils/isBucketNameValid';
import Button from '../components/Button';

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
  const [isDeleteBucketDialogOpened, setIsDeleteBucketDialogOpened] =
    useState(false);
  const [isCreateBucketOpened, setIsCreateBucketOpened] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [isDeletingBucket, setIsDeletingBucket] = useState(false);
  const [bucketToDelete, setBucketToDelete] = useState<Bucket>();
  const [isLoading, setIsLoading] = useState(false);
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageInfo,
    totalItems,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedUsageData(buckets, 20);

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

  const onDeleteBucket = async () => {
    if (!bucketToDelete) return;

    setIsDeletingBucket(true);
    try {
      await bucketsService.deleteBucket(
        bucketToDelete.name,
        bucketToDelete.region
      );
      await getBuckets();
      onCloseDeleteBucketModal();
    } catch (err) {
      const error = err as Error;

      notificationsService.error({
        text: error.message,
      });
    } finally {
      setIsDeletingBucket(false);
    }
  };

  const onCreateBucketButtonClicked = () => {
    setIsCreateBucketOpened(true);
  };

  const onOpenDeleteBucketModal = (bucketName: Bucket) => {
    setIsDeleteBucketDialogOpened(true);
    setBucketToDelete(bucketName);
  };

  const onCloseCreateBucketModal = () => {
    setIsCreateBucketOpened(false);
  };

  const onCloseDeleteBucketModal = () => {
    setIsDeleteBucketDialogOpened(false);
  };

  return (
    <section className='flex flex-col items-center p-7 w-full'>
      <div className='flex flex-col p-8 w-full bg-white gap-5 rounded-md'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='font-semibold text-lg'>Buckets</p>
          <Button className='rounded-md' onClick={onCreateBucketButtonClicked}>
            Create Bucket
          </Button>
        </div>
        <Separator />
        <div className='flex flex-col w-full'>
          <BucketsTable
            headers={HEADER_ITEMS}
            buckets={paginatedData}
            onDeleteBucketsClicked={onOpenDeleteBucketModal}
            isLoading={isLoading}
          />
          <div className='flex flex-row items-end justify-end w-full'>
            <div className='items-center flex flex-row gap-3'>
              <p>
                {pageInfo.from}-{pageInfo.to} of {totalItems}
              </p>
              <div className='flex flex-row gap-3 items-center'>
                <button
                  disabled={!hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <CaretLeft
                    size={20}
                    className={`${
                      !hasPrevPage
                        ? 'text-gray-30 cursor-no-drop'
                        : 'text-black'
                    }`}
                  />
                </button>
                <button
                  disabled={!hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <CaretRight
                    size={20}
                    className={`${
                      !hasNextPage
                        ? 'text-gray-30 cursor-no-drop'
                        : 'text-black'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
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
      />

      <CreateBucketModal
        isCreateBucketOpened={isCreateBucketOpened}
        isLoading={isCreatingBucket}
        onClose={onCloseCreateBucketModal}
        onCreateBucket={onCreateBucket}
      />
    </section>
  );
};
