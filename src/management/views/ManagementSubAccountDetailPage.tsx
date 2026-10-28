import { SubAccountDetailPage } from './SubAccountDetailPage';
import { managementService } from '../services/management.service';
import { useManagement } from '../context/useManagement';

export const ManagementSubAccountDetailPage = () => {
  const { isSuperadmin } = useManagement();

  return <SubAccountDetailPage deleteSubAccount={isSuperadmin ? managementService.deleteSubAccount : undefined} />;
};
