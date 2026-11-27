import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  wholesalersService,
  WholesalerPartnerDetail,
  WholesalerPartnerUsageSummary,
} from '../services/wholesalers.service';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';

const NOT_FOUND_STATUSES = [400, 403, 404];

export type WholesalerPartnerLoad =
  | {
      kind: 'loaded';
      partner: WholesalerPartnerDetail;
      usage: WholesalerPartnerUsageSummary | null;
      usageError?: string;
    }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string };

export async function loadWholesalerPartner(
  id: string,
  known?: WholesalerPartnerDetail,
): Promise<WholesalerPartnerLoad> {
  const [partner, usage] = await Promise.allSettled([
    known ?? wholesalersService.getPartner(id),
    wholesalersService.getPartnerUsageSummary(id),
  ]);

  // When the partner can't be loaded the usage request fails for the same reason, so only the partner error counts.
  if (partner.status === 'rejected') {
    if (NOT_FOUND_STATUSES.includes(partner.reason?.response?.status)) return { kind: 'notFound' };
    return { kind: 'error', message: apiErrorMessage(partner.reason, 'Failed to load partner') };
  }
  if (usage.status === 'rejected') {
    return {
      kind: 'loaded',
      partner: partner.value,
      usage: null,
      usageError: apiErrorMessage(usage.reason, 'Failed to load partner usage'),
    };
  }
  return { kind: 'loaded', partner: partner.value, usage: usage.value };
}

export function useWholesalerPartner(id: string | undefined) {
  const location = useLocation();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<WholesalerPartnerDetail>();
  const [usage, setUsage] = useState<WholesalerPartnerUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // The partners table passes the row in router state, which saves the partner request. It is read once
  // here because the effect below clears it, and StrictMode's second effect run must still see it.
  const [statePartner] = useState(() => (location.state as { partner?: WholesalerPartnerDetail } | null)?.partner);

  // Clear the router state once read, so a refresh or a later visit to this entry fetches fresh data.
  useEffect(() => {
    if (location.state != null) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    if (!id) return;
    const known = statePartner?.id === id ? statePartner : undefined;
    let stale = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPartner(known);
    setNotFound(false);
    setLoading(true);
    loadWholesalerPartner(id, known).then((result) => {
      if (stale) return;
      if (result.kind === 'notFound') {
        setNotFound(true);
      } else if (result.kind === 'error') {
        notificationsService.error({ text: result.message });
      } else {
        setPartner(result.partner);
        setUsage(result.usage);
        if (result.usageError) notificationsService.error({ text: result.usageError });
      }
      setLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [id, statePartner]);

  const rename = async (name: string) => {
    if (!partner) return;
    await wholesalersService.updatePartnerName(partner.id, name);
    setPartner({ ...partner, name });
  };

  return { partner, usage, loading, notFound, rename };
}
