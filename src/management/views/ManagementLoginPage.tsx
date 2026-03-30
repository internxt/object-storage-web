import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import TextInput from '../../components/auth/TextInput';
import PasswordInput, { IFormValues } from '../../components/PasswordInput';
import { useManagement } from '../context/managementContext';

export const ManagementLoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logIn } = useManagement();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<IFormValues>({ mode: 'onChange' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/management/accounts', { replace: true });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (loginError) {
      const t = setTimeout(() => setLoginError(''), 4000);
      return () => clearTimeout(t);
    }
  }, [loginError]);

  const onSubmit = async (
    formData: { email: string; password: string },
    event: BaseSyntheticEvent<object, unknown, unknown> | undefined
  ) => {
    event?.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await logIn(formData.email, formData.password);
      navigate('/management/accounts');
    } catch {
      setLoginError('Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const inputClass = [
    '[&_input]:h-[52px]',
    '[&_input]:bg-[#f5f5f7]',
    '[&_input]:border-0',
    '[&_input]:rounded-xl',
    '[&_input]:px-5',
    '[&_input]:text-[15px]',
    '[&_input]:text-gray-900',
    '[&_input]:placeholder-gray-400',
    '[&_input]:outline-none',
    '[&_input]:ring-0',
    '[&_input]:transition-all',
    '[&_input:focus]:bg-[#ebebed]',
  ].join(' ');

  return (
    <div className='flex w-screen min-h-screen' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>

      {/* ── Left: form ── */}
      <div className='relative flex flex-col w-full lg:max-w-[520px] min-h-screen bg-white px-10 lg:px-16 py-10 flex-shrink-0'>
        <img
          src='https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/logo/ZDNLcqHNzXS64lR9RoAUOZRugDNRoPzsjSdiODTYoMpVNq5qUD.png'
          alt='logo'
          width={180}
          height={45}
        />

        <div className='flex flex-col flex-1 justify-center max-w-[320px] gap-8'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2'>Management Console</p>
            <h1 className='text-[32px] font-semibold tracking-tight text-gray-900 leading-tight'>
              Welcome back
            </h1>
          </div>

          <form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              placeholder='Email'
              inputDataCy='emailInput'
              label='email'
              type='email'
              register={register}
              minLength={{ value: 1, message: 'Email must not be empty' }}
              error={errors.email}
              className={inputClass}
            />
            <PasswordInput
              placeholder='Password'
              inputDataCy='passwordInput'
              label='password'
              register={register}
              required={true}
              minLength={{ value: 1, message: 'Password must not be empty' }}
              error={errors.password}
              className={inputClass}
            />

            {loginError && (
              <div className='flex items-center gap-1.5 px-1'>
                <WarningCircle weight='fill' className='h-3.5 w-3.5 text-red-500 flex-shrink-0' />
                <span className='text-[13px] text-red-500'>{loginError}</span>
              </div>
            )}

            <button
              type='submit'
              disabled={!isValid || isLoggingIn}
              className='mt-1 w-full h-[52px] rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-[15px] font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoggingIn ? 'Signing in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Right: brand panel ── */}
      <div className='relative flex-1 min-h-screen overflow-hidden hidden lg:block' style={{ background: 'linear-gradient(135deg, #060e5c 0%, #0d2aad 60%, #1a45d4 100%)' }}>
        {/* Decorative blobs */}
        <div className='absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10' style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className='absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-10' style={{ background: 'radial-gradient(circle, #7eb3ff 0%, transparent 70%)' }} />

        <div className='relative flex flex-col h-full items-center justify-center px-16 gap-16'>
          {/* Headline */}
          <div className='text-center'>
            <h2 className='text-4xl font-bold text-white tracking-tight leading-tight mb-4'>
              Object Storage<br />Management
            </h2>
            <p className='text-white/70 text-base max-w-xs mx-auto leading-relaxed'>
              Monitor usage, manage sub-accounts, and control your storage infrastructure from one place.
            </p>
          </div>

          {/* Mock dashboard card */}
          <div className='w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 flex flex-col gap-4'>
            {/* Fake nav bar */}
            <div className='flex items-center gap-2'>
              <div className='w-2.5 h-2.5 rounded-full bg-white/30' />
              <div className='h-2 w-24 rounded-full bg-white/20' />
              <div className='ml-auto h-2 w-12 rounded-full bg-white/20' />
            </div>
            {/* Fake stat cards */}
            <div className='grid grid-cols-3 gap-2'>
              {['Total Reserved', 'Used Storage', 'Remaining'].map((label) => (
                <div key={label} className='bg-white/10 rounded-xl p-3 flex flex-col gap-2'>
                  <div className='h-1.5 w-12 rounded-full bg-white/30' />
                  <div className='h-3 w-16 rounded-full bg-white/50' />
                  <div className='text-[10px] text-blue-100/70 leading-tight'>{label}</div>
                </div>
              ))}
            </div>
            {/* Fake table */}
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

          {/* Feature pills */}
          <div className='flex flex-wrap justify-center gap-2'>
            {['Sub-account management', 'Usage monitoring', 'Storage analytics'].map((f) => (
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
