import { ReactNode, useEffect, useRef, useState } from 'react'

type DropdownItem = {
  label?: string
  icon?: ReactNode
  onClick: () => void
  render?: () => ReactNode
  disabled?: boolean
}

interface DropdownProps {
  button: ReactNode
  items: DropdownItem[]
  width?: string
}

export const Dropdown = ({ button, items, width = 'w-36' }: DropdownProps) => {
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
      <button onClick={handleToggle} className="cursor-pointer w-full">
        {button}
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 bg-white rounded shadow-lg z-50 ${width}`}
        >
          <div className="flex flex-col py-0.5">
            {items.map(({ label, icon, disabled = false, onClick, render }) => (
              <button
                key={label}
                onClick={() => {
                  onClick()
                  setIsOpen(false)
                }}
                className={`px-4 py-2 text-left flex items-center justify-between ${
                  disabled
                    ? 'text-black/30 !cursor-no-drop'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={disabled}
              >
                {render ? (
                  render()
                ) : (
                  <>
                    {label}
                    {icon}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
