import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import Modal from '../Modal';
import { Dropdown } from '../Dropdown';
import { CaretDown } from '@phosphor-icons/react';
import Button from '../Button';

export type ExportFormat = 'CSV' | 'JSON' | 'Excel';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  isLoading?: boolean;
}

const EXPORT_FORMATS: { label: string; value: ExportFormat }[] = [
  { label: 'CSV', value: 'CSV' },
  { label: 'JSON', value: 'JSON' },
  { label: 'Excel', value: 'Excel' },
];

export const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  isLoading = false,
}: ExportModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('CSV');

  const handleExport = () => {
    onExport(selectedFormat);
  };

  const selectedFormatOption = EXPORT_FORMATS.find(
    (format) => format.value === selectedFormat
  )!;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth='max-w-md'>
      <div className='flex flex-col gap-5'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='text-black text-xl font-semibold'>Export</p>
          <button
            className='flex p-1 hover:bg-black/10 text-black rounded-sm'
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className='flex flex-col w-full gap-4'>
          <div className='flex flex-col gap-2'>
            <label className='text-sm text-gray-600'>
              Select Export Format
            </label>
            <Dropdown
              width='w-full'
              button={
                <div className='flex w-full border border-black/10 flex-row justify-between py-2 px-4 rounded-md items-center'>
                  <p className='text-black'>{selectedFormatOption.label}</p>
                  <CaretDown size={14} className='text-black' />
                </div>
              }
              items={EXPORT_FORMATS.map((format) => ({
                label: format.label,
                onClick: () => setSelectedFormat(format.value),
              }))}
            />
          </div>
        </div>

        <div className='flex flex-row w-full gap-3 items-center justify-end'>
          <Button
            className='rounded-md'
            variant='secondary'
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className='rounded-md'
            loading={isLoading}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};
