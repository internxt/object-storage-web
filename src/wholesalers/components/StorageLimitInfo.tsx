import { Info } from '@phosphor-icons/react';
import Tooltip from '../../components/Tooltip';

export const StorageLimitInfo = ({ popsFrom = 'top' }: { popsFrom?: 'top' | 'bottom' }) => (
  <Tooltip
    title="Max storage this partner can use. Uploads stop once it's reached."
    popsFrom={popsFrom}
    className='z-10 text-xs normal-case tracking-normal font-normal'
  >
    <Info size={14} className='text-gray-40' />
  </Tooltip>
);
