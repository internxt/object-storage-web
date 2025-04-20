import { JSX, ReactNode } from 'react'
import Loader from './Loader'

export interface ButtonProps {
  id?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'tertiary'
  type?: 'button' | 'submit'
  children?: ReactNode
  className?: string
  disabled?: boolean
  onClick?: (e?: unknown) => void
  onKeyDown?: (e?: unknown) => void
  size?: 'medium' | 'default'
  loading?: boolean
  dataTest?: string
  autofocus?: boolean
  buttonDataCy?: string
  buttonChildrenDataCy?: string
}

/**
 * Button component
 *
 * @property {string} [id]
 * - Optional ID for the button element, useful for accessibility and styling.
 *
 * @property {'primary' | 'secondary' | 'ghost' | 'destructive'} [variant]
 * - Defines the button's style variant. Options are:
 *   - 'primary': Standard button style with primary color.
 *   - 'secondary': Button with border and subtle background color.
 *   - 'ghost': Button with transparent background, suitable for icons or light use.
 *   - 'destructive': Button for destructive actions.
 *
 * @property {'button' | 'submit'} [type]
 * - Specifies the type of the button. Defaults to 'button'.
 *   - 'button': Standard button behavior.
 *   - 'submit': Button submits a form when used inside a form element.
 *
 * @property {ReactNode} [children]
 * - The content inside the button, such as text or icons.
 *   - Can be a single element or an array of elements.
 *
 * @property {string} [className]
 * - Custom CSS classes for additional styling of the button.
 *
 * @property {boolean} [disabled]
 * - Disables the button, preventing user interaction and applying a disabled style.
 *   - Defaults to false.
 *
 * @property {(e?: unknown) => void} [onClick]
 * - Function called when the button is clicked. Accepts an optional event object.
 *
 * @property {(e?: unknown) => void} [onKeyDown]
 * - Function called when a key is pressed while the button is focused. Accepts an optional event object.
 *
 * @property {'medium' | 'default'} [size]
 * - Specifies the button size. Options are:
 *   - 'default': Standard size.
 *   - 'medium': Slightly smaller size for compact use.
 *
 * @property {boolean} [loading]
 * - If true, shows a loading spinner inside the button.
 *
 * @property {string} [dataTest]
 * - Custom data attribute used for test automation or tracking purposes.
 *
 * @property {boolean} [autofocus]
 * - If true, the button will be focused automatically when the page loads.
 *
 * @property {string} [buttonDataCy]
 * - Custom data attribute for the button element.
 *
 * @property {string} [buttonChildrenDataCy]
 * - Custom data attribute for the children of the button.
 */

const Button = ({
  variant = 'primary',
  type = 'button',
  id,
  children,
  className = '',
  disabled = false,
  onClick = () => undefined,
  onKeyDown = () => undefined,
  size = 'default',
  loading,
  dataTest,
  autofocus,
  buttonDataCy,
  buttonChildrenDataCy,
}: Readonly<ButtonProps>): JSX.Element => {
  let styles = ''

  if (variant === 'primary' && !disabled) {
    styles = `${
      loading ? 'bg-primary-dark' : 'bg-primary'
    } active:bg-primary-dark text-white shadow-sm`
  } else if (variant === 'primary' && disabled) {
    styles = 'bg-gray-30 text-white shadow-sm'
  } else if (variant === 'destructive' && !disabled) {
    styles = `${
      loading ? 'bg-red-dark' : 'bg-red'
    } active:bg-red-dark text-white shadow-sm`
  } else if (variant === 'destructive' && disabled) {
    styles = 'bg-gray-30 text-white shadow-sm'
  } else if (variant === 'secondary' && !disabled) {
    styles =
      'bg-surface dark:bg-gray-5 border border-gray-10' +
      ' hover:border-gray-20 active:bg-gray-1 dark:active:bg-gray-10 text-gray-80 shadow-sm'
  } else if (variant === 'secondary' && disabled) {
    styles =
      'bg-surface dark:bg-gray-5 text-gray-30 border border-gray-5 shadow-sm'
  } else if (variant === 'ghost' && !disabled) {
    styles = 'hover:bg-gray-5 active:bg-gray-10 focus-visible:bg-gray-10'
  } else if (variant === 'ghost' && disabled) {
    styles = 'text-gray-30'
  } else if (variant === 'tertiary' && !disabled) {
    styles = `${
      loading ? 'bg-white/45' : 'bg-white/15'
    } active:bg-white/25 text-white shadow-sm border border-white/20 active:border-white hover:border-white/40 active:border-white 
    transition-all duration-200`
  } else if (variant === 'tertiary' && disabled) {
    styles = 'bg-white/45 text-white shadow-sm border border-white/20'
  }

  return (
    <button
      data-cy={buttonDataCy}
      id={id}
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled || loading}
      type={type}
      data-test={dataTest}
      autoFocus={autofocus}
      className={`${
        size === 'default' ? 'h-10 px-5' : 'h-8 px-3.5'
      } relative flex shrink-0 select-none flex-row items-center justify-center space-x-2 
      whitespace-nowrap rounded-lg text-base font-medium outline-none ring-2 ring-primary/0 
      ring-offset-2 ring-offset-transparent transition-all duration-100 ease-in-out 
      focus-visible:ring-primary/50 ${styles} ${className}`}
    >
      {loading && <Loader size={18} />}
      <div
        className="flex items-center justify-center space-x-2"
        data-cy={buttonChildrenDataCy}
      >
        {children}
      </div>
    </button>
  )
}

export default Button
