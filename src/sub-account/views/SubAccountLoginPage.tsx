import { useEffect, useState } from 'react';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { LoginPageView } from '../../components/auth/LoginPageView';
import { useSubAccount } from '../context/SubAccountContext';
import { SsoLoginModal } from '../../components/sso/SsoLoginModal';
import { SSO_ERROR_CODES, getSsoErrorCode } from '../services/sub-account-sso.service';

export const SubAccountLoginPage = () => {
  const { isAuthenticated, logIn, logInWithSso } = useSubAccount();
  const [isSsoModalOpen, setIsSsoModalOpen] = useState(false);

  useEffect(() => {
    // When this page loads as the MSAL popup's redirect target, forward the
    // auth response to the opener and close the popup. On a normal page load
    // there's no response in the URL, so this just throws and is ignored.
    broadcastResponseToMainFrame().catch(() => {});
  }, []);

  const mapLoginError = (error: unknown): string | undefined => {
    if (getSsoErrorCode(error) === SSO_ERROR_CODES.SSO_REQUIRED) {
      return "This account uses single sign-on. Use 'Sign in with SSO' below.";
    }
    return undefined;
  };

  return (
    <>
      <LoginPageView
        consoleTitle='Cloud Account Console'
        rightHeadline={<>Object Storage<br />Sub-account</>}
        rightDescription='Access your storage, manage buckets and objects, and control team member permissions from one place.'
        rightFeaturePills={['Bucket management', 'Object storage', 'Team permissions']}
        isAuthenticated={isAuthenticated}
        logIn={logIn}
        redirectTo='/subaccount/buckets'
        mapLoginError={mapLoginError}
        ssoSlot={
          <button
            type='button'
            onClick={() => setIsSsoModalOpen(true)}
            className='w-full h-[52px] rounded-xl bg-[#f5f5f7] hover:bg-[#ebebed] text-gray-900 text-[15px] font-medium tracking-[-0.01em] transition-colors'
          >
            Sign in with SSO
          </button>
        }
      />
      <SsoLoginModal
        isOpen={isSsoModalOpen}
        onClose={() => setIsSsoModalOpen(false)}
        logInWithSso={logInWithSso}
      />
    </>
  );
};
