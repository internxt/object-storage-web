import { useEffect, useState } from 'react'
import { partnersService } from '../services/partners.service'
import notificationsService from '../../services/notifications.service'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { T, form } from '../../sub-account/tokens'

interface TwoFactorSetupFormProps {
  onComplete: () => void
  onCancel?: () => void
}

export const TwoFactorSetupForm = ({ onComplete, onCancel }: TwoFactorSetupFormProps) => {
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [code, setCode] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    partnersService
      .getTwoFactorSetup()
      .then(setSetupData)
      .catch((err) => {
        notificationsService.error({ text: (err as Error).message })
        setLoadError(true)
      })
  }, [])

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await partnersService.enableTwoFactor(code)
      notificationsService.success({ text: 'Two-factor authentication enabled' })
      onComplete()
    } catch {
      notificationsService.error({ text: 'Invalid code' })
    } finally {
      setConfirming(false)
    }
  }

  if (loadError) {
    return (
      <p style={{ fontSize: 13, color: T.red, margin: 0 }}>
        Failed to load the setup information. Please try again.
      </p>
    )
  }

  if (!setupData) {
    return <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>Loading…</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
        Scan this QR code with your authenticator app (Google Authenticator, Authy, ...).
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img src={setupData.qrCode} alt="2FA QR code" width={180} height={180} />
      </div>
      <div>
        <p style={{ ...form.label, marginBottom: 6 }}>Or enter this code manually</p>
        <div
          style={{
            background: T.gray5,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: T.gray80,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            userSelect: 'all',
          }}
        >
          {setupData.secret}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={form.label}>Enter the 6-digit code</label>
        <Input value={code} onChange={setCode} placeholder="123456" variant="default" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        {onCancel && (
          <Button variant="secondary" type="button" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
        )}
        <Button type="button" disabled={confirming || code.length !== 6} loading={confirming} onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  )
}
