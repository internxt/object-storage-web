import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { LoginPageView } from '../../components/auth/LoginPageView';
import Skeleton from 'react-loading-skeleton';
import { useSubAccount } from '../context/SubAccountContext';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';
import { isSharedConsoleHostname } from '../context/SubAccountBrandingContext/service';

import { SsoLoginModal } from '../../components/sso/SsoLoginModal';
import {
  PublicSsoConfig,
  SSO_ERROR_CODES,
  getSsoErrorCode,
  subAccountSsoService,
} from '../services/sub-account-sso.service';

const SSO_HOSTNAME_LOOKUP_TIMEOUT_MS = 4000;

type SsoHostnameLookup =
  | { status: 'checking' }
  | { status: 'configured'; config: PublicSsoConfig }
  | { status: 'not-configured' };

export const SubAccountLoginPage = () => {
  const { t } = useTranslation('subaccount');
  const { isAuthenticated, logIn, logInWithSso } = useSubAccount();
  const { branding, isLoading, styles } = useSubAccountBranding();
  const isCustomDomain = !isSharedConsoleHostname();

  const [isSsoModalOpen, setIsSsoModalOpen] = useState(false);
  const [ssoHostnameLookup, setSsoHostnameLookup] = useState<SsoHostnameLookup>(
    isSharedConsoleHostname() ? { status: 'not-configured' } : { status: 'checking' },
  );

  useEffect(() => {
    if (isSharedConsoleHostname()) return;

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      setSsoHostnameLookup({ status: 'not-configured' });
    }, SSO_HOSTNAME_LOOKUP_TIMEOUT_MS);

    subAccountSsoService
      .getConfigByHostname(window.location.hostname)
      .then((config) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        setSsoHostnameLookup({ status: 'configured', config });
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        setSsoHostnameLookup({ status: 'not-configured' });
      });

    return () => {
      settled = true;
      clearTimeout(timeoutId);
    };
  }, []);

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
      return t('login.ssoRequiredError');
    }
    return undefined;
  };

  if (isLoading || ssoHostnameLookup.status === 'checking') return <SubAccountLoginSkeleton />;

  const ssoOnly = ssoHostnameLookup.status === 'configured';

  return (
    <>
      <LoginPageView
        consoleTitle={t('login.consoleTitle')}
        rightHeadline={isCustomDomain ? undefined : <>{t('login.rightHeadlineLine1')}<br />{t('login.rightHeadlineLine2')}</>}
        rightDescription={isCustomDomain ? undefined : t('login.rightDescription')}
        rightFeaturePills={isCustomDomain ? undefined : [
          t('login.featurePillBucketManagement'),
          t('login.featurePillObjectStorage'),
          t('login.featurePillTeamPermissions'),
        ]}
        isAuthenticated={isAuthenticated}
        logIn={logIn}
        redirectTo='/subaccount/buckets'
      branding={{ logoUrl: branding.logoUrl, styles: branding.primaryColor ? styles : undefined }}
        mapLoginError={mapLoginError}
        hideLocalForm={ssoOnly}
        forgotPasswordPath='/subaccount/forgot-password'
        ssoSlot={
          <button
            type='button'
            onClick={() => setIsSsoModalOpen(true)}
            className='w-full h-[52px] rounded-xl bg-[#f5f5f7] hover:bg-[#ebebed] text-gray-900 text-[15px] font-medium tracking-[-0.01em] transition-colors'
          >
            {t('login.signInWithSso')}
          </button>
        }
      />
      <SsoLoginModal
        isOpen={isSsoModalOpen}
        onClose={() => setIsSsoModalOpen(false)}
        logInWithSso={logInWithSso}
        resolvedConfig={ssoOnly ? ssoHostnameLookup.config : undefined}
      />
    </>
  );
};

function SubAccountLoginSkeleton() {
  const { t } = useTranslation('subaccount');
  return (
    <div aria-busy='true' aria-label={t('shared.loadingBrandingAriaLabel')} className='flex w-screen min-h-screen' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>
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
