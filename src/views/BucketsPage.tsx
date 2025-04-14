import { X } from '@phosphor-icons/react'
import { Separator } from '../components/Separator'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { BucketsTable } from '../components/buckets/Table'

dayjs.extend(utc)
dayjs.extend(timezone)

export const FORMATTED_DATE_WITH_TIMEZONE = 'DD-MMM-YYYY hh:mm A [(UTC]Z[)]'

export const BucketsPage = () => {
  return (
    <div className="flex flex-col items-center p-7 w-full">
      <div className="flex flex-col p-8 w-full bg-white gap-5">
        <div className="flex flex-row w-full justify-between items-center">
          <p className="font-semibold text-lg">Buckets</p>
          <button className="flex items-center px-7 py-2.5 text-white bg-blue-600 rounded-sm text-sm font-semibold">
            Create Bucket
          </button>
        </div>
        <Separator />
        <div className="flex flex-row max-w-[220px] items-center">
          <div className={`relative flex-1 bg-gray-100 w-max px-2 py-2.5`}>
            <input
              type={'text'}
              placeholder={'Search'}
              min={0}
              required={true}
              className="px-1 rounded-xs text-gray-500 text-sm"
            />
            <div
              onClick={() => {}}
              onKeyDown={(e) =>
                (e['code'] === 'Space' || e['code'] === 'Enter') && {}
              }
              className="absolute right-4 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400"
            >
              <X width={14} height={14} />
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full">
          <BucketsTable />
        </div>
      </div>
    </div>
  )
}
