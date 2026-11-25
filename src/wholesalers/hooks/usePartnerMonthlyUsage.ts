import { useEffect, useState } from 'react';
import { wholesalersService, PartnerMonthlyUsageItem } from '../services/wholesalers.service';

export const MAX_MONTHS = 12;
export const CHUNK_MONTHS = 3;

export function usePartnerMonthlyUsage(partnerId: string) {
  const [items, setItems] = useState<PartnerMonthlyUsageItem[]>([]);
  const [to, setTo] = useState<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  const done = to === null || items.length >= MAX_MONTHS;
  const loading = !done && !failed;

  useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    wholesalersService
      .getPartnerMonthlyUsage(partnerId, { to, months: Math.min(CHUNK_MONTHS, MAX_MONTHS - items.length) })
      .then((chunk) => {
        if (cancelled) return;
        setItems((prev) => [...chunk.items, ...prev]);
        setTo(chunk.items.length > 0 ? chunk.nextTo : null);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [partnerId, to, loading, items.length]);

  return {
    items,
    loading,
    failed,
    hasOlderMonths: !!to,
    retry: () => setFailed(false),
  };
}
