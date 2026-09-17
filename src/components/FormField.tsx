import { ReactNode } from 'react';

export const inputClass =
  'w-full border border-gray-20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

export const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className='flex flex-col gap-1'>
    <label className='text-sm font-medium text-gray-80'>{label}</label>
    {children}
    {error && <span className='text-xs text-red'>{error}</span>}
  </div>
);
