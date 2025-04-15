import { useState, useRef, useEffect } from 'react'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

import { formattedDate } from '../utils/formattedDate'

// We need the date-dns package because the react-date-picker uses it for locales dates

interface DateRangePickerProps {
  range: {
    startDate: Date
    endDate: Date
  }
  onChangeDate: (startDate: Date, endDate: Date) => void
}

export const DateRangePicker = ({
  range,
  onChangeDate,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formattedLabel = () => {
    const { startDate, endDate } = range
    return `${formattedDate('DD MMM YYYY', startDate)} → ${formattedDate(
      'DD MMM YYYY',
      endDate
    )}`
  }

  return (
    <div className="relative w-max" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm text-sm"
      >
        {formattedLabel()}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 shadow-lg bg-white rounded">
          <DateRange
            className="rounded-sm"
            editableDateInputs={true}
            onChange={(item) => {
              onChangeDate(item.range1.startDate!, item.range1.endDate!)
            }}
            moveRangeOnFirstSelection={false}
            ranges={[
              {
                startDate: range.startDate,
                endDate: range.endDate,
              },
            ]}
            months={2}
            direction="horizontal"
            showDateDisplay={false}
            maxDate={new Date()}
          />
        </div>
      )}
    </div>
  )
}
