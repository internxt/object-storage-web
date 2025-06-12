import { useForm } from 'react-hook-form';
import PasswordInput, { IFormValues } from '../components/PasswordInput';
import TextInput from '../components/auth/TextInput';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { localStorageService } from '../services/localStorage.service';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import Button from '../components/Button';
import { WarningCircle } from '@phosphor-icons/react';
import { useUser } from '../context/userContext';
// import { userService } from '../services/user.service'; // Temporarily commented out - not needed during login

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<IFormValues>({
    mode: 'onChange',
  });
  const [isLoggingUser, setIsLoggingUser] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>();

  useEffect(() => {
    const userToken = localStorageService.getUserToken();

    if (userToken) {
      navigate('/buckets', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (loginError) {
      setTimeout(() => {
        setLoginError('');
      }, 4000);
    }
  }, [loginError]);

  const onSubmit = async (
    formData: { email: string; password: string },
    event: BaseSyntheticEvent<object, unknown, unknown> | undefined
  ) => {
    event?.preventDefault();
    const { email, password } = formData;
    setLoginError('');

    try {
      setIsLoggingUser(true);
      const logIn = await authService.logIn(email, password);

      if (logIn.token) {
        localStorageService.setUserToken(logIn.token);

        // TODO: Temporarily commented out
        // const userData = await userService.getUserData();
        // setUser(userData);

        setUser({
          email: email,
          id: 'temp-id',
          usage: 0,
        });
      }

      navigate('/buckets');
    } catch (error) {
      // Handle error
      console.error('Error logging in', error);
      setLoginError('Invalid credentials');
    } finally {
      setIsLoggingUser(false);
    }
  };

  return (
    <div className='flex flex-col w-screen min-h-screen items-center justify-center'>
      <div className='flex flex-col w-full bg-white p-10 rounded-md gap-5 max-w-[440px] items-center'>
        <img
          src='https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/logo/ZDNLcqHNzXS64lR9RoAUOZRugDNRoPzsjSdiODTYoMpVNq5qUD.png'
          alt='Internxt logo'
          width={240}
          height={60}
        />
        <h1 className='text-lg font-medium text-center'>
          Object Storage Console
        </h1>
        <form
          className='flex flex-col w-full gap-4'
          onSubmit={handleSubmit(onSubmit)}
        >
          <TextInput
            placeholder={'Email or Username'}
            inputDataCy='emailInput'
            label='email'
            type='email'
            register={register}
            minLength={{ value: 1, message: 'Email must not be empty' }}
            error={errors.email}
          />

          <PasswordInput
            placeholder={'Password'}
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
              <span className='font-base w-56 text-sm text-red'>
                {loginError}
              </span>
            </div>
          )}
          <Button
            disabled={!isValid || isLoggingUser}
            loading={isLoggingUser}
            type='submit'
          >
            <p className='text-white font-medium'>Sign in</p>
          </Button>
        </form>
      </div>
    </div>
  );
};
