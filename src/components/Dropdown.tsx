import { ReactNode, useEffect, useRef, useState } from 'react'

type DropdownItem = {
  label: string
  icon?: ReactNode
  onClick: () => void
}

interface DropdownProps {
  button: ReactNode
  items: DropdownItem[]
}

export const Dropdown = ({ button, items }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleToggle = () => setIsOpen(!isOpen)

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={handleToggle} className="cursor-pointer">
        {button}
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded shadow-lg z-50">
          <div className="flex flex-col py-0.5">
            {items.map(({ label, icon, onClick }) => (
              <button
                key={label}
                onClick={() => {
                  onClick()
                  setIsOpen(false)
                }}
                className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                {label}
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
