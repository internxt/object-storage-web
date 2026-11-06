import { TwoFactorSetupForm } from '../../components/two-factor/TwoFactorSetupForm';
import { ForcedTwoFactorSetupLayout } from '../../components/two-factor/ForcedTwoFactorSetupLayout';
import { useManagement } from '../context/useManagement';
import { managementTwoFactorService } from '../services/management-two-factor.service';
import { TWO_FACTOR_SETUP_LABELS, twoFactorErrorMessage } from './twoFactorCopy';

export const ForcedTwoFactorSetup = () => {
  const { clearTwoFactorSetupRequired, logOut } = useManagement();

  return (
    <ForcedTwoFactorSetupLayout reason="The account owner reset two-factor authentication on this account.">
      <TwoFactorSetupForm
        labels={{ ...TWO_FACTOR_SETUP_LABELS, cancel: 'Log out' }}
        getSetup={managementTwoFactorService.getSetup}
        enable={managementTwoFactorService.enable}
        errorMessage={twoFactorErrorMessage}
        onComplete={clearTwoFactorSetupRequired}
        onCancel={logOut}
      />
    </ForcedTwoFactorSetupLayout>
  );
};
