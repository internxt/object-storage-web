import { useWholesalers } from '../context/useWholesalers';
import { WholesalersTwoFactorSetupForm } from './WholesalersTwoFactorSetupForm';
import { ForcedTwoFactorSetupLayout } from '../../components/two-factor/ForcedTwoFactorSetupLayout';

export const WholesalersForcedTwoFactorSetup = () => {
  const { clearTwoFactorSetupRequired } = useWholesalers();

  return (
    <ForcedTwoFactorSetupLayout reason="Your administrator reset two-factor authentication on this account.">
      <WholesalersTwoFactorSetupForm onComplete={clearTwoFactorSetupRequired} />
    </ForcedTwoFactorSetupLayout>
  );
};
