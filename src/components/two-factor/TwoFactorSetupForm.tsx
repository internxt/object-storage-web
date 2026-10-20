import { useEffect, useState } from 'react'
import { TwoFactorCodeInput, TWO_FACTOR_CODE_LENGTH } from './TwoFactorCodeInput'
import Button from '../Button'
import { T, form } from '../../sub-account/tokens'

export interface TwoFactorSetupFormLabels {
  scanInstructions: string
  qrCodeAlt: string
  manualEntry: string
  codeLabel: string
  codePlaceholder: string
  loading: string
  loadFailed: string
  cancel: string
  confirm: string
}

interface TwoFactorSetupFormProps {
  labels: TwoFactorSetupFormLabels
  getSetup: () => Promise<{ secret: string; qrCode: string }>
  enable: (code: string) => Promise<void>
  errorMessage: (err: unknown) => string
  onComplete: () => void
  onCancel?: () => void
}

export const TwoFactorSetupForm = ({
  labels,
  getSetup,
  enable,
  errorMessage,
  onComplete,
  onCancel,
}: TwoFactorSetupFormProps) => {
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [confirmError, setConfirmError] = useState<string>()
  const [code, setCode] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getSetup()
      .then(setSetupData)
      .catch(() => setLoadFailed(true))
  }, [])

  const handleConfirm = async () => {
    setConfirming(true)
    setConfirmError(undefined)
    try {
      await enable(code)
      onComplete()
    } catch (err) {
      setConfirmError(errorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  if (loadFailed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{labels.loadFailed}</p>
        {onCancel && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={onCancel}>
              {labels.cancel}
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (!setupData) {
    return <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>{labels.loading}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>{labels.scanInstructions}</p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img src={setupData.qrCode} alt={labels.qrCodeAlt} width={180} height={180} />
      </div>
      <div>
        <p style={{ ...form.label, marginBottom: 6 }}>{labels.manualEntry}</p>
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
        <label style={form.label}>{labels.codeLabel}</label>
        <TwoFactorCodeInput value={code} onChange={setCode} placeholder={labels.codePlaceholder} error={confirmError} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        {onCancel && (
          <Button variant="secondary" type="button" onClick={onCancel} disabled={confirming}>
            {labels.cancel}
          </Button>
        )}
        <Button type="button" disabled={confirming || code.length !== TWO_FACTOR_CODE_LENGTH} loading={confirming} onClick={handleConfirm}>
          {labels.confirm}
        </Button>
      </div>
    </div>
  )
}
