import { useState, useRef, useEffect } from 'react'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { formattedDate } from '../utils/formattedDate'
import dayjs from 'dayjs'

interface DateRangePickerProps {
  onApplyFilterButtonClicked: (
    startDate: string,
    endDate: string
  ) => Promise<void>
}

export const DateRangePicker = ({
  onApplyFilterButtonClicked,
}: DateRangePickerProps) => {
  const startDate = dayjs().subtract(1, 'month').toDate()
  const endDate = dayjs().toDate()

  const [isOpen, setIsOpen] = useState(false)
  const [range, setRange] = useState({
    startDate,
    endDate,
  })
  const ref = useRef<HTMLDivElement>(null)

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formattedLabel = () => {
    return `${formattedDate('DD MMM YYYY', range.startDate)} → ${formattedDate(
      'DD MMM YYYY',
      range.endDate
    )}`
  }

  const handleApply = async () => {
    await onApplyFilterButtonClicked(
      range.startDate.toDateString(),
      range.endDate.toDateString()
    )
    setIsOpen(false)
  }

  return (
    <div className="relative w-max" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-primary text-white rounded shadow-sm text-sm"
      >
        {formattedLabel()}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 flex flex-col gap-3 mt-2 shadow-lg bg-white rounded">
          <DateRange
            className="rounded-sm"
            onChange={(item) => {
              const { startDate, endDate } = item.range
              if (startDate && endDate) {
                setRange({ startDate, endDate })
              }
            }}
            color="#155dfc"
            rangeColors={['#155dfc']}
            ranges={[
              {
                startDate: range.startDate,
                endDate: range.endDate,
                key: 'range',
              },
            ]}
            months={2}
            direction="horizontal"
            showDateDisplay={false}
            maxDate={new Date()}
          />
          <div className="flex p-2 justify-end">
            <button
              className="flex w-max bg-primary text-white px-3 py-2 rounded-sm"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
