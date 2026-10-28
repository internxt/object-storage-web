import { useMemo } from 'react';
import { SubAccountDetailPage } from '../../management/views/SubAccountDetailPage';
import { partnersService } from '../services/partners.service';
import { usePartners } from '../context/usePartners';

export const PartnersSubAccountDetailPage = () => {
  const { isViewer } = usePartners();
  const service = useMemo(
    () =>
      isViewer
        ? { ...partnersService, updateSubAccountName: undefined, updateSubAccountStorageLimit: undefined }
        : partnersService,
    [isViewer],
  );

  return <SubAccountDetailPage backPath="/partners/sub-accounts" service={service} showClientName showStorageLimit />;
};
