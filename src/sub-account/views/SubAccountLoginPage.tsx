import { useEffect, useState } from 'react';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { LoginPageView } from '../../components/auth/LoginPageView';
import { AuthPageSkeleton } from '../../components/auth/AuthPageSkeleton';
import { useSubAccount } from '../context/SubAccountContext';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';
import { subAccountConsoleBranding } from '../console-branding';

import { SsoLoginModal } from '../../components/sso/SsoLoginModal';
import { SSO_ERROR_CODES, getSsoErrorCode } from '../services/sub-account-sso.service';

export const SubAccountLoginPage = () => {
  const { isAuthenticated, logIn, logInWithSso } = useSubAccount();
  const { branding, isLoading, styles } = useSubAccountBranding();

  const [isSsoModalOpen, setIsSsoModalOpen] = useState(false);

  useEffect(() => {
    // This page doubles as the MSAL popup's redirect target. Only forward the
    // response when the URL actually carries one (an MSAL response includes a
    // `state` param). broadcastResponseToMainFrame() sets document.title
    // unconditionally as its first statement, before checking anything, so
    // calling it on a normal page load leaves the tab title corrupted.
    const hasMsalResponse =
      new URLSearchParams(window.location.hash.replace(/^#/, '')).has('state') ||
      new URLSearchParams(window.location.search).has('state');
    if (hasMsalResponse) void broadcastResponseToMainFrame();
  }, []);

  const mapLoginError = (error: unknown): string | undefined => {
    if (getSsoErrorCode(error) === SSO_ERROR_CODES.SSO_REQUIRED) {
      return "This account uses single sign-on. Use 'Sign in with SSO' below.";
    }
    return undefined;
  };

  if (isLoading) return <AuthPageSkeleton />;

  return (
    <>
      <LoginPageView
        {...subAccountConsoleBranding}
        isAuthenticated={isAuthenticated}
        logIn={logIn}
        redirectTo='/subaccount/buckets'
        forgotPasswordPath='/subaccount/forgot-password'
        branding={{ logoUrl: branding.logoUrl, styles: branding.primaryColor ? styles : undefined }}
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
