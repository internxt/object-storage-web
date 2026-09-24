export const getSubAccountConsoleBranding = (t: (key: string) => string) => ({
  consoleTitle: t('login.consoleTitle'),
  rightHeadline: <>{t('login.rightHeadlineLine1')}<br />{t('login.rightHeadlineLine2')}</>,
  rightDescription: t('login.rightDescription'),
  rightFeaturePills: [
    t('login.featurePillBucketManagement'),
    t('login.featurePillObjectStorage'),
    t('login.featurePillTeamPermissions'),
  ],
});
