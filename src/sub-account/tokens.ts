import type { CSSProperties } from 'react';

// ─── Colour palette ───────────────────────────────────────────────────────────

export const T = {
  primary:   'var(--primary,#0066FF)',
  primaryBg: 'var(--primary-10,#E6F0FF)',
  gray5:     'var(--gray-5,#F9F9FC)',
  gray10:    'var(--gray-10,#F4F4F7)',
  gray15:    'var(--gray-15,#ECECEC)',
  gray20:    'var(--gray-20,#E5E5EB)',
  gray50:    'var(--gray-50,#8E8E94)',
  gray60:    'var(--gray-60,#636367)',
  gray80:    'var(--gray-80,#3A3A3B)',
  gray100:   'var(--gray-100,#18181B)',
  red:       'var(--red,#E03131)',
  white:     '#fff',
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadow = {
  sm:  '0 1px 2px 0 rgba(0,0,0,0.05)',
  md:  '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
  lg:  '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.07)',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const text = {
  caption:  { fontSize: 12, fontWeight: 500, color: T.gray50 } satisfies CSSProperties,
  label:    { fontSize: 13, fontWeight: 500, color: T.gray80 } satisfies CSSProperties,
  body:     { fontSize: 14, fontWeight: 400, color: T.gray80 } satisfies CSSProperties,
  bodyMed:  { fontSize: 14, fontWeight: 500, color: T.gray100 } satisfies CSSProperties,
  heading:  { fontSize: 18, fontWeight: 600, color: T.gray100 } satisfies CSSProperties,
  hint:     { fontSize: 13, fontWeight: 400, color: T.gray60 } satisfies CSSProperties,
} as const;

// ─── Common surfaces ──────────────────────────────────────────────────────────

export const card: CSSProperties = {
  background:   T.white,
  border:       `1px solid ${T.gray20}`,
  borderRadius: 12,
  boxShadow:    shadow.sm,
};
