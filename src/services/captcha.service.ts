const SITE_KEY = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY as string | undefined;
const CAPTCHA_HEADER = 'x-internxt-captcha';

interface Grecaptcha {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export class CaptchaUnavailableError extends Error {
  constructor() {
    super('The verification service could not be loaded');
    this.name = 'CaptchaUnavailableError';
  }
}

async function getHeaders(action: string): Promise<Record<string, string>> {
  if (!SITE_KEY) return {};

  const { grecaptcha } = window;
  if (!grecaptcha) throw new CaptchaUnavailableError();

  await new Promise<void>((resolve) => grecaptcha.ready(resolve));
  const token = await grecaptcha.execute(SITE_KEY, { action });

  return { [CAPTCHA_HEADER]: token };
}

export const captchaService = {
  getHeaders,
};
