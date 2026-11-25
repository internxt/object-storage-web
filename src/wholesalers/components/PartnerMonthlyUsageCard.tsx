import dayjs from 'dayjs';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartBarIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { PartnerMonthlyUsageItem } from '../services/wholesalers.service';
import { MAX_MONTHS, usePartnerMonthlyUsage } from '../hooks/usePartnerMonthlyUsage';
import Button from '../../components/Button';

const formatMonth = (month: string) => dayjs(`${month}-01`).format('MMM YYYY');
const significant = (value: number) => value.toLocaleString('en-US', { maximumSignificantDigits: 3 });
const formatTb = (value: number) => `${value > 0 && value < 0.0001 ? significant(value) : value.toFixed(4)} TB`;
const formatTick = (value: number) => `${significant(value)} TB`;

const MonthTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: PartnerMonthlyUsageItem }[] }) => {
  if (!active || !payload?.length) return null;
  const { month, activeStorageTb, partial } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-10 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-gray-100">{formatMonth(month)}</div>
      <div className="text-gray-60">{activeStorageTb === null ? 'No data yet' : formatTb(activeStorageTb)}</div>
      {partial && activeStorageTb !== null && <div className="text-gray-50">Month to date</div>}
    </div>
  );
};

const Placeholder = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
    {icon}
    <div className="text-sm font-medium text-gray-80">{title}</div>
    {children}
  </div>
);

export const PartnerMonthlyUsageCard = ({ partnerId }: { partnerId: string }) => {
  const { items, loading, failed, hasOlderMonths, retry } = usePartnerMonthlyUsage(partnerId);

  const hasData = items.some((item) => item.activeStorageTb !== null);
  const hasPartial = items.some((item) => item.partial && item.activeStorageTb !== null);

  let body: React.ReactNode;
  if (!hasData && loading) {
    body = (
      <div className="h-56 w-full animate-pulse rounded-lg bg-gray-5" aria-busy="true">
        <span className="sr-only">Loading storage history</span>
      </div>
    );
  } else if (!hasData && failed) {
    body = (
      <Placeholder
        icon={<WarningCircleIcon size={28} className="text-red" />}
        title={items.length > 0 ? "Couldn't load older months" : "Couldn't load the storage history"}
      >
        <Button variant="secondary" size="medium" onClick={retry}>
          Retry
        </Button>
      </Placeholder>
    );
  } else if (!hasData && hasOlderMonths) {
    body = (
      <Placeholder
        icon={<ChartBarIcon size={28} className="text-gray-30" />}
        title={`No storage usage in the last ${MAX_MONTHS} months`}
      />
    );
  } else if (!hasData) {
    body = (
      <Placeholder icon={<ChartBarIcon size={28} className="text-gray-30" />} title="No storage usage yet">
        <p className="text-xs text-gray-50">
          The monthly history will appear once this partner's sub-accounts store data.
        </p>
      </Placeholder>
    );
  } else {
    body = (
      <>
        <div className="h-56 text-[11px] [&_.recharts-cartesian-axis-tick_text]:fill-gray-60 [&_.recharts-cartesian-grid_line]:stroke-gray-10 [&_.recharts-tooltip-cursor]:fill-gray-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={formatTick} />
              {/* filterNull off so a month without data still gets its "No data yet" tooltip. */}
              <Tooltip content={<MonthTooltip />} filterNull={false} />
              <Bar dataKey="activeStorageTb" name="Active storage" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {items.map((item) => (
                  <Cell key={item.month} className={item.partial ? 'fill-primary/40' : 'fill-primary'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-50">
          {hasPartial && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/40" />
              Month to date
            </span>
          )}
          {loading && <span>Loading older months…</span>}
          {failed && (
            <span className="flex items-center gap-1.5 text-red">
              Couldn't load older months.
              <button onClick={retry} className="font-medium underline hover:text-red-dark">
                Retry
              </button>
            </span>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-100">Monthly storage</h2>
        <p className="text-xs text-gray-50">Average daily active storage per month</p>
      </div>
      {body}
    </div>
  );
};
