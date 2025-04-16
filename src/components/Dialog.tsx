import { JSX, useEffect, useState } from 'react'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  onPrimaryAction: () => void
  onSecondaryAction: () => void
  title: string
  subtitle: string
  primaryAction: string
  secondaryAction: string
  primaryActionColor: 'primary' | 'danger'
  isLoading?: boolean
}

/**
 * Dialog component
 *
 * @property {boolean} isOpen
 * - Controls whether the dialog is open or closed. If true, the dialog becomes visible.
 *
 * @property {() => void} onClose
 * - Callback function triggered when the overlay or the close button is clicked. Used to close the dialog.
 *
 * @property {() => void} onPrimaryAction
 * - Callback function triggered when the primary action button is clicked.
 *
 * @property {() => void} onSecondaryAction
 * - Callback function triggered when the secondary action button is clicked.
 *
 * @property {string} title
 * - The title of the dialog, displayed at the top of the dialog box.
 *
 * @property {string} subtitle
 * - A subtitle for the dialog, displayed below the title.
 *
 * @property {string} primaryAction
 * - The label for the primary action button.
 *
 * @property {string} secondaryAction
 * - The label for the secondary action button.
 *
 * @property {('primary' | 'danger')} primaryActionColor
 * - Defines the color of the primary action button. Can either be 'primary' or 'danger'.
 *
 * @property {boolean} [isLoading]
 * - Optional flag to indicate if the buttons should show a loading state. Defaults to false.
 *
 * @returns {JSX.Element}
 * - The rendered dialog component.
 */

const Dialog = ({
  isOpen,
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  primaryActionColor,
  isLoading,
}: DialogProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(isOpen)
  const [transitionOpacity, setTransitionOpacity] =
    useState<string>('opacity-0')
  const [transitionScale, setTransitionScale] = useState<string>('scale-95')

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        setTransitionOpacity('opacity-100')
        setTransitionScale('scale-100')
      }, 10)
      setIsVisible(true)
      return () => clearTimeout(timeout)
    } else {
      setTransitionOpacity('opacity-0')
      setTransitionScale('scale-95')
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <>
      {isVisible && (
        <div
          className={`fixed inset-0 z-50 ${
            isOpen ? '' : 'pointer-events-none'
          }`}
        >
          <div
            className={`absolute inset-0 bg-gray-100/50 transition-opacity
             duration-150 dark:bg-black/75
              ${transitionOpacity}
            `}
            onClick={onClose}
            data-testid="dialog-overlay"
          ></div>

          <div
            className={`absolute
              left-1/2
              top-1/2
              w-full
              max-w-sm
              -translate-x-1/2
              -translate-y-1/2
              transform rounded-2xl
              bg-white p-5
              transition-all
              duration-150
              dark:bg-gray-1
              ${transitionScale} 
              ${transitionOpacity}`}
          >
            <div className="flex flex-col space-y-2">
              <p className="text-2xl font-medium">{title}</p>
              <p className="text-gray-60">{subtitle}</p>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={onSecondaryAction}
                disabled={isLoading}
                className="flex px-3 py-2 rounded-sm hover:bg-gray-300"
              >
                {secondaryAction}
              </button>
              <button
                onClick={onPrimaryAction}
                className={`flex px-3 py-2 rounded-sm ${
                  primaryActionColor === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500'
                }`}
              >
                {primaryAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Dialog
