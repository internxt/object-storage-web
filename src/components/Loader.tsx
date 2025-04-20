import React from 'react'
import '../styles/Loader.css'

export interface LoaderProps {
  classNameContainer?: string
  classNameLoader?: string
  classNameText?: string
  type?: 'spinner' | 'pulse'
  text?: string
  size?: number
}

/**
 * Loader component.
 *
 * @property {string} [classNameContainer]
 * - Optional class name for the container wrapping the loader.
 * Useful for applying custom styles to the outermost container.
 *
 * @property {string} [classNameLoader]
 * - Optional class name for the loader element itself (spinner or pulse).
 * Allows custom styling of the loading animation.
 *
 * @property {string} [classNameText]
 * - Optional class name for the text displayed below the loader.
 * Allows style or adjust the appearance of the text.
 *
 * @property {'spinner' | 'pulse'} [type='spinner']
 * - Determines the type of loader to render.
 * Can be `'spinner'` for a rotating animation or `'pulse'` for a pulsing effect.
 * Defaults to `'spinner'`.
 *
 * @property {string} [text]
 * - Optional text to display below the loader.
 *
 * @property {number} [size=32]
 * - Size of the spinner loader in pixels.
 * Applies to the width and height of the SVG element for the `'spinner'` type.
 * Defaults to `32`.
 */

const Loader: React.FC<LoaderProps> = ({
  classNameContainer,
  classNameLoader,
  classNameText,
  type = 'spinner',
  text,
  size = 32,
}) => {
  const isSpinner = type === 'spinner'

  return (
    <div className={classNameContainer}>
      {isSpinner ? (
        <>
          <svg
            className={`animate-spin ${classNameLoader}`}
            width={size}
            height={size}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="img"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824
                3 7.938l3-2.647z"
            ></path>
          </svg>
          {text && <p className={classNameText}>{text}</p>}
        </>
      ) : (
        <div className={`loader-container ${classNameLoader}`}>
          <div className="loader06"></div>
          {text && <p className={`loader-text ${classNameText}`}>{text}</p>}
        </div>
      )}
    </div>
  )
}

export default Loader
