import { JSX, ReactNode, useEffect, useRef, useState } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  className?: string
  width?: string
  preventClosing?: boolean
}

/**
 * Modal component
 *
 * @param {ModalProps} props - Properties of the Modal component.
 *
 * @property {boolean} isOpen
 * - Controls the visibility of the modal. If `true`, the modal is shown; if `false`, the modal is hidden.
 *
 * @property {() => void} onClose
 * - Callback function that is called when the modal is closed.
 * This function is triggered by clicking outside the modal or
 * pressing the 'Escape' key (unless `preventClosing` is `true`).
 *
 * @property {ReactNode} children
 * - The content to be displayed inside the modal.
 *
 * @property {string} [maxWidth]
 * - Optional maximum width for the modal. Defaults to `'max-w-lg'` if not specified.
 *
 * @property {string} [className]
 * - Optional custom class names to apply to the modal content wrapper.
 *
 * @property {string} [width]
 * - Optional width for the modal. Defaults to `'w-full'` if not specified.
 *
 * @property {boolean} [preventClosing=false]
 * - Optional flag to prevent the modal from closing when clicking outside or pressing the 'Escape' key.
 *
 * @returns {JSX.Element | null}
 * - The rendered Modal component, or `null` if `isOpen` is `false`.
 *
 * The component uses a series of hooks and effects to manage modal transitions and handle click and key press events.
 * It supports smooth opacity and scale transitions during opening and closing,
 * and prevents interaction with the modal's background during the transitions.
 *
 * The `preventClosing` prop ensures the modal stays open when interacting outside of the modal or pressing 'Escape'.
 *
 * The modal is displayed with a fixed position in the center of the screen, with a backdrop overlay.
 * The content of the modal is rendered inside a flex container with transition effects to animate its appearance.
 */

const Modal = ({
  isOpen,
  onClose,
  children,
  maxWidth,
  className,
  width,
  preventClosing = false,
}: ModalProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement | null>(null)
  const [showContent, setShowContent] = useState(isOpen)
  const [transitionOpacity, setTransitionOpacity] =
    useState<string>('opacity-0')
  const [transitionScale, setTransitionScale] = useState<string>('scale-95')

  const closeLastOpenModal = () => {
    const openModals = document.querySelectorAll('[data-modal]')
    const lastModal = openModals[openModals.length - 1]
    if (modalRef.current === lastModal) {
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        setTransitionOpacity('opacity-100')
        setTransitionScale('scale-100')
      }, 10)
      setShowContent(true)
      return () => clearTimeout(timeout)
    } else {
      setTransitionOpacity('opacity-0')
      setTransitionScale('scale-95')
      const timeout = setTimeout(() => {
        setShowContent(false)
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !preventClosing
      ) {
        event.preventDefault()
        closeLastOpenModal()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, preventClosing])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventClosing) {
        event.preventDefault()
        closeLastOpenModal()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, preventClosing])

  return (
    <>
      {showContent && (
        <div className="m-0">
          <div
            className={`
              fixed
              min-h-full
              inset-0
              z-[9999]
              bg-black/40
              transition-opacity
              duration-150
              ease-out
              ${transitionOpacity}
              pointer-events-none           
            `}
          />
          <div
            className={`
              fixed
              inset-0
              z-[9999]
              flex
              min-h-full
              items-center
              justify-center
              transition-opacity
              duration-150
              ease-out
              overflow-y-auto
              ${transitionOpacity}
              ${transitionScale}
            `}
          >
            <section
              data-testid={'ModalContent'}
              ref={modalRef}
              data-modal
              className={`
                ${width ?? 'w-full'}
                ${maxWidth ?? 'max-w-lg'}
                ${className ?? 'p-5'}
                text-gray-100
                rounded-2xl
                bg-white
                shadow-subtle-hard
                transform
                transition-all
                duration-150
                ease-out
                ${transitionOpacity}
                ${transitionScale}
              `}
            >
              {children}
            </section>
          </div>
        </div>
      )}
    </>
  )
}

export default Modal
