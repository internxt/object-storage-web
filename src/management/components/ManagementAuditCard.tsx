import { useEffect, useState } from 'react';
import { Pagination } from '../../components/Pagination';
import { SectionCard } from '../../sub-account/components/SettingsAtoms';
import { T } from '../../sub-account/tokens';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/formatDate';
import {
  ManagementAuditEntityType,
  ManagementAuditEvent,
  managementAuditService,
} from '../services/management-audit.service';

const PER_PAGE = 50;

const ENTITY_LABELS: Record<ManagementAuditEntityType, string> = {
  sub_account: 'sub-account',
  partner: 'partner',
  wholesaler: 'wholesaler',
  management_member: 'member',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  superadmin: 'Superadmin',
  staff: 'Staff',
};

const roleLabel = (role?: string) => (role ? ROLE_LABELS[role] ?? role : '—');

const describeAction = ({ action, entityType }: ManagementAuditEvent): string => {
  switch (action) {
    case 'delete':
      return `Deleted ${ENTITY_LABELS[entityType] ?? entityType}`;
    case 'create':
      return 'Added member';
    case 'update_role':
      return 'Changed role';
    case 'reset_2fa':
      return 'Reset 2FA';
    case 'change_password':
      return 'Changed password';
    default:
      return action;
  }
};

const describeDetails = ({ action, entitySnapshot }: ManagementAuditEvent): string | null => {
  if (action === 'update_role') return `${roleLabel(entitySnapshot.role)} → ${roleLabel(entitySnapshot.newRole)}`;
  if (action === 'create' && entitySnapshot.newRole) return `As ${roleLabel(entitySnapshot.newRole)}`;
  return null;
};

const StatusPill = ({ event }: { event: ManagementAuditEvent }) => {
  if (event.status === 'completed') return null;
  const failed = event.status === 'failed';
  return (
    <span
      title={failed ? event.error ?? undefined : 'Started but never finished'}
      style={{
        flexShrink: 0,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: failed ? 'rgba(224,49,49,0.1)' : T.gray10,
        color: failed ? T.red : T.gray60,
      }}
    >
      {failed ? 'Failed' : 'Incomplete'}
    </span>
  );
};

const headerCell: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 12px 12px 0',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: T.gray60,
};

const cell: React.CSSProperties = {
  padding: '14px 12px 14px 0',
  fontSize: 13,
  color: T.gray80,
  verticalAlign: 'top',
};

const truncate: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

export const ManagementAuditCard = () => {
  const [events, setEvents] = useState<ManagementAuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    managementAuditService
      .getAuditEvents({ page, perPage: PER_PAGE })
      .then(({ items, total }) => {
        setEvents(items);
        setTotal(total);
      })
      .catch((err) => notificationsService.error({ text: apiErrorMessage(err, 'Failed to load the audit log') }))
      .finally(() => setIsLoading(false));
  }, [page]);

  let statusMessage: string | null = null;
  if (isLoading) statusMessage = 'Loading…';
  else if (events.length === 0) statusMessage = 'No activity recorded yet.';

  return (
    <SectionCard title='Audit log'>
      <p style={{ fontSize: 13, color: T.gray50, margin: '0 0 16px' }}>
        Deletions and member changes made in the Management Console, newest first.
      </p>

      {statusMessage ? (
        <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>{statusMessage}</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderTop: `1px solid ${T.gray20}`, borderBottom: `1px solid ${T.gray20}` }}>
                <th style={{ ...headerCell, width: '20%' }}>Action</th>
                <th style={{ ...headerCell, width: '28%' }}>Target</th>
                <th style={{ ...headerCell, width: '22%' }}>By</th>
                <th style={{ ...headerCell, width: '12%' }}>IP</th>
                <th style={{ ...headerCell, width: '18%', paddingRight: 0 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const target = event.entitySnapshot.name || event.entitySnapshot.email || event.entityId;
                const details = describeDetails(event);
                return (
                  <tr key={event.id} style={{ borderBottom: `1px solid ${T.gray15}` }}>
                    <td style={{ ...cell, color: T.gray100 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                        <span>{describeAction(event)}</span>
                        <StatusPill event={event} />
                      </div>
                    </td>
                    <td style={cell}>
                      <div style={truncate} title={target}>
                        {target}
                      </div>
                      {details && <div style={{ fontSize: 12, color: T.gray50, marginTop: 2 }}>{details}</div>}
                    </td>
                    <td style={cell}>
                      <div style={truncate} title={event.actorEmail}>
                        {event.actorEmail}
                      </div>
                    </td>
                    <td style={cell}>
                      <div style={truncate} title={event.ip ?? undefined}>
                        {event.ip ?? '—'}
                      </div>
                    </td>
                    <td style={{ ...cell, paddingRight: 0, color: T.gray50 }}>
                      {formatDateTime(new Date(event.createdAt))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination
            pageNumber={page + 1}
            hasPrevPage={page > 0}
            hasNextPage={(page + 1) * PER_PAGE < total}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            isLoading={isLoading}
          />
        </>
      )}
    </SectionCard>
  );
};

