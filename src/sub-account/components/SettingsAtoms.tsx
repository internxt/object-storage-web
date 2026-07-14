/** Read-only field: label above a surface-muted box */
export const ReadField = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <p className='text-sm font-medium text-gray-100 mb-1.5'>{label}</p>
    <div className={`min-h-[40px] bg-gray-5 border border-gray-10 rounded-lg px-3 py-2 flex items-center text-gray-80 ${mono ? 'font-mono text-sm' : 'text-sm'}`}>
      {value || <span className='text-gray-50'>—</span>}
    </div>
  </div>
);

/** Section card */
export const SectionCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <div className='bg-surface border border-gray-10 rounded-xl p-6' style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
    <div className='flex items-center justify-between'>
      <h2 className='text-base font-semibold text-gray-100'>{title}</h2>
      {action}
    </div>
    <div className='mt-4'>
      {children}
    </div>
  </div>
);
