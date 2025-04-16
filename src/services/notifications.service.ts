import { toast } from 'react-toastify'

export enum ToastType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Loading = 'loading',
}

export type ToastShowProps = {
  text: string
  duration?: number
}

const notificationsService = {
  success: ({ text, duration = 3000 }: ToastShowProps) => {
    toast.success(text, {
      hideProgressBar: true,
      autoClose: duration,
      position: 'bottom-center',
      theme: 'colored',
      icon: false,
    })
  },
  error: ({ text, duration = 3000 }: ToastShowProps) => {
    toast.error(text, {
      hideProgressBar: true,
      autoClose: duration,
      position: 'bottom-center',
      theme: 'colored',
    })
  },
  dismiss: toast.dismiss(),
}

export default notificationsService
