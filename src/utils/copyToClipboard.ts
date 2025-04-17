import notificationsService from '../services/notifications.service'

export async function copyToClipboard(textToCopy: string) {
  try {
    await navigator.clipboard.writeText(textToCopy)
  } catch (error) {
    const err = error as Error

    notificationsService.error({
      text: err.message,
    })
  }
}
