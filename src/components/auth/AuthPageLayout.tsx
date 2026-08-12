interface AuthPageLayoutProps {
  consoleTitle: string;
  title: string;
  rightHeadline: React.ReactNode;
  rightDescription: string;
  rightFeaturePills: string[];
  children: React.ReactNode;
}

export const AuthPageLayout = ({
  consoleTitle,
  title,
  rightHeadline,
  rightDescription,
  rightFeaturePills,
  children,
}: AuthPageLayoutProps) => {
  return (
    <div className='flex w-screen min-h-screen' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>

      <div className='relative flex flex-col w-full lg:max-w-[520px] min-h-screen bg-white px-10 lg:px-16 py-10 flex-shrink-0'>
        <img
          src='https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/logo/ZDNLcqHNzXS64lR9RoAUOZRugDNRoPzsjSdiODTYoMpVNq5qUD.png'
          alt='logo'
          width={180}
          height={45}
        />

        <div className='flex flex-col flex-1 justify-center max-w-[320px] gap-8'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-widest text-indigo mb-2'>{consoleTitle}</p>
            <h1 className='text-[32px] font-semibold tracking-tight text-gray-100 leading-tight'>
              {title}
            </h1>
          </div>

          {children}
        </div>
      </div>

      <div className='relative flex-1 min-h-screen overflow-hidden hidden lg:block' style={{ background: 'linear-gradient(135deg, #060e5c 0%, #0d2aad 60%, #1a45d4 100%)' }}>
        <div className='absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10' style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className='absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-10' style={{ background: 'radial-gradient(circle, #7eb3ff 0%, transparent 70%)' }} />

        <div className='relative flex flex-col h-full items-center justify-center px-16 gap-16'>
          <div className='text-center'>
            <h2 className='text-4xl font-bold text-white tracking-tight leading-tight mb-4'>
              {rightHeadline}
            </h2>
            <p className='text-white/70 text-base max-w-xs mx-auto leading-relaxed'>
              {rightDescription}
            </p>
          </div>

          <div className='w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-2.5 h-2.5 rounded-full bg-white/30' />
              <div className='h-2 w-24 rounded-full bg-white/20' />
              <div className='ml-auto h-2 w-12 rounded-full bg-white/20' />
            </div>
            <div className='grid grid-cols-3 gap-2'>
              {['Total Reserved', 'Used Storage', 'Remaining'].map((label) => (
                <div key={label} className='bg-white/10 rounded-xl p-3 flex flex-col gap-2'>
                  <div className='h-1.5 w-12 rounded-full bg-white/30' />
                  <div className='h-3 w-16 rounded-full bg-white/50' />
                  <div className='text-[10px] text-blue-100/70 leading-tight'>{label}</div>
                </div>
              ))}
            </div>
            <div className='flex flex-col gap-1.5'>
              <div className='h-2 w-full rounded-full bg-white/15' />
              {[0.8, 0.6, 0.9, 0.5].map((w, i) => (
                <div key={i} className='flex items-center gap-2'>
                  <div className='h-1.5 rounded-full bg-white/25' style={{ width: `${w * 100}%` }} />
                  <div className='h-1.5 w-8 rounded-full bg-white/15 ml-auto flex-shrink-0' />
                </div>
              ))}
            </div>
          </div>

          <div className='flex flex-wrap justify-center gap-2'>
            {rightFeaturePills.map((f) => (
              <span key={f} className='text-xs text-white/70 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full'>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
