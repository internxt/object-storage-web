import { usePartners } from '../context/usePartners';
import { TwoFactorSetupForm } from './TwoFactorSetupForm';
import { ForcedTwoFactorSetupLayout } from '../../components/two-factor/ForcedTwoFactorSetupLayout';

export const ForcedTwoFactorSetup = () => {
  const { clearTwoFactorSetupRequired } = usePartners();

  return (
    <ForcedTwoFactorSetupLayout reason="Your administrator reset two-factor authentication on this account.">
      <TwoFactorSetupForm onComplete={clearTwoFactorSetupRequired} />
    </ForcedTwoFactorSetupLayout>
  );
};
