/**
 * Bridge between the management axios client and the "Confirm your password" dialog.
 * The dialog registers a handler on mount; the response interceptor calls requestReauth()
 * when the API answers 403 REAUTH_REQUIRED. Concurrent callers share the same prompt.
 */
type ReauthHandler = () => Promise<boolean>;

let handler: ReauthHandler | null = null;
let pending: Promise<boolean> | null = null;

export function setReauthHandler(next: ReauthHandler | null): void {
  handler = next;
}

export function requestReauth(): Promise<boolean> {
  if (!handler) return Promise.resolve(false);
  pending ??= handler().finally(() => {
    pending = null;
  });
  return pending;
}

const CANCELLED = Symbol('reauthCancelled');

export function markReauthCancelled(err: object): void {
  (err as Record<symbol, boolean>)[CANCELLED] = true;
}

export function isReauthCancelled(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as Record<symbol, boolean>)[CANCELLED] === true;
}
