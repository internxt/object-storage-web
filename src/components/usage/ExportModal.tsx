import { X } from '@phosphor-icons/react';
import Modal from '../Modal';
import Button from '../Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  isLoading = false,
}: ExportModalProps) => {
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

        <p className='text-sm text-gray-600'>The usage data will be exported as a CSV file.</p>

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
            onClick={onExport}
          >
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};
