import { DotsThreeVertical } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { formattedDate } from '../../utils/formattedDate'
import { FORMATTED_DATE_WITH_TIMEZONE } from '../../views/BucketsPage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface HeaderItemsTableProps {
  title: string
  sortKey: string
  defaultDirection: string
}

interface BucketsTableProps {
  headers: HeaderItemsTableProps[]
}

export const BucketsTable = ({ headers }: BucketsTableProps) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="w-full h-12 bg-gray-100 text-black text-sm">
          {headers.map((header) => (
            <th key={header.sortKey} className="w-[33%] px-5 text-left">
              {header.title}
            </th>
          ))}

          <th className="w-[1%]" />
        </tr>
      </thead>
      <tbody>
        <tr
          className="w-full h-12 text-sm text-gray-500 hover:bg-gray-100 hover:cursor-pointer"
          onClick={() => {}}
        >
          <td className="w-[33%] px-5">Bucket 1</td>
          <td className="w-[33%] px-5">Region 1</td>
          <td className="w-[33%] px-5">
            {formattedDate(FORMATTED_DATE_WITH_TIMEZONE)}
          </td>
          <td className="w-[1%] px-5">
            <DotsThreeVertical width={20} height={20} weight="bold" />
          </td>
        </tr>
      </tbody>
    </table>
  )
}
