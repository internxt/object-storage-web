import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Modal from './Modal';
import Button from './Button';
import { Field, inputClass } from './FormField';
import { ExportButton } from './ExportButton';

export interface ExportDateRange {
  from: string;
  to: string;
}

const DAY_FORMAT = 'YYYY-MM-DD';

const lastDays = (days: number): ExportDateRange => ({
  from: dayjs().subtract(days - 1, 'day').format(DAY_FORMAT),
  to: dayjs().format(DAY_FORMAT),
});

const rangeError = ({ from, to }: ExportDateRange, maxRangeDays: number): string | undefined => {
  if (!from || !to) return 'Select both dates';
  if (dayjs(from).isAfter(to)) return 'Start date must be before end date';
  if (dayjs(to).isAfter(dayjs(), 'day')) return 'End date cannot be in the future';
  if (dayjs(to).diff(from, 'day') + 1 > maxRangeDays) return `Range cannot exceed ${maxRangeDays} days`;
  return undefined;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExport: (range: ExportDateRange) => Promise<number>;
  successText: (count: number) => string;
  title?: string;
  description?: string;
  defaultRangeDays?: number;
  maxRangeDays?: number;
}

export const ExportDateRangeModal = ({
  isOpen,
  onClose,
  onExport,
  successText,
  title = 'Export',
  description,
  defaultRangeDays = 30,
  maxRangeDays = 30,
}: Props) => {
  const [range, setRange] = useState<ExportDateRange>(() => lastDays(defaultRangeDays));

  useEffect(() => {
    if (isOpen) setRange(lastDays(defaultRangeDays));
  }, [isOpen, defaultRangeDays]);

  const error = rangeError(range, maxRangeDays);
  const today = dayjs().format(DAY_FORMAT);

  const handleExport = async () => {
    const count = await onExport(range);
    onClose();
    return count;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-lg font-semibold text-gray-100'>{title}</h2>
          {description && <p className='text-sm text-gray-60'>{description}</p>}
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <Field label='From'>
            <input
              type='date'
              value={range.from}
              max={range.to || today}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className={inputClass()}
            />
          </Field>
          <Field label='To'>
            <input
              type='date'
              value={range.to}
              min={range.from}
              max={today}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className={inputClass()}
            />
          </Field>
        </div>

        {error && <p className='text-sm text-red'>{error}</p>}

        <div className='flex justify-end gap-3 pt-2'>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <ExportButton
            variant='primary'
            onExport={handleExport}
            successText={successText}
            title={error ?? `${range.from} to ${range.to}`}
            disabled={!!error}
          />
        </div>
      </div>
    </Modal>
  );
};
