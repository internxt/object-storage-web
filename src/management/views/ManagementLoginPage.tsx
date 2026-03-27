import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import TextInput from '../../components/auth/TextInput';
import PasswordInput, { IFormValues } from '../../components/PasswordInput';
import Button from '../../components/Button';
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

  return (
    <div className='flex flex-col w-screen min-h-screen items-center justify-center bg-gray-50'>
      <div className='flex flex-col w-full bg-white p-10 rounded-md gap-5 max-w-[440px] items-center shadow-sm'>
        <img
          src='https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/logo/ZDNLcqHNzXS64lR9RoAUOZRugDNRoPzsjSdiODTYoMpVNq5qUD.png'
          alt='logo'
          width={240}
          height={60}
        />
        <h1 className='text-lg font-medium text-center'>Management Console</h1>
        <form className='flex flex-col w-full gap-4' onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            placeholder='Email'
            inputDataCy='emailInput'
            label='email'
            type='email'
            register={register}
            minLength={{ value: 1, message: 'Email must not be empty' }}
            error={errors.email}
          />
          <PasswordInput
            placeholder='Password'
            inputDataCy='passwordInput'
            label='password'
            register={register}
            required={true}
            minLength={{ value: 1, message: 'Password must not be empty' }}
            error={errors.password}
          />
          {loginError && (
            <div className='flex flex-row items-start pt-1'>
              <div className='flex h-5 flex-row items-center'>
                <WarningCircle weight='fill' className='mr-1 h-4 text-red' />
              </div>
              <span className='font-base w-56 text-sm text-red'>{loginError}</span>
            </div>
          )}
          <Button disabled={!isValid || isLoggingIn} loading={isLoggingIn} type='submit'>
            <p className='text-white font-medium'>Sign in</p>
          </Button>
        </form>
      </div>
    </div>
  );
};
