import { SubAccountDetailPage } from '../../management/views/SubAccountDetailPage';
import { partnersService } from '../services/partners.service';
import { usePartners } from '../context/partnersContext';

export const PartnersSubAccountDetailPage = () => {
  const { isViewer } = usePartners();
  const service = isViewer ? { ...partnersService, updateSubAccountName: undefined } : partnersService;

  return (
    <SubAccountDetailPage
      backPath='/partners/sub-accounts'
      service={service}
      showClientName
    />
  );
};
