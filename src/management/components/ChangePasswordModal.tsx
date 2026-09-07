import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import notificationsService from '../../services/notifications.service'
import { T, text, form } from '../../sub-account/tokens'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (newPassword: string) => Promise<void>
}

export const ChangePasswordModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setNewPassword('')
      setConfirmPassword('')
      setIsSaving(false)
    }
  }, [isOpen])

  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSaving(true)
    try {
      await onSubmit(newPassword)
      onClose()
    } catch (err) {
      notificationsService.error({ text: (err as Error).message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          paddingTop: 4,
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ ...text.heading, margin: 0 }}>Change password</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>New password</label>
          <Input
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
            variant="password"
            className="!text-sm"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Confirm password</label>
          <Input
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat new password"
            variant="password"
          />
        </div>
        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
            Passwords do not match
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            paddingTop: 4,
          }}
        >
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isSaving}
            loading={isSaving}
            onClick={handleSubmit}
          >
            Change password
          </Button>
        </div>
      </div>
    </Modal>
  )
}
