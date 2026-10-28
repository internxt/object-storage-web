import managementAxios from '../core/management-axios';

export type ManagementAuditAction = 'delete' | 'create' | 'update_role' | 'reset_2fa' | 'change_password';

export type ManagementAuditEntityType = 'sub_account' | 'partner' | 'wholesaler' | 'management_member';

export type ManagementAuditStatus = 'incomplete' | 'completed' | 'failed';

export interface ManagementAuditSnapshot {
  name?: string | null;
  email?: string | null;
  storageProvider?: string;
  storageProviderId?: string;
  partnerId?: string | null;
  wholesalerId?: string | null;
  role?: string;
  newRole?: string;
}

export interface ManagementAuditEvent {
  id: string;
  actorEmail: string;
  action: ManagementAuditAction;
  entityType: ManagementAuditEntityType;
  entityId: string;
  entitySnapshot: ManagementAuditSnapshot;
  status: ManagementAuditStatus;
  error: string | null;
  ip: string | null;
  createdAt: string;
}

export interface ManagementAuditEventsResponse {
  items: ManagementAuditEvent[];
  total: number;
}

async function getAuditEvents(params: { page: number; perPage: number }): Promise<ManagementAuditEventsResponse> {
  const response = await managementAxios.get<ManagementAuditEventsResponse>('/management/audit-events', { params });
  return response.data;
}

export const managementAuditService = {
  getAuditEvents,
};
