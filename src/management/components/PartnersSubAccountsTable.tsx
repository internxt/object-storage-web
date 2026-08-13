import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { DotsThree } from '@phosphor-icons/react'
import { SubAccount } from '../services/management.service'
import { SubAccountsTable, ColumnDef, SortOrder } from './SubAccountsTable'
import { ConfirmActionModal } from './ConfirmActionModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { T, shadow } from '../../sub-account/tokens'

interface Props {
  subAccounts: SubAccount[]
  onSuspend: (id: string) => void
  onReactivate: (id: string) => void
  onDelete: (id: string) => void
  onChangePassword: (id: string, newPassword: string) => Promise<void>
  isLoading: boolean
  pendingAccountId?: string | null
  sortOrder?: SortOrder
  onSortActiveStorage?: (order: SortOrder) => void
  readOnly?: boolean
}

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const formatStorage = (value?: number) => {
  if (value == null) return '—'
  if (value === 0) return <span style={{ color: T.gray80 }}>0.00</span>
  return value.toFixed(4)
}

const StatusBadge = ({ status }: { status: SubAccount['status'] }) => {
  if (!status) return null
  const config = {
    PAID_ACCOUNT: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      color: '#15803d',
      dot: '#22c55e',
      label: 'Paid',
    },
    SUSPENDED: {
      bg: '#f4f4f5',
      border: '#d4d4d8',
      color: '#52525b',
      dot: '#a1a1aa',
      label: 'Suspended',
    },
    DELETED: {
      bg: '#fef2f2',
      border: '#fecaca',
      color: '#b91c1c',
      dot: '#f87171',
      label: 'Deleted',
    },
  }[status]
  if (!config)
    return <span style={{ fontSize: 12, color: T.gray50 }}>{status}</span>
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: '4px 10px',
        borderRadius: 999,
        border: '1px solid',
        background: config.bg,
        borderColor: config.border,
        color: config.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          flexShrink: 0,
          background: config.dot,
        }}
      />
      {config.label}
    </span>
  )
}

const ActionsMenu = ({
  account,
  onSuspend,
  onReactivate,
  onDelete,
  onChangePassword,
}: {
  account: SubAccount
  onSuspend: (id: string) => void
  onReactivate: (id: string) => void
  onDelete: (id: string) => void
  onChangePassword: (id: string, newPassword: string) => Promise<void>
}) => {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const [confirmAction, setConfirmAction] = useState<
    'suspend' | 'reactivate' | 'delete' | null
  >(null)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const handleConfirm = () => {
    if (confirmAction === 'suspend') onSuspend(account.id)
    else if (confirmAction === 'reactivate') onReactivate(account.id)
    else if (confirmAction === 'delete') onDelete(account.id)
    setConfirmAction(null)
  }

  if (account.status === 'DELETED') return null

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          padding: 6,
          borderRadius: 8,
          color: T.gray50,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = T.gray80
          e.currentTarget.style.background = T.gray10
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = T.gray50
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <DotsThree size={17} weight="bold" />
      </button>
      {open &&
        createPortal(
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                position: 'fixed',
                top: coords.top,
                right: coords.right,
                background: T.white,
                border: `1px solid ${T.gray15}`,
                borderRadius: 12,
                boxShadow: shadow.lg,
                minWidth: 144,
                zIndex: 50,
                overflow: 'hidden',
                padding: '4px 0',
              }}
            >
              <button
                onClick={() => {
                  setChangePasswordOpen(true)
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  fontSize: 14,
                  color: T.gray80,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.gray5
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Change password
              </button>
              {account.status !== 'SUSPENDED' ? (
                <button
                  onClick={() => {
                    setConfirmAction('suspend')
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 16px',
                    fontSize: 14,
                    color: '#ef4444',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef2f2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => {
                    setConfirmAction('reactivate')
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 16px',
                    fontSize: 14,
                    color: '#059669',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ecfdf5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Reactivate
                </button>
              )}

              <div
                style={{ height: 1, background: T.gray15, margin: '4px 0' }}
              />
              <button
                onClick={() => {
                  setConfirmAction('delete')
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  fontSize: 14,
                  color: T.red,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Delete
              </button>
            </div>
          </>,
          document.body,
        )}
      <ConfirmActionModal
        isOpen={confirmAction === 'suspend'}
        title="Suspend account?"
        description="This will suspend the account and block access. You can reactivate it at any time."
        confirmLabel="Suspend"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction === 'reactivate'}
        title="Reactivate account?"
        description="This will restore access to the account."
        confirmLabel="Reactivate"
        variant="success"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction === 'delete'}
        title="Delete account permanently?"
        description="This will permanently delete the sub-account, its storage, and all its members. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        subtitle={account.email}
        onClose={() => setChangePasswordOpen(false)}
        onSubmit={(newPassword) => onChangePassword(account.id, newPassword)}
      />
    </div>
  )
}

export const PartnersSubAccountsTable = ({
  subAccounts,
  onSuspend,
  onReactivate,
  onDelete,
  onChangePassword,
  isLoading,
  pendingAccountId,
  sortOrder,
  onSortActiveStorage,
  readOnly = false,
}: Props) => {
  const navigate = useNavigate()

  const linkStyle: React.CSSProperties = {
    fontSize: 13,
    color: T.primary,
    textDecoration: 'underline',
    textUnderlineOffset: 2,
    cursor: 'pointer',
  }

  const columns: ColumnDef[] = [
    {
      header: 'Name',
      cell: (acc) => (
        <span
          onClick={() => navigate(`/partners/sub-accounts/${acc.id}`)}
          style={{
            ...linkStyle,
            fontFamily: 'monospace',
            letterSpacing: '-0.01em',
          }}
        >
          {acc.id.slice(0, 8)}…{acc.id.slice(-4)}
        </span>
      ),
    },
    {
      header: 'Account Email',
      cell: (acc) => (
        <span style={{ color: T.gray60, fontSize: 14 }}>{acc.email}</span>
      ),
    },
    {
      header: 'Active Storage (TB)',
      align: 'right',
      sortKey: 'activeStorage',
      cell: (acc) => (
        <span
          style={{
            fontSize: 14,
            color: T.gray80,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatStorage(acc.activeStorage)}
        </span>
      ),
    },
    {
      header: 'Deleted Storage (TB)',
      align: 'right',
      cell: (acc) => (
        <span
          style={{
            fontSize: 14,
            color: T.gray80,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatStorage(acc.deletedStorage)}
        </span>
      ),
    },
    {
      header: 'Created',
      cell: (acc) => (
        <span style={{ fontSize: 14, color: T.gray50, whiteSpace: 'nowrap' }}>
          {formatDate(acc.creationDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (acc) => <StatusBadge status={acc.status} />,
    },
    ...(!readOnly
      ? [
          {
            header: '',
            align: 'right' as const,
            cell: (acc: SubAccount) =>
              pendingAccountId === acc.id ? (
                <div
                  className="animate-spin"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `2px solid ${T.gray20}`,
                    borderTopColor: T.primary,
                    display: 'inline-block',
                  }}
                />
              ) : (
                <ActionsMenu
                  account={acc}
                  onSuspend={onSuspend}
                  onReactivate={onReactivate}
                  onDelete={onDelete}
                  onChangePassword={onChangePassword}
                />
              ),
          },
        ]
      : []),
  ]

  return (
    <SubAccountsTable
      subAccounts={subAccounts}
      columns={columns}
      isLoading={isLoading}
      sortOrder={sortOrder}
      onSortActiveStorage={onSortActiveStorage}
    />
  )
}
