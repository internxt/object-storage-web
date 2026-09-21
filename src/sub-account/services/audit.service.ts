import subAccountAxios from '../core/sub-account-axios';

export type AuditEventType = 'created' | 'opened' | 'downloaded' | 'deleted';

export interface AuditEventItem {
  id: string;
  eventType: AuditEventType;
  actorEmail: string | null;
  resourcePath: string | null;
  ip: string | null;
  timestamp: string;
  status: 'incomplete' | 'completed';
}

export interface AuditEventsResponse {
  events: AuditEventItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditEventFilters {
  from?: string;
  to?: string;
  actorEmail?: string;
  resourcePath?: string;
  limit?: number;
  offset?: number;
}

export const auditService = {
  listAuditEvents: async (entityId: string, filters: AuditEventFilters = {}): Promise<AuditEventsResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
    );
    const response = await subAccountAxios.get<AuditEventsResponse>(`/sub-accounts/${entityId}/audit-events`, {
      params,
    });
    return response.data;
  },
};
