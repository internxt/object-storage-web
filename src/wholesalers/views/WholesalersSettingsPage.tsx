import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  EyeSlash,
  PlusIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { WholesalersTwoFactorSetupForm } from "../components/WholesalersTwoFactorSetupForm";
import {
  wholesalersService,
  WholesalerMember,
} from "../services/wholesalers.service";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useWholesalers } from "../context/wholesalersContext";
import { ConfirmActionModal } from "../../management/components/ConfirmActionModal";
import notificationsService from "../../services/notifications.service";
import { passwordPolicyErrors } from "../../utils/passwordPolicy";
import {
  MIN_MEMBER_PASSWORD_LENGTH,
  MemberEmailField,
  MemberPasswordField,
  PasswordRequirements,
  memberEmailError,
  memberPasswordError,
} from "../../components/MemberCredentialFields";
import { apiErrorMessage } from "../../utils/apiError";
import { T, text, shadow } from "../../sub-account/tokens";

const SectionCard = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    style={{
      background: T.white,
      border: `1px solid ${T.gray20}`,
      borderRadius: 12,
      padding: 24,
      boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.gray50, margin: "2px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    <div style={{ marginTop: 16 }}>{children}</div>
  </div>
);

const ReadField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p style={{ ...text.label, marginBottom: 6 }}>{label}</p>
    <div
      style={{
        height: 40,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        background: T.gray5,
        border: `1px solid ${T.gray20}`,
        borderRadius: 8,
        fontSize: 14,
        color: T.gray80,
      }}
    >
      {value || "—"}
    </div>
  </div>
);

const PasswordField = ({
  label,
  placeholder = "",
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <p style={{ ...text.label, marginBottom: 6 }}>{label}</p>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: 40,
            background: T.gray5,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: "0 40px 0 12px",
            fontSize: 14,
            color: T.gray80,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: T.gray50,
            cursor: "pointer",
          }}
        >
          {show ? <Eye size={16} /> : <EyeSlash size={16} />}
        </button>
      </div>
    </div>
  );
};

const Pill = ({ label, tone }: { label: string; tone: "green" | "gray" }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      background: tone === "green" ? "rgba(16,185,129,0.12)" : T.gray10,
      color: tone === "green" ? "#10b981" : T.gray60,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: tone === "green" ? "#10b981" : T.gray50,
        flexShrink: 0,
      }}
    />
    {label}
  </span>
);

const TwoFactorCard = () => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    wholesalersService
      .getTwoFactorStatus()
      .then(({ enabled }) => setIsEnabled(enabled))
      .catch(() => setIsEnabled(null));
  }, []);

  const closeDisable = () => {
    setIsDisableOpen(false);
    setDisablePassword('');
    setDisableCode('');
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      await wholesalersService.disableTwoFactor(disablePassword, disableCode);
      notificationsService.success({ text: 'Two-factor authentication disabled' });
      setIsEnabled(false);
      closeDisable();
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Invalid password or code') });
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <SectionCard
      title='Two-factor authentication'
      subtitle='Add an extra layer of security using an authenticator app'
      action={isEnabled ? <Pill label='Enabled' tone='green' /> : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isEnabled !== null &&
          (isEnabled ? (
            <Button variant='secondary' onClick={() => setIsDisableOpen(true)}>
              Disable 2FA
            </Button>
          ) : (
            <Button onClick={() => setIsSetupOpen(true)}>Enable 2FA</Button>
          ))}
      </div>

      <Modal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>Enable two-factor authentication</p>
          {isSetupOpen && (
            <WholesalersTwoFactorSetupForm
              onComplete={() => {
                setIsSetupOpen(false);
                setIsEnabled(true);
              }}
              onCancel={() => setIsSetupOpen(false)}
            />
          )}
        </div>
      </Modal>

      <Modal isOpen={isDisableOpen} onClose={closeDisable}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>Disable two-factor authentication</p>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            Confirm your password and a current code from your authenticator app.
          </p>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Password</p>
            <Input value={disablePassword} onChange={setDisablePassword} variant='password' />
          </div>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>6-digit code</p>
            <Input value={disableCode} onChange={setDisableCode} placeholder='123456' maxLength={6} variant='default' />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button variant='secondary' type='button' onClick={closeDisable} disabled={isDisabling}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleDisable}
              disabled={isDisabling || !disablePassword || disableCode.length !== 6}
              loading={isDisabling}
            >
              Disable
            </Button>
          </div>
        </div>
      </Modal>
    </SectionCard>
  );
};

const MemberActionsMenu = ({
  member,
  onEdit,
  onDelete,
  onDisableTwoFactor,
  onResetTwoFactor,
}: {
  member: WholesalerMember;
  onEdit: () => void;
  onDelete: () => void;
  onDisableTwoFactor: () => void;
  onResetTwoFactor: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const itemStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "8px 16px",
    fontSize: 14,
    color: T.gray80,
    background: "transparent",
    border: "none",
    cursor: "pointer",
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Actions"
        style={{
          padding: 6,
          borderRadius: 8,
          color: T.gray50,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = T.gray80;
          e.currentTarget.style.background = T.gray10;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = T.gray50;
          e.currentTarget.style.background = "transparent";
        }}
      >
        <DotsThreeIcon size={18} weight="bold" />
      </button>
      {open &&
        createPortal(
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                position: "fixed",
                top: coords.top,
                right: coords.right,
                background: T.white,
                border: `1px solid ${T.gray15}`,
                borderRadius: 12,
                boxShadow: shadow.lg,
                minWidth: 160,
                zIndex: 50,
                overflow: "hidden",
                padding: "4px 0",
              }}
            >
              <button
                style={itemStyle}
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.gray5)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Edit
              </button>

              {member.twoFactorEnabled && (
                <>
                  <div style={{ height: 1, background: T.gray15, margin: "4px 0" }} />
                  <button
                    style={itemStyle}
                    onClick={() => {
                      setOpen(false);
                      onResetTwoFactor();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.gray5)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Reset 2FA
                  </button>
                  <button
                    style={itemStyle}
                    onClick={() => {
                      setOpen(false);
                      onDisableTwoFactor();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.gray5)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Disable 2FA
                  </button>
                </>
              )}

              <div style={{ height: 1, background: T.gray15, margin: "4px 0" }} />
              <button
                style={{ ...itemStyle, color: T.red }}
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Delete
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

const PER_PAGE = 20;

const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const headerCell = {
  textAlign: "left" as const,
  padding: "12px 0",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: T.gray60,
};

const MembersCard = () => {
  const [members, setMembers] = useState<WholesalerMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<WholesalerMember | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<WholesalerMember | null>(
    null,
  );
  const [tfaTarget, setTfaTarget] = useState<{
    member: WholesalerMember;
    action: "disable" | "reset";
  } | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      setMembers(await wholesalersService.listMembers());
    } catch (err) {
      notificationsService.error({
        text: apiErrorMessage(err, "Failed to load members"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const closeCreate = () => {
    setIsCreateOpen(false);
    setCreateEmail("");
    setCreatePassword("");
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await wholesalersService.createMember(createEmail, createPassword);
      notificationsService.success({ text: "Member created" });
      closeCreate();
      fetchMembers();
    } catch (err) {
      notificationsService.error({
        text: apiErrorMessage(err, "Failed to create member"),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (member: WholesalerMember) => {
    setEditTarget(member);
    setEditEmail(member.email);
    setEditPassword("");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsEditing(true);
    try {
      const changes: { email?: string; newPassword?: string } = {};
      if (editEmail && editEmail !== editTarget.email)
        changes.email = editEmail;
      if (editPassword) changes.newPassword = editPassword;
      await wholesalersService.updateMember(editTarget.id, changes);
      notificationsService.success({ text: "Member updated" });
      setEditTarget(null);
      fetchMembers();
    } catch (err) {
      notificationsService.error({
        text: apiErrorMessage(err, "Failed to update member"),
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleTwoFactorAction = async () => {
    if (!tfaTarget) return;
    try {
      await wholesalersService.updateMemberTwoFactor(tfaTarget.member.id, tfaTarget.action);
      notificationsService.success({
        text:
          tfaTarget.action === "disable"
            ? "2FA disabled for this member"
            : "2FA reset \u2014 the member must set it up again",
      });
      setTfaTarget(null);
      fetchMembers();
    } catch (err) {
      notificationsService.error({
        text: apiErrorMessage(err, "Failed to update the member 2FA"),
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const member = deleteTarget;
    setDeleteTarget(null);
    try {
      await wholesalersService.deleteMember(member.id);
      notificationsService.success({ text: "Member deleted" });
      fetchMembers();
    } catch (err) {
      notificationsService.error({
        text: apiErrorMessage(err, "Failed to delete member"),
      });
    }
  };

  const isCreateValid =
    !memberEmailError(createEmail) && !memberPasswordError(createPassword);
  const isEditValid =
    !!editTarget &&
    !memberEmailError(editEmail) &&
    !memberPasswordError(editPassword, true) &&
    (editEmail !== editTarget.email || editPassword.length > 0);

  const paged = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(members.length / PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <SectionCard
      title="Member accounts"
      subtitle="Read-only access to your partners and their usage"
      action={
        <Button onClick={() => setIsCreateOpen(true)}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusIcon size={14} weight="bold" />
            Add member
          </span>
        </Button>
      }
    >
      {isLoading ? (
        <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>Loading…</p>
      ) : members.length === 0 ? (
        <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>
          No members yet.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderTop: `1px solid ${T.gray20}`,
                borderBottom: `1px solid ${T.gray20}`,
              }}
            >
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Created</th>
              <th style={headerCell}>2FA</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {paged.map((member) => (
              <tr
                key={member.id}
                style={{ borderBottom: `1px solid ${T.gray15}` }}
              >
                <td
                  style={{ padding: "14px 0", fontSize: 14, color: T.gray100 }}
                >
                  {member.email}
                </td>
                <td
                  style={{
                    padding: "14px 0",
                    fontSize: 13,
                    color: T.gray50,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(member.createdAt)}
                </td>
                <td style={{ padding: "14px 0" }}>
                  {member.twoFactorEnabled ? (
                    <Pill label="Enabled" tone="green" />
                  ) : (
                    <span style={{ fontSize: 13, color: T.gray50 }}>Off</span>
                  )}
                </td>
                <td style={{ padding: "14px 0" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <MemberActionsMenu
                      member={member}
                      onEdit={() => openEdit(member)}
                      onDelete={() => setDeleteTarget(member)}
                      onResetTwoFactor={() => setTfaTarget({ member, action: "reset" })}
                      onDisableTwoFactor={() => setTfaTarget({ member, action: "disable" })}
                    />
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${T.gray15}`,
          }}
        >
          <span style={{ fontSize: 13, color: T.gray50 }}>
            {members.length} members
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              style={{
                height: 32,
                padding: "0 12px",
                fontSize: 13,
                fontWeight: 500,
                color: T.gray80,
                border: `1px solid ${T.gray20}`,
                borderRadius: 8,
                background: T.white,
                cursor: hasPrev ? "pointer" : "not-allowed",
                opacity: hasPrev ? 1 : 0.4,
              }}
            >
              Prev
            </button>
            <span style={{ padding: "0 8px", fontSize: 13, color: T.gray50 }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              style={{
                height: 32,
                padding: "0 12px",
                fontSize: 13,
                fontWeight: 500,
                color: T.gray80,
                border: `1px solid ${T.gray20}`,
                borderRadius: 8,
                background: T.white,
                cursor: hasNext ? "pointer" : "not-allowed",
                opacity: hasNext ? 1 : 0.4,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={closeCreate}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingTop: 4,
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: T.gray100,
              margin: 0,
            }}
          >
            Add member
          </p>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            The member will be able to see your partners and their usage, but
            not to change anything.
          </p>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Email</p>
            <MemberEmailField
              value={createEmail}
              onChange={setCreateEmail}
              placeholder="member@example.com"
            />
          </div>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Password</p>
            <MemberPasswordField
              value={createPassword}
              onChange={setCreatePassword}
              placeholder={`Min. ${MIN_MEMBER_PASSWORD_LENGTH} characters`}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              paddingTop: 4,
            }}
          >
            <Button
              variant="secondary"
              type="button"
              onClick={closeCreate}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !isCreateValid}
              loading={isCreating}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingTop: 4,
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: T.gray100,
              margin: 0,
            }}
          >
            Edit member
          </p>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>Email</p>
            <MemberEmailField value={editEmail} onChange={setEditEmail} />
          </div>

          <div>
            <p style={{ ...text.label, marginBottom: 6 }}>New password</p>
            <MemberPasswordField
              value={editPassword}
              onChange={setEditPassword}
              placeholder="Leave empty to keep the current one"
              optional
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              paddingTop: 4,
            }}
          >
            <Button
              variant="secondary"
              type="button"
              onClick={() => setEditTarget(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEdit}
              disabled={isEditing || !isEditValid}
              loading={isEditing}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete member?"
        description={`${deleteTarget?.email ?? ""} will lose access immediately. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmActionModal
        isOpen={!!tfaTarget}
        title={tfaTarget?.action === "disable" ? "Disable 2FA?" : "Reset 2FA?"}
        description={
          tfaTarget?.action === "disable"
            ? `${tfaTarget?.member.email} will be able to log in with just their password. They can re-enable 2FA themselves at any time.`
            : `${tfaTarget?.member.email ?? ""} will be required to set up two-factor authentication again before they can use the console.`
        }
        confirmLabel={tfaTarget?.action === "disable" ? "Disable" : "Reset"}
        variant="danger"
        onConfirm={handleTwoFactorAction}
        onCancel={() => setTfaTarget(null)}
      />
    </SectionCard>
  );
};

const ProfileTab = () => {
  const { isViewer, wholesalerEmail } = useWholesalers();

  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({
    newPassword: false,
    confirm: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const policyErrors = touched.newPassword
    ? passwordPolicyErrors(newPassword)
    : [];
  const sameAsCurrent =
    touched.newPassword && newPassword.length > 0 && newPassword === current;
  const mismatch =
    touched.confirm && confirm.length > 0 && newPassword !== confirm;

  const isValid =
    current.length > 0 &&
    newPassword.length > 0 &&
    confirm.length > 0 &&
    passwordPolicyErrors(newPassword).length === 0 &&
    !sameAsCurrent &&
    newPassword === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirm: true });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await wholesalersService.changePassword(current, newPassword);
      notificationsService.success({ text: "Password changed successfully" });
      setCurrent("");
      setNewPassword("");
      setConfirm("");
      setTouched({ newPassword: false, confirm: false });
    } catch (err) {
      notificationsService.error({
        text: apiErrorMessage(err, "Failed to change password"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionCard title="Account">
        <ReadField label="Email" value={wholesalerEmail ?? ""} />
      </SectionCard>

      <TwoFactorCard />

      {!isViewer && (
        <SectionCard title="Change password">
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <PasswordField
              label="Old password"
              value={current}
              onChange={setCurrent}
            />

            <PasswordField
              label="New password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                setTouched((t) => ({ ...t, newPassword: true }));
              }}
            />

            {sameAsCurrent && (
              <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
                New password must differ from current
              </p>
            )}

            {!sameAsCurrent && policyErrors.length > 0 && (
              <PasswordRequirements errors={policyErrors} />
            )}

            <PasswordField
              label="Confirm new password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setTouched((t) => ({ ...t, confirm: true }));
              }}
            />

            {mismatch && (
              <p style={{ fontSize: 12, color: T.red, margin: 0 }}>
                Passwords do not match
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <button
                type="submit"
                disabled={isSaving || !isValid}
                style={{
                  height: 40,
                  padding: "0 16px",
                  background: T.primary,
                  color: T.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: isSaving || !isValid ? "not-allowed" : "pointer",
                  opacity: isSaving || !isValid ? 0.4 : 1,
                }}
              >
                {isSaving ? "Saving…" : "Change password"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
};

type Tab = "profile" | "members";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "members", label: "Members" },
];

export const WholesalersSettingsPage = () => {
  const { isViewer } = useWholesalers();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs = isViewer ? TABS.filter((tab) => tab.key === "profile") : TABS;

  return (
    <div
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "32px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.gray100, margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: T.gray60, margin: "6px 0 0" }}>
          {isViewer ? "Manage your account." : "Manage your account and team."}
        </p>
      </div>

      {!isViewer && (
        <div style={{ borderBottom: `1px solid ${T.gray20}` }}>
          <div style={{ display: "flex" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 4px",
                  margin: "0 12px",
                  fontSize: 14,
                  fontWeight: 500,
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? `2px solid ${T.primary}`
                      : "2px solid transparent",
                  marginBottom: -1,
                  color: activeTab === tab.key ? T.gray100 : T.gray60,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(isViewer || activeTab === "profile") && <ProfileTab />}
      {!isViewer && activeTab === "members" && <MembersCard />}
    </div>
  );
};
