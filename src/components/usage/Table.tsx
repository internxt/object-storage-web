import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { Usage } from '../../services/usage.service'
import { LoadingRowSkeleton } from '../LoadingSkeleton'
import { BODY_STATE } from '../../views/UsagePage'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface HeaderItemsTableProps {
  title: string
  key: string
}

interface UsageTableProps {
  headers: HeaderItemsTableProps[]
  bodyState: BODY_STATE
  usage: Usage[]
}

export const UsageTable = ({ headers, bodyState, usage }: UsageTableProps) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="w-full h-12 bg-gray-10 text-black text-sm">
          {headers.map((header) => (
            <th key={header.key} className="w-[25%] px-5 text-left">
              {header.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyState === 'loading' && (
          <LoadingRowSkeleton
            numberOfColumns={4}
            numberOfRows={5}
            itemWidth="25%"
          />
        )}
        {bodyState === 'empty' && (
          <tr>
            <td
              colSpan={headers.length}
              className="text-center py-4 text-sm text-gray-400"
            >
              There are no results to show
            </td>
          </tr>
        )}
        {bodyState === 'items' &&
          usage.map(({ id, downloads, recordDate, totalUsage, uploads }) => (
            <tr key={id} className="w-full h-12 text-sm text-gray-500">
              <td className="w-[25%] px-5 text-left">{recordDate}</td>
              <td className="w-[25%] px-5 text-left">{totalUsage}</td>
              <td className="w-[25%] px-5 text-left">{downloads}</td>
              <td className="w-[25%] px-5 text-left">{uploads}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
