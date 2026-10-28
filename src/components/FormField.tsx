import { ReactNode } from 'react';

export const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-80">{label}</label>
    {children}
    {error && <span className="text-xs text-red">{error}</span>}
  </div>
);
