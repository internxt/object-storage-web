import { useEffect, useState } from 'react'
import { WarningCircleIcon } from '@phosphor-icons/react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import notificationsService from '../../services/notifications.service'
import { T, text, form } from '../../sub-account/tokens'
import { passwordPolicyErrors } from '../../utils/passwordPolicy'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (newPassword: string) => Promise<void>
}

const MIN_PASSWORD_LENGTH = 8

export const ChangePasswordModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setNewPassword('')
      setConfirmPassword('')
      setIsSaving(false)
      setTouched(false)
    }
  }, [isOpen])

  const policyErrors = passwordPolicyErrors(newPassword, MIN_PASSWORD_LENGTH)
  const showPolicyErrors = touched && policyErrors.length > 0
  const canSubmit = policyErrors.length === 0 && newPassword === confirmPassword

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
          textAlign: 'left',
        }}
      >
        <p style={{ ...text.heading, margin: 0 }}>Change password</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>New password</label>
          <Input
            autoComplete="new-password"
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v)
              setTouched(true)
            }}
            placeholder="At least 8 characters"
            variant="password"
            accent={showPolicyErrors ? 'error' : undefined}
            className="!text-sm"
          />
          {showPolicyErrors && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                marginTop: 8,
                padding: 8,
                borderRadius: 6,
                background: 'rgba(224,49,49,0.1)',
                border: `1px solid ${T.red}`,
              }}
            >
              <WarningCircleIcon
                size={16}
                color={T.red}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div style={{ fontSize: 12, color: T.red }}>
                <p style={{ fontWeight: 500, margin: '0 0 4px' }}>
                  Password must contain:
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {policyErrors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Confirm password</label>
          <Input
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat new password"
            variant="password"
            accent={
              confirmPassword.length > 0 && newPassword !== confirmPassword
                ? 'error'
                : undefined
            }
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
