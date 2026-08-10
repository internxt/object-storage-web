import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  TrashIcon,
  PencilSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react'
import { partnersService, PartnerMember } from '../services/partners.service'
import { exportAsCSV } from '../../utils/exportUtils'
import notificationsService from '../../services/notifications.service'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Dialog from '../../components/Dialog'
import { T, text, form } from '../../sub-account/tokens'
import { BrandingTab } from '../components/BrandingTab'

// ─── Shared atoms (mirrors SubAccountSettingsPage design) ─────────────────────

const ReadField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p style={{ ...text.label, marginBottom: 6 }}>{label}</p>
    <div
      style={{
        minHeight: 40,
        background: T.gray5,
        border: `1px solid ${T.gray20}`,
        borderRadius: 8,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        color: T.gray80,
        fontSize: 14,
      }}
    >
      {value || <span style={{ color: T.gray50 }}>—</span>}
    </div>
  </div>
)

const PasswordField = ({
  label,
  placeholder = '',
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
}) => {
  const [show, setShow] = useState(false)
  return (
    <div>
      <p style={{ ...text.label, marginBottom: 6 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            background: T.gray5,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '0 40px 0 12px',
            fontSize: 14,
            color: T.gray80,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: T.gray50,
            cursor: 'pointer',
          }}
        >
          {show ? <EyeIcon size={16} /> : <EyeSlashIcon size={16} />}
        </button>
      </div>
    </div>
  )
}

const AvatarSquare = ({ initials }: { initials: string }) => (
  <div
    style={{
      width: 132,
      height: 132,
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 48,
      fontWeight: 700,
      userSelect: 'none',
      flexShrink: 0,
      background: T.primary,
      color: T.white,
    }}
  >
    {initials}
  </div>
)

function avatarInitials(email: string | null | undefined): string {
  if (!email) return '—'
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

const SectionCard = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) => (
  <div
    style={{
      background: T.white,
      border: `1px solid ${T.gray20}`,
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h2
          style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    <div style={{ marginTop: 16 }}>{children}</div>
  </div>
)

const validatePassword = (p: string) => {
  const errs: string[] = []
  if (p.length < 6) errs.push('At least 6 characters')
  if (!/[a-z]/.test(p)) errs.push('At least one lowercase letter')
  if (!/[A-Z]/.test(p)) errs.push('At least one uppercase letter')
  if (!/\d/.test(p)) errs.push('At least one digit')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p))
    errs.push('At least one special character')
  return errs
}

const MAX_EXPORT_RANGE_DAYS = 40

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const ProfileTab = () => {
  const [profile, setProfile] = useState<{
    name: string | null
    email: string | null
    createdAt: string
  } | null>(null)

  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({ newPwd: false, confirm: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    partnersService
      .getMe()
      .then(setProfile)
      .catch(() => {})
  }, [])

  const policyErrors = touched.newPwd ? validatePassword(newPwd) : []
  const sameAsCurrent =
    touched.newPwd && newPwd.length > 0 && newPwd === current
  const mismatch = touched.confirm && confirm.length > 0 && newPwd !== confirm
  const isValid =
    current.length > 0 &&
    newPwd.length > 0 &&
    confirm.length > 0 &&
    validatePassword(newPwd).length === 0 &&
    !sameAsCurrent &&
    newPwd === confirm

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ newPwd: true, confirm: true })
    if (!isValid) return
    setSaving(true)
    try {
      await partnersService.changePassword(current, newPwd)
      notificationsService.success({ text: 'Password changed successfully' })
      setCurrent('')
      setNewPwd('')
      setConfirm('')
      setTouched({ newPwd: false, confirm: false })
    } catch (err: any) {
      notificationsService.error({
        text:
          err?.response?.status === 403
            ? 'Current password is incorrect'
            : 'Failed to change password',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionCard title="Profile">
        <div style={{ display: 'flex', gap: 32 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AvatarSquare initials={avatarInitials(profile?.email)} />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <ReadField label="Name" value={profile?.name ?? ''} />
            <ReadField label="Email" value={profile?.email ?? ''} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Change password">
        <form
          onSubmit={handleChangePassword}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <PasswordField
            label="Old password"
            value={current}
            onChange={setCurrent}
          />
          <PasswordField
            label="New password"
            placeholder="At least 6 characters"
            value={newPwd}
            onChange={(v) => {
              setNewPwd(v)
              setTouched((t) => ({ ...t, newPwd: true }))
            }}
          />
          {sameAsCurrent && (
            <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
              New password must differ from current
            </p>
          )}
          {!sameAsCurrent && policyErrors.length > 0 && (
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                margin: 0,
                padding: 0,
                listStyle: 'none',
              }}
            >
              {policyErrors.map((e) => (
                <li key={e} style={{ fontSize: 12, color: T.red }}>
                  · {e}
                </li>
              ))}
            </ul>
          )}
          <PasswordField
            label="Confirm new password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v)
              setTouched((t) => ({ ...t, confirm: true }))
            }}
          />
          {mismatch && (
            <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
              Passwords do not match
            </p>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <button
              type="submit"
              disabled={saving || !isValid}
              style={{
                height: 40,
                padding: '0 16px',
                background: T.primary,
                color: T.white,
                border: 'none',
                borderRadius: 8,
                cursor: saving || !isValid ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: saving || !isValid ? 0.4 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}

// ─── Usage Tab ────────────────────────────────────────────────────────────────

const UsageTab = () => {
  const [profile, setProfile] = useState<{ createdAt: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFrom, setExportFrom] = useState(() =>
    dayjs().startOf('month').format('YYYY-MM-DD'),
  )
  const [exportTo, setExportTo] = useState(() => dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    partnersService
      .getMe()
      .then(setProfile)
      .catch(() => {})
  }, [])

  const handleExportUsages = async () => {
    setIsExporting(true)
    try {
      const data = await partnersService.exportDailyUsage({
        startDate: exportFrom,
        endDate: exportTo,
      })
      exportAsCSV(
        data as unknown as Record<string, unknown>[],
        new Set(['usageGb']),
        `partner_usage_export_${exportFrom}_to_${exportTo}`,
      )
    } catch (err) {
      notificationsService.error({ text: (err as Error).message })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <SectionCard
      title="Export Usage"
      subtitle="Download your global daily usage as a CSV file (max. 40 days)"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="date"
          value={exportFrom}
          min={profile?.createdAt?.slice(0, 10)}
          max={dayjs(exportTo).subtract(1, 'day').format('YYYY-MM-DD')}
          onChange={(e) => {
            const newFrom = e.target.value
            setExportFrom(newFrom)
            if (
              dayjs(exportTo).diff(dayjs(newFrom), 'day') >
              MAX_EXPORT_RANGE_DAYS
            ) {
              setExportTo(
                dayjs(newFrom)
                  .add(MAX_EXPORT_RANGE_DAYS, 'day')
                  .format('YYYY-MM-DD'),
              )
            }
          }}
          style={{
            height: 40,
            background: T.white,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '0 12px',
            fontSize: 14,
            color: T.gray80,
            outline: 'none',
          }}
        />
        <span style={{ fontSize: 13, color: T.gray50 }}>–</span>
        <input
          type="date"
          value={exportTo}
          min={dayjs(exportFrom).add(1, 'day').format('YYYY-MM-DD')}
          max={dayjs().format('YYYY-MM-DD')}
          onChange={(e) => setExportTo(e.target.value)}
          style={{
            height: 40,
            background: T.white,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '0 12px',
            fontSize: 14,
            color: T.gray80,
            outline: 'none',
          }}
        />
        <button
          onClick={handleExportUsages}
          disabled={isExporting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 16px',
            background: T.primary,
            color: T.white,
            border: 'none',
            borderRadius: 8,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            opacity: isExporting ? 0.4 : 1,
          }}
        >
          <DownloadSimpleIcon size={15} />
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

const PER_PAGE = 20

const MembersTab = () => {
  const [members, setMembers] = useState<PartnerMember[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [editTarget, setEditTarget] = useState<PartnerMember | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<PartnerMember | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      setMembers(await partnersService.listMembers())
    } catch (e: any) {
      notificationsService.error({ text: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  const handleCreate = async () => {
    setCreateLoading(true)
    try {
      await partnersService.createMember(createEmail, createPassword)
      notificationsService.success({ text: 'Member account created' })
      setCreateOpen(false)
      setCreateEmail('')
      setCreatePassword('')
      fetch()
    } catch (e: any) {
      notificationsService.error({ text: e.message })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      const dto: { email?: string; newPassword?: string } = {}
      if (editEmail && editEmail !== editTarget.email) dto.email = editEmail
      if (editPassword) dto.newPassword = editPassword
      await partnersService.updateMember(editTarget.id, dto)
      notificationsService.success({ text: 'Member updated' })
      setEditTarget(null)
      fetch()
    } catch (e: any) {
      notificationsService.error({ text: e.message })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await partnersService.deleteMember(deleteTarget.id)
      notificationsService.success({ text: 'Member deleted' })
      setDeleteTarget(null)
      fetch()
    } catch (e: any) {
      notificationsService.error({ text: e.message })
    } finally {
      setDeleteLoading(false)
    }
  }

  const paged = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(members.length / PER_PAGE)
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1

  return (
    <SectionCard
      title="Member Accounts"
      subtitle="Read-only access to sub-accounts and usage data"
      action={
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            padding: '0 18px',
            background: T.primary,
            color: T.white,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <PlusIcon size={14} weight="bold" />
          Add member
        </button>
      }
    >
      {loading ? (
        <p style={{ fontSize: 14, color: T.gray50 }}>Loading...</p>
      ) : members.length === 0 ? (
        <p style={{ fontSize: 14, color: T.gray50 }}>No member accounts yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderTop: `1px solid ${T.gray20}`,
                borderBottom: `1px solid ${T.gray20}`,
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 0',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: T.gray60,
                }}
              >
                Email
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 0',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: T.gray60,
                }}
              >
                Created
              </th>
              <th style={{ width: 100 }} />
            </tr>
          </thead>
          <tbody>
            {paged.map((m) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${T.gray15}` }}>
                <td
                  style={{ padding: '14px 0', fontSize: 14, color: T.gray100 }}
                >
                  {m.email}
                </td>
                <td
                  style={{
                    padding: '14px 0',
                    fontSize: 13,
                    color: T.gray50,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td style={{ padding: '14px 0' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditTarget(m)
                        setEditEmail(m.email)
                        setEditPassword('')
                      }}
                      title="Edit member"
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                      <PencilSimpleIcon size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      title="Delete member"
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        color: T.gray50,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = T.red
                        e.currentTarget.style.background = T.gray10
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = T.gray50
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${T.gray15}`,
          }}
        >
          <span style={{ fontSize: 13, color: T.gray50 }}>
            {members.length} members
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              style={{
                height: 32,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 500,
                color: T.gray80,
                border: `1px solid ${T.gray20}`,
                borderRadius: 8,
                background: T.white,
                cursor: hasPrev ? 'pointer' : 'not-allowed',
                opacity: hasPrev ? 1 : 0.4,
              }}
            >
              Prev
            </button>
            <span style={{ padding: '0 8px', fontSize: 13, color: T.gray50 }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              style={{
                height: 32,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 500,
                color: T.gray80,
                border: `1px solid ${T.gray20}`,
                borderRadius: 8,
                background: T.white,
                cursor: hasNext ? 'pointer' : 'not-allowed',
                opacity: hasNext ? 1 : 0.4,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            paddingTop: 4,
          }}
        >
          <p style={{ ...text.heading, margin: 0 }}>Add Member Account</p>
          <p
            style={{
              fontSize: 12,
              color: T.gray60,
              background: T.gray5,
              borderRadius: 8,
              padding: '8px 12px',
              margin: 0,
            }}
          >
            Member accounts have{' '}
            <span style={{ fontWeight: 500, color: T.gray80 }}>read-only</span>{' '}
            access — they can view usage and export CSV, but cannot create or
            modify accounts.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>Email</label>
            <Input
              value={createEmail}
              onChange={setCreateEmail}
              placeholder="member@example.com"
              variant="email"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>Password</label>
            <Input
              value={createPassword}
              onChange={setCreatePassword}
              placeholder="Min. 8 characters"
              variant="password"
            />
          </div>
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
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                createLoading || !createEmail || createPassword.length < 8
              }
              loading={createLoading}
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            paddingTop: 4,
          }}
        >
          <p style={{ ...text.heading, margin: 0 }}>
            Edit member — {editTarget?.email}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>Email</label>
            <Input value={editEmail} onChange={setEditEmail} variant="email" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>New password</label>
            <Input
              value={editPassword}
              onChange={setEditPassword}
              placeholder="Leave blank to keep current"
              variant="password"
            />
          </div>
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
              onClick={() => setEditTarget(null)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                editLoading ||
                !editEmail ||
                (editEmail === editTarget?.email && !editPassword) ||
                (!!editPassword && editPassword.length < 8)
              }
              loading={editLoading}
              onClick={handleUpdate}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onPrimaryAction={handleDelete}
        onSecondaryAction={() => setDeleteTarget(null)}
        isLoading={deleteLoading}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete member account?"
        subtitle={`This will permanently remove ${deleteTarget?.email}. They will no longer be able to log in.`}
      />
    </SectionCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'usage' | 'members' | 'branding'

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'usage', label: 'Usage' },
  { key: 'members', label: 'Members' },
  { key: 'branding', label: 'Branding' },
]

export const PartnersSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div
      style={{
        maxWidth: 920,
        margin: '0 auto',
        padding: '32px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div>
        <h1
          style={{ fontSize: 24, fontWeight: 600, color: T.gray100, margin: 0 }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 14, color: T.gray60, margin: '6px 0 0' }}>
          Manage your profile, usage and team.
        </p>
      </div>

      <div style={{ borderBottom: `1px solid ${T.gray20}` }}>
        <div style={{ display: 'flex' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 4px',
                margin: '0 12px',
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                borderBottom:
                  activeTab === tab.key
                    ? `2px solid ${T.primary}`
                    : '2px solid transparent',
                marginBottom: -1,
                color: activeTab === tab.key ? T.gray100 : T.gray60,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'usage' && <UsageTab />}
      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'branding' && <BrandingTab />}
    </div>
  )
}
