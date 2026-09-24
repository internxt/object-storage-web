import axios from 'axios';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const CAPTCHA_HEADER = 'x-internxt-captcha';
const CAPTCHA_FAILED_CODE = 'CAPTCHA_FAILED';

interface TurnstileOptions {
  sitekey: string;
  action: string;
  execution: 'execute';
  appearance: 'interaction-only';
  callback: (token: string) => void;
  'error-callback': () => void;
}

interface Turnstile {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export class CaptchaUnavailableError extends Error {
  constructor() {
    super('The verification service could not be loaded');
    this.name = 'CaptchaUnavailableError';
  }
}

function createContainer(): HTMLElement {
  const container = document.createElement('div');

  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.zIndex = '9999';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  document.body.appendChild(container);

  return container;
}

function getToken(turnstile: Turnstile, siteKey: string, action: string): Promise<string> {
  const container = createContainer();

  return new Promise<string>((resolve, reject) => {
    let widgetId: string | undefined;

    const cleanup = () => {
      if (widgetId) turnstile.remove(widgetId);
      container.remove();
    };

    try {
      widgetId = turnstile.render(container, {
        sitekey: siteKey,
        action,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token) => {
          cleanup();
          resolve(token);
        },
        'error-callback': () => {
          cleanup();
          reject(new CaptchaUnavailableError());
        },
      });

      turnstile.execute(widgetId);
    } catch {
      cleanup();
      reject(new CaptchaUnavailableError());
    }
  });
}

async function getHeaders(action: string): Promise<Record<string, string>> {
  if (!SITE_KEY) throw new CaptchaUnavailableError();

  const { turnstile } = window;
  if (!turnstile) throw new CaptchaUnavailableError();

  return { [CAPTCHA_HEADER]: await getToken(turnstile, SITE_KEY, action) };
}

async function tryGetHeaders(action: string): Promise<Record<string, string>> {
  try {
    return await getHeaders(action);
  } catch {
    return {};
  }
}

function isCaptchaRejection(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    err.response?.status === 403 &&
    (err.response?.data as { code?: string } | undefined)?.code === CAPTCHA_FAILED_CODE
  );
}

export const captchaService = {
  getHeaders,
  tryGetHeaders,
  isCaptchaRejection,
};
