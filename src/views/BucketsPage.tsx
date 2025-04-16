import { Separator } from '../components/Separator'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {
  BucketsTable,
  HeaderItemsTableProps,
} from '../components/buckets/Table'
import { useEffect, useState } from 'react'
import Dialog from '../components/Dialog'
import Modal from '../components/Modal'
import { Bucket, bucketsService } from '../services/buckets.service'
import notificationsService from '../services/notifications.service'
import { usePaginatedUsageData } from '../hooks/usePaginatedUserData'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

dayjs.extend(utc)
dayjs.extend(timezone)

export const FORMATTED_DATE_WITH_TIMEZONE = 'DD-MMM-YYYY hh:mm A [(UTC]Z[)]'

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
]

export const BucketsPage = () => {
  const [isDeleteBucketDialogOpened, setIsDeleteBucketDialogOpened] =
    useState(false)
  const [isCreateBucketOpened, setIsCreateBucketOpened] = useState(false)
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageInfo,
    totalItems,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedUsageData(buckets, 20)

  useEffect(() => {
    bucketsService
      .getBuckets()
      .then((buckets) => setBuckets(buckets))
      .catch((err) => {
        const error = err as Error

        notificationsService.error({
          text: error.message,
        })
      })
  }, [])

  return (
    <section className="flex flex-col items-center p-7 w-full">
      <div className="flex flex-col p-8 w-full bg-white gap-5">
        <div className="flex flex-row w-full justify-between items-center">
          <p className="font-semibold text-lg">Buckets</p>
          <button
            className="flex items-center px-7 py-2.5 text-white bg-blue-600 rounded-sm text-sm font-semibold"
            onClick={() => setIsCreateBucketOpened(true)}
          >
            Create Bucket
          </button>
        </div>
        <Separator />
        <div className="flex flex-col w-full">
          <BucketsTable
            headers={HEADER_ITEMS}
            buckets={paginatedData}
            onDeleteBucketsClicked={() => setIsDeleteBucketDialogOpened(true)}
          />
          <div className="flex flex-row items-end justify-end w-full">
            <div className="items-center flex flex-row gap-3">
              <p>
                {pageInfo.from}-{pageInfo.to} of {totalItems}
              </p>
              <div className="flex flex-row gap-3 items-center">
                <button
                  disabled={!hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <CaretLeft
                    size={20}
                    className={`${
                      !hasPrevPage
                        ? 'text-gray-300 cursor-no-drop'
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
                        ? 'text-gray-300 cursor-no-drop'
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
        onClose={() => setIsDeleteBucketDialogOpened(false)}
        onPrimaryAction={() => {}}
        onSecondaryAction={() => setIsDeleteBucketDialogOpened(false)}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete bucket"
        subtitle="By deleting this bucket, all associated usage data will also be permanently removed."
      />

      <Modal
        isOpen={isCreateBucketOpened}
        onClose={() => setIsCreateBucketOpened(false)}
      >
        <div className="flex flex-row w-full gap-3 items-center justify-end">
          <button
            className="flex text-black hover:bg-gray-200 rounded-sm py-2 px-3"
            onClick={() => setIsCreateBucketOpened(false)}
          >
            Cancel
          </button>
          <button className="flex text-white bg-blue-600 rounded-sm py-2 px-3">
            Create
          </button>
        </div>
      </Modal>
    </section>
  )
}
