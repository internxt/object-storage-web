import { useState } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import Button from './Button';
import notificationsService from '../services/notifications.service';
import { apiErrorMessage } from '../utils/apiError';

interface Props {
  onExport: () => Promise<number>;
  successText: (count: number) => string;
  title: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const ExportButton = ({ onExport, successText, title, disabled = false, variant = 'secondary' }: Props) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);
    try {
      const count = await onExport();
      notificationsService.success({ text: successText(count) });
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Export failed') });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <span title={title}>
      <Button variant={variant} className='!text-sm' onClick={handleClick} disabled={disabled} loading={isExporting}>
        {!isExporting && <DownloadSimpleIcon size={16} />}
        <span>{isExporting ? 'Exporting…' : 'Export'}</span>
      </Button>
    </span>
  );
};
