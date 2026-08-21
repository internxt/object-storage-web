import { useEffect, useState } from 'react';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { LoginPageView } from '../../components/auth/LoginPageView';
import Skeleton from 'react-loading-skeleton';
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

  if (isLoading) return <SubAccountLoginSkeleton />;

  return (
    <>
      <LoginPageView
        {...subAccountConsoleBranding}
        isAuthenticated={isAuthenticated}
        logIn={logIn}
        redirectTo='/subaccount/buckets'
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

function SubAccountLoginSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading console branding' className='flex w-screen min-h-screen' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>
      <div className='relative flex flex-col w-full lg:max-w-[520px] min-h-screen bg-white px-10 lg:px-16 py-10 flex-shrink-0'>
        <Skeleton height={28} width={180} />
        <div className='flex flex-col flex-1 justify-center max-w-[320px] gap-8'>
          <div className='flex flex-col gap-3'>
            <Skeleton height={14} width={96} />
            <Skeleton height={32} width={180} />
          </div>
          <div className='flex flex-col gap-2.5'>
            <Skeleton height={52} borderRadius={12} />
            <Skeleton height={52} borderRadius={12} />
            <Skeleton className='mt-1' height={52} borderRadius={12} />
          </div>
        </div>
      </div>
      <div className='relative flex-1 min-h-screen overflow-hidden hidden lg:block bg-gray-5'>
        <div className='relative flex flex-col h-full items-center justify-center px-16 gap-16'>
          <div className='flex flex-col items-center gap-4'>
            <Skeleton height={40} width={320} />
            <Skeleton height={16} width={256} />
            <Skeleton height={16} width={208} />
          </div>
          <div className='w-full max-w-md rounded-2xl bg-white p-5 flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <Skeleton circle height={10} width={10} />
              <Skeleton height={8} width={96} />
              <Skeleton className='ml-auto' height={8} width={48} />
            </div>
            <div className='grid grid-cols-3 gap-2'>
              {[0, 1, 2].map((index) => (
                <div key={index} className='rounded-xl bg-gray-1 p-3 flex flex-col gap-2'>
                  <Skeleton height={6} width={48} />
                  <Skeleton height={12} width={64} />
                  <Skeleton height={8} />
                </div>
              ))}
            </div>
            <div className='flex flex-col gap-2'>
              <Skeleton height={8} />
              <Skeleton height={8} width='80%' />
              <Skeleton height={8} width='60%' />
            </div>
          </div>
          <div className='flex flex-wrap justify-center gap-2'>
            {[0, 1, 2].map((index) => <Skeleton key={index} height={28} width={112} borderRadius={999} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
