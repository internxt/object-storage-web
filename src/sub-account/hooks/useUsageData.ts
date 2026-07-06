import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import subAccountAxios from '../core/sub-account-axios';

export interface UsageRecord {
  date: string;        // YYYY-MM-DD
  active: number;      // bytes
  deleted: number;     // bytes
  objects: number;
}

interface WacmUsageItem {
  startTime: string;
  endTime: string;
  activeStorage: number;
  deletedStorage: number;
  activeObjects: number;
}

export const PAGE_SIZE_OPTIONS = [25, 50, 100];
export const MAX_RANGE_MONTHS = 3;

// The usages API paginates in ascending date order internally, which doesn't match
// the newest-first pagination this UI wants. Since the date range already bounds the
// number of possible rows (one per day), fetch the whole range in one call and do
// sorting/pagination on the client instead of trusting the API's own page ordering.
function daysBetween(from: string, to: string): number {
  return Math.min(Math.max(dayjs(to).diff(dayjs(from), 'day') + 1, 1), 100);
}

// Given the field the user just edited, keeps the other date within [edited, edited + 3 months]
// (or [edited - 3 months, edited] when "to" is the edited field), returning its adjusted value.
function keepWithinRange(edited: 'from' | 'to', editedValue: string, other: string): string {
  const editedDay = dayjs(editedValue);
  if (edited === 'from') {
    if (dayjs(other).isBefore(editedDay)) return editedValue;
    const maxOther = editedDay.add(MAX_RANGE_MONTHS, 'month').format('YYYY-MM-DD');
    return dayjs(other).isAfter(maxOther) ? maxOther : other;
  }
  if (dayjs(other).isAfter(editedDay)) return editedValue;
  const minOther = editedDay.subtract(MAX_RANGE_MONTHS, 'month').format('YYYY-MM-DD');
  return dayjs(other).isBefore(minOther) ? minOther : other;
}

export function useUsageData(entityId?: string | null) {
  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const handleFromChange = (value: string) => {
    setFromDate(value);
    setToDate(prev => keepWithinRange('from', value, prev));
  };

  const handleToChange = (value: string) => {
    setToDate(value);
    setFromDate(prev => keepWithinRange('to', value, prev));
  };

  useEffect(() => {
    setPageNumber(1);
  }, [fromDate, toDate, entityId, pageSize]);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const { data } = await subAccountAxios.get<WacmUsageItem[]>(
          `/sub-accounts/${entityId}/usages`,
          { params: { from: fromDate, to: toDate, page: 0, perPage: daysBetween(fromDate, toDate) } },
        );
        if (cancelled) return;
        setRecords(data.map(u => ({
          date: u.startTime.slice(0, 10),
          active: u.activeStorage,
          deleted: u.deletedStorage,
          objects: u.activeObjects,
        })));
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [fromDate, toDate, entityId]);

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const paged = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageNumber, pageSize]);

  const totals = useMemo(() => ({
    active: sorted[0]?.active ?? 0,
    deleted: sorted[0]?.deleted ?? 0,
    objects: sorted[0]?.objects ?? 0,
  }), [sorted]);

  return {
    fromDate,
    toDate,
    handleFromChange,
    handleToChange,
    isLoading,
    sorted,
    paged,
    totals,
    pageNumber,
    pageSize,
    setPageSize,
    goToPrevPage: () => setPageNumber(p => Math.max(1, p - 1)),
    goToNextPage: () => setPageNumber(p => p + 1),
  };
}
