import { DotsThreeVertical, Trash } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { formattedDate } from '../../utils/formattedDate'
import { Dropdown } from '../../components/Dropdown'
import { AccessKey } from '../../services/access-keys.service'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface HeaderItemsTableProps {
  title: string
  key: string
}

interface BucketsTableProps {
  headers: HeaderItemsTableProps[]
  accessKeys: AccessKey[]
  onDeleteAccessKey: (bucket: AccessKey) => void
}

export const AccessKeyTable = ({
  headers,
  accessKeys,
  onDeleteAccessKey,
}: BucketsTableProps) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="w-full h-12 bg-gray-10 text-black text-sm">
          {headers.map((header) => (
            <th key={header.key} className="w-[33%] px-5 text-left">
              {header.title}
            </th>
          ))}

          <th className="w-[1%]" />
        </tr>
      </thead>
      <tbody>
        {accessKeys.map((accessKey) => (
          <tr
            className="w-full h-12 text-sm text-gray-500"
            key={accessKey.accessKeyId}
          >
            <td className="w-[35%] pl-5">{accessKey.name}</td>
            <td className="w-[31%] px-5">{accessKey.accessKeyId}</td>

            <td className="w-[35%] px-5">
              {formattedDate('DD-MMM-YYYY', accessKey.creationDate)}
            </td>
            <td className="w-[1%] px-5">
              <Dropdown
                button={
                  <DotsThreeVertical
                    size={28}
                    weight="bold"
                    className="hover:bg-gray-200 rounded-full p-1"
                  />
                }
                items={[
                  {
                    label: 'Delete',
                    icon: <Trash size={18} className="text-red-600" />,
                    onClick: () => onDeleteAccessKey(accessKey),
                  },
                ]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
