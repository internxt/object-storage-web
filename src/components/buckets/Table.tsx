import { DotsThreeVertical, ChartBar, Database } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { formattedDate } from '../../utils/formattedDate';
import { FORMATTED_DATE_WITH_TIMEZONE } from '../../views/BucketsPage';
import { Dropdown } from '../Dropdown';
import { Bucket } from '../../services/buckets.service';
import { getFlagAndNameFromRegion } from '../../utils/getFlagAndNameFromRegion';
import { LoadingRowSkeleton } from '../LoadingSkeleton';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface HeaderItemsTableProps {
  title: string;
  sortKey: string;
  defaultDirection: string;
}

interface BucketsTableProps {
  headers: HeaderItemsTableProps[];
  buckets: Bucket[];
  // onDeleteBucketsClicked: (bucket: Bucket) => void;
  onViewUsageClicked: (bucket: Bucket) => void;
  isLoading: boolean;
}

export const BucketsTable = ({
  headers,
  buckets,
  // onDeleteBucketsClicked,
  onViewUsageClicked,
  isLoading = false,
}: BucketsTableProps) => {
  if (isLoading) {
    return (
      <table className='w-full'>
        <thead>
          <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
            {headers.map((header) => (
              <th key={header.sortKey} className='w-[33%] px-5 text-left'>
                {header.title}
              </th>
            ))}

            <th className='w-[1%]' />
          </tr>
        </thead>
        <tbody>
          <LoadingRowSkeleton numberOfColumns={4} numberOfRows={5} />
        </tbody>
      </table>
    );
  }

  return (
    <table className='w-full'>
      <thead className='sticky top-0 z-10'>
        <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
          {headers.map((header) => (
            <th key={header.sortKey} className='w-[33%] px-5 text-left'>
              {header.title}
            </th>
          ))}

          <th className='w-[1%]' />
        </tr>
      </thead>
      <tbody>
        {buckets.length === 0 ? (
          <tr className='w-full h-12 text-sm text-gray-500'>
            <td colSpan={headers.length} className='text-center'>
              No buckets found
            </td>
          </tr>
        ) : (
          buckets.map((bucket) => (
            <tr className='w-full h-12 text-sm text-gray-500' key={bucket.id}>
              <td className='w-[33%] px-5'>
                <div className='flex flex-row gap-2 items-center'>
                  <Database size={18} className='text-blue-600' />
                  <span className='text-primary font-medium'>
                    {bucket.name}
                  </span>
                </div>
              </td>
              <td className='w-[33%] px-5'>
                <div className='flex flex-row gap-2 items-center'>
                  <p>{getFlagAndNameFromRegion(bucket.region).flag}</p>
                  <p>{getFlagAndNameFromRegion(bucket.region).name}</p>
                </div>
              </td>
              <td className='w-[33%] px-5'>
                {formattedDate(
                  FORMATTED_DATE_WITH_TIMEZONE,
                  bucket.creationDate
                )}
              </td>
              <td className='w-[1%] px-5'>
                <Dropdown
                  button={
                    <DotsThreeVertical
                      size={28}
                      weight='bold'
                      className='hover:bg-gray-20 rounded-full p-1'
                    />
                  }
                  items={[
                    {
                      label: 'View Usage',
                      icon: <ChartBar size={18} className='text-blue-600' />,
                      onClick: () => onViewUsageClicked(bucket),
                      disabled: !bucket.bucketNumber,
                    },
                    // {
                    //   label: 'Delete',
                    //   icon: <Trash size={18} className='text-red-600' />,
                    //   onClick: () => onDeleteBucketsClicked(bucket),
                    // },
                  ]}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};
