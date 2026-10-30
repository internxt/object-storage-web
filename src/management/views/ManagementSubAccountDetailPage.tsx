import { SubAccountDetailPage } from './SubAccountDetailPage';
import { managementService } from '../services/management.service';
import { useManagement } from '../context/useManagement';

export const ManagementSubAccountDetailPage = () => {
  const { isOwner } = useManagement();

  return <SubAccountDetailPage deleteSubAccount={isOwner ? managementService.deleteSubAccount : undefined} />;
};
