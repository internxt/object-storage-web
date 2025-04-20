import { useForm } from 'react-hook-form'
import PasswordInput, { IFormValues } from '../components/PasswordInput'
import TextInput from '../components/auth/TextInput'
import { authService } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'
import { localStorageService } from '../services/localStorage.service'
import { useEffect } from 'react'

export const LoginPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const useToken = localStorageService.getUserToken()

    if (useToken) {
      navigate('/buckets', { replace: true })
    }
  }, [])

  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<IFormValues>({
    mode: 'onChange',
  })

  const onSubmit = async (
    formData: { email: string; password: string },
    event
  ) => {
    event?.preventDefault()
    const { email, password } = formData

    try {
      const logIn = await authService.logIn(email, password)

      if (logIn.token) {
        localStorageService.setUserToken(logIn.token)
      }

      navigate('/buckets')
    } catch (error) {
      // Handle error
      console.error('Error logging in', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <div className="flex flex-col bg-white p-5 rounded-sm gap-5 max-w-[440px] w-full items-center">
        <img
          src="https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/logo/ZDNLcqHNzXS64lR9RoAUOZRugDNRoPzsjSdiODTYoMpVNq5qUD.png"
          alt="Internxt logo"
          width={240}
          height={60}
        />
        <h1 className="text-lg font-medium text-center">
          Object Storage Console
        </h1>
        <form
          className="flex flex-col w-full gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <TextInput
            placeholder={'Email or Username'}
            inputDataCy="emailInput"
            label="email"
            type="email"
            register={register}
            minLength={{ value: 1, message: 'Email must not be empty' }}
            error={errors.email}
          />

          <PasswordInput
            placeholder={'Password'}
            inputDataCy="passwordInput"
            label="password"
            register={register}
            required={true}
            minLength={{ value: 1, message: 'Password must not be empty' }}
            error={errors.password}
          />
          <button className="flex w-full py-2 items-center justify-center bg-primary rounded-sm">
            <p className="text-white font-medium">Sign in</p>
          </button>
        </form>
      </div>
    </div>
  )
}
