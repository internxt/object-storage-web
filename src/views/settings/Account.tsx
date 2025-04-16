import { Controller, useForm } from 'react-hook-form'
import DefaultAvatar from '../../components/Avatar'
import Input from '../../components/Input'
import { Separator } from '../../components/Separator'
import { useUser } from '../../context/userContext'
import { User } from '../../services/user.service'
import { IFormValues } from '../../components/PasswordInput'
import TextInput from '../../components/auth/TextInput'
import notificationsService from '../../services/notifications.service'
import { authService } from '../../services/auth.service'

const AvatarComponent = () => (
  <div className="flex flex-col gap-2 w-max">
    <DefaultAvatar diameter={190} className="rounded-none" />
    <div className="flex flex-row gap-3 bg-[#F5F6F8] items-center justify-center">
      <div className="p-1 bg-blue-600" />
      <p className="text-gray-500 py-1">Active</p>
    </div>
  </div>
)

const UserSection = ({ user }: { user: User }) => (
  <div className="flex flex-col rounded-sm bg-white gap-7 p-7">
    <p className="text-xl font-semibold">Profile</p>
    <Separator />
    <div className="flex flex-row items-center gap-4">
      <AvatarComponent />
      <div className="flex flex-col w-full gap-5">
        <Input variant="email" disabled label="User Id" value={user?.id} />
        <Input variant="email" disabled label="Email" value={user?.email} />
        <Input
          variant="email"
          disabled
          label="Total Usage"
          value={user?.usage.toString()}
        />
      </div>
    </div>
  </div>
)

const ChangePasswordSection = () => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<IFormValues>()

  const newPassword = watch('newPassword')

  const onSubmit = async ({ newPassword }: IFormValues) => {
    try {
      await authService.changePassword(newPassword)
      notificationsService.success({
        text: 'Password changed successfully',
      })
      reset()
    } catch (error) {
      const err = error as Error
      console.error('ERROR WHILE CHANGING PASSWORD: ', error)
      notificationsService.error({
        text: err.message,
      })
    }
  }

  return (
    <div className="flex flex-col rounded-sm bg-white gap-7 p-7">
      <p className="text-xl font-semibold">Change Password</p>
      <Separator />
      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* New Password */}
        <TextInput
          type="password"
          label="newPassword"
          placeholder="New password"
          register={register}
          error={errors.newPassword}
        />

        {/* Repeat New Password */}
        <Controller
          name="repeatNewPassword"
          control={control}
          rules={{
            required: 'Please repeat your new password',
            validate: (value) =>
              value === newPassword || 'Passwords do not match',
          }}
          render={({ field, fieldState }) => (
            <>
              <TextInput
                {...field}
                type="password"
                placeholder="Repeat new password"
                error={errors.repeatNewPassword}
                label="repeatNewPassword"
                register={register}
              />
              {fieldState.error && (
                <p className="text-red-500">{fieldState.error.message}</p>
              )}
            </>
          )}
        />

        <button className="flex w-full items-center py-2 text-white bg-blue-500 rounded-sm justify-center">
          Change Password
        </button>
      </form>
    </div>
  )
}

export const AccountSettings = () => {
  const { user } = useUser()
  return (
    <section className="flex flex-col gap-10 min-h-screen">
      <UserSection user={user!} />
      <ChangePasswordSection />
    </section>
  )
}
