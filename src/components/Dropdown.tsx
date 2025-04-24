import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type DropdownItem = {
  label?: string;
  icon?: ReactNode;
  onClick: () => void;
  render?: () => ReactNode;
  disabled?: boolean;
};

interface DropdownProps {
  label?: string;
  button: ReactNode;
  items: DropdownItem[];
  width?: string;
}

export const Dropdown = ({
  button,
  items,
  width = 'w-36',
  label,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      ref.current &&
      !ref.current.contains(event.target as Node) &&
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0, width: 0 };

    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      right: window.innerWidth - rect.right - window.scrollX,
      width: rect.width,
    };
  };

  const position = getDropdownPosition();

  const widthClass = width?.match(/w-[^\s]+/)?.[0] || '';
  const otherClasses = width?.replace(widthClass, '').trim() || '';

  return (
    <div className='relative flex flex-col gap-1' ref={ref}>
      {label && (
        <div className='flex flex-col gap-1 w-full'>
          <label className='flex items-center gap-1'>
            <span className={`text-sm text-gray-80`}>{label}</span>
          </label>
        </div>
      )}

      <button
        ref={buttonRef}
        onClick={handleToggle}
        className='cursor-pointer w-full'
      >
        {button}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed bg-white rounded shadow-lg ${otherClasses}`}
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
              zIndex: 9999,
              width:
                widthClass === 'w-full' ? `${position.width}px` : undefined,
              minWidth:
                widthClass !== 'w-full' ? `${position.width}px` : undefined,
            }}
          >
            <div className='flex flex-col py-0.5'>
              {items.map(
                ({ label, icon, disabled = false, onClick, render }, index) => (
                  <button
                    key={label || `dropdown-item-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2 text-left flex items-center justify-between ${
                      disabled
                        ? 'text-black/30 !cursor-no-drop'
                        : 'text-gray-700 hover:bg-gray-10'
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
                )
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
