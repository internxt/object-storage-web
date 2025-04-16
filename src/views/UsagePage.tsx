import { useEffect, useState } from 'react'
import { InfoCard } from '../components/usage/InfoCard'
import { Usage, usageService } from '../services/usage.service'
import { UsageTable } from '../components/usage/Table'
import { DateRangePicker } from '../components/DatePicker'
import dayjs from 'dayjs'
import { usePaginatedUsageData } from '../hooks/usePaginatedUserData'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

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

export const UsagePage = () => {
  const [usageData, setUsageData] = useState<Usage[]>([])

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageInfo,
    totalItems,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedUsageData(usageData, 20)

  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(1, 'month').toDate(),
    endDate: dayjs().toDate(),
  })
  const totalUsage = usageData[0]

  useEffect(() => {
    usageService
      .getUsage(
        dateRange.startDate.toISOString(),
        dateRange.endDate.toISOString()
      )
      .then((usage) => {
        setUsageData(usage)
      })
      .catch((error) => {
        console.log('Error fetching usage data:', error)
      })
  }, [dateRange])

  const onRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({
      startDate,
      endDate,
    })
  }

  return (
    <section className="flex flex-row justify-between p-7 w-screen gap-10">
      <div className="flex flex-col p-8 w-full bg-white gap-5">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex w-full">
            <h1 className="text-xl font-bold text-black">Account Usage</h1>
          </div>
          <div className="flex flex-col w-full justify-end items-end">
            <DateRangePicker range={dateRange} onChangeDate={onRangeChange} />
          </div>
        </div>
        <div className="flex flex-col w-full justify-between h-full">
          <UsageTable headers={TABLE_HEADERS} usage={paginatedData} />
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
      <div className="flex flex-col w-auto gap-5 justify-center items-center">
        {totalUsage &&
          INFO_CARDS.map((infoCard) => {
            return (
              <InfoCard
                key={infoCard.name}
                value={totalUsage[infoCard.key]}
                name={infoCard.name}
              />
            )
          })}
      </div>
    </section>
  )
}
