import { useEffect, useState } from 'react'
import { InfoCard } from '../components/usage/InfoCard'
import { Usage, usageService } from '../services/usage.service'
import { UsageTable } from '../components/usage/Table'
import { DateRangePicker } from '../components/DatePicker'
import dayjs from 'dayjs'
import { usePaginatedUsageData } from '../hooks/usePaginatedUserData'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import notificationsService from '../services/notifications.service'

const INFO_CARDS = [
  {
    key: 'totalUsage' as const,
    name: 'Total Usage',
  },
  {
    key: 'downloads' as const,
    name: 'Downloads',
  },
  {
    key: 'uploads' as const,
    name: 'Uploads',
  },
]

const TABLE_HEADERS = [
  {
    title: 'Record date',
    key: 'recordDate',
  },
  {
    title: 'Total Storage',
    key: 'totalStorage',
  },
  {
    title: 'Downloads',
    key: 'downloads',
  },
  {
    title: 'Uploads',
    key: 'uploads',
  },
]

const DEFAULT_GENERAL_DATA = {
  totalUsage: '-',
  downloads: '-',
  uploads: '-',
}

const PAGINATED_ITEMS = 20

export type BODY_STATE = 'loading' | 'empty' | 'items'

export const UsagePage = () => {
  const [usageData, setUsageData] = useState<Usage[]>([])
  const [generalData, setGeneralData] = useState(DEFAULT_GENERAL_DATA)
  const [tableBodyState, setTableBodyState] = useState<BODY_STATE>('loading')

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageInfo,
    totalItems,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedUsageData(usageData, PAGINATED_ITEMS)

  useEffect(() => {
    const startDate = dayjs().subtract(1, 'month').toDate()
    const endDate = dayjs().toDate()

    getUsage(startDate.toDateString(), endDate.toDateString())
  }, [])

  const getUsage = async (startDate: string, endDate: string) => {
    try {
      setTableBodyState('loading')
      const usage = await usageService.getUsage(startDate, endDate)
      if (usage.length === 0) {
        setGeneralData(DEFAULT_GENERAL_DATA)
        setTableBodyState('empty')
      } else {
        setGeneralData({
          downloads: usage[0].downloads.toString(),
          totalUsage: usage[0].totalUsage.toString(),
          uploads: usage[0].uploads.toString(),
        })
        setTableBodyState('items')
      }

      setUsageData(usage)
    } catch (error) {
      const err = error as Error
      notificationsService.error({
        text: err.message,
      })
      setTableBodyState('empty')
    }
  }

  const onApplyFilter = async (startDate: string, endDate: string) => {
    try {
      await getUsage(startDate, endDate)
    } catch (error) {
      const err = error as Error
      notificationsService.error({
        text: err.message,
      })
    }
  }

  return (
    <section className="flex flex-row justify-between p-7 w-screen gap-10">
      <div className="flex flex-col p-8 w-full bg-white gap-5">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex w-full">
            <h1 className="text-xl font-bold text-black">Account Usage</h1>
          </div>
          <div className="flex flex-col w-full justify-end items-end gap-2">
            <DateRangePicker onApplyFilterButtonClicked={onApplyFilter} />
          </div>
        </div>
        <div className="flex flex-col w-full justify-between h-full">
          <UsageTable
            headers={TABLE_HEADERS}
            usage={paginatedData}
            bodyState={tableBodyState}
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
      <div className="flex flex-col w-auto gap-5 items-center">
        {INFO_CARDS.map((infoCard) => {
          return (
            <InfoCard
              key={infoCard.name}
              value={generalData[infoCard.key]}
              name={infoCard.name}
            />
          )
        })}
      </div>
    </section>
  )
}
