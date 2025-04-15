import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { Usage } from '../../services/usage.service'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface HeaderItemsTableProps {
  title: string
  key: string
}

interface UsageTableProps {
  headers: HeaderItemsTableProps[]
  usage: Usage[]
}

export const UsageTable = ({ headers, usage }: UsageTableProps) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="w-full h-12 bg-gray-100 text-black text-sm">
          {headers.map((header) => (
            <th key={header.key} className="w-[25%] px-5 text-left">
              {header.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {usage.map(({ id, downloads, recordDate, totalUsage, uploads }) => (
          <tr
            key={id}
            className="w-full h-12 text-sm text-gray-500"
            onClick={() => {}}
          >
            <td key={recordDate} className="w-[25%] px-5 text-left">
              {recordDate}
            </td>
            <td key={totalUsage} className="w-[25%] px-5 text-left">
              {totalUsage}
            </td>
            <td key={downloads} className="w-[25%] px-5 text-left">
              {downloads}
            </td>
            <td key={uploads} className="w-[25%] px-5 text-left">
              {uploads}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
