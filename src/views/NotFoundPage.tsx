import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, CompassIcon } from '@phosphor-icons/react';
import { BrandLogo } from '../components/BrandLogo';
import Loader from '../components/Loader';
import { useManagement } from '../management/context/useManagement';
import { usePartners } from '../partners/context/usePartners';
import { useWholesalers } from '../wholesalers/context/useWholesalers';
import { useSubAccount } from '../sub-account/context/useSubAccount';
import { useSubAccountBranding } from '../sub-account/context/SubAccountBrandingContext/useSubAccountBranding';
import { type ConsoleArea, getNotFoundDestination, resolveConsoleArea } from '../utils/notFoundDestination';

const DEFAULT_LOGO_URL = '/logo.svg';

export const NotFoundPage = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const management = useManagement();
  const partners = usePartners();
  const wholesalers = useWholesalers();
  const subAccount = useSubAccount();
  const { branding, styles, isLoading: isBrandingLoading } = useSubAccountBranding();

  const area = resolveConsoleArea(pathname, window.location.hostname);
  const isAuthenticatedByArea: Record<ConsoleArea, boolean> = {
    management: management.isAuthenticated,
    partners: partners.isAuthenticated,
    wholesalers: wholesalers.isAuthenticated,
    subaccount: subAccount.isAuthenticated,
  };
  const isAuthenticated = isAuthenticatedByArea[area];
  const destination = getNotFoundDestination(area, isAuthenticated);

  const isBranded = area === 'subaccount';
  const logoUrl = isBranded ? branding.logoUrl : null;
  const brandingStyles = isBranded && branding.primaryColor ? styles : undefined;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('notFound.documentTitle');
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  if (isBranded && isBrandingLoading) {
    return <Loader classNameContainer="flex min-h-screen items-center justify-center bg-surface" />;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface" style={brandingStyles}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] max-w-[200vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(var(--color-primary) / 0.10), transparent)' }}
      />

      <header className="relative px-6 py-8 sm:px-10">
        <BrandLogo
          logoUrl={logoUrl}
          fallbackLogoUrl={DEFAULT_LOGO_URL}
          fallbackAlt="Internxt"
          width={140}
          height={32}
          darkenFallback
          style={{ maxWidth: 160, maxHeight: 32 }}
        />
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 pb-24">
        <div className="flex max-w-md flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/15"
          >
            <CompassIcon size={40} weight="duotone" />
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-gray-100">{t('notFound.title')}</h1>
          <p className="mt-3 text-base leading-relaxed text-gray-60" style={{ textWrap: 'balance' }}>
            {t('notFound.description')}
          </p>
          <Link
            to={destination}
            replace
            className="mt-10 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-base font-medium shadow-sm outline-none ring-2 ring-primary/0 ring-offset-2 transition-all duration-100 hover:bg-primary-dark focus-visible:ring-primary/50 active:bg-primary-dark"
            style={{ color: 'var(--sub-account-primary-contrast, #FFFFFF)' }}
          >
            <ArrowLeftIcon size={18} weight="bold" aria-hidden="true" />
            {isAuthenticated ? t('notFound.goHome') : t('notFound.goToLogin')}
          </Link>
        </div>
      </main>
    </div>
  );
};
