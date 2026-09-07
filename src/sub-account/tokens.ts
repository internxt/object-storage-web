import type { CSSProperties } from 'react';

// ─── Colour palette ───────────────────────────────────────────────────────────

export const T = {
  primary:   'var(--primary,#0066FF)',
  primaryBg: 'var(--primary-10,#E6F0FF)',
  primaryBg4: 'rgb(var(--color-primary, 0 102 255) / 0.04)',
  primaryBg6: 'rgb(var(--color-primary, 0 102 255) / 0.06)',
  primaryBg8: 'rgb(var(--color-primary, 0 102 255) / 0.08)',
  primaryBg14: 'rgb(var(--color-primary, 0 102 255) / 0.14)',
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

// ─── Form element styles ──────────────────────────────────────────────────────

const CARET_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238E8E94' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

export const form = {
  label: {
    ...text.label, marginBottom: 4, display: 'block',
  } satisfies CSSProperties,
  hint: {
    fontSize: 12, color: T.gray60, marginTop: 3,
  } satisfies CSSProperties,
  select: {
    height: 40, width: '100%', padding: '0 12px', paddingRight: 32,
    border: `1px solid ${T.gray20}`, borderRadius: 8,
    fontSize: 14, color: T.gray100,
    background: T.white, outline: 'none',
    appearance: 'none' as const,
    backgroundImage: CARET_SVG,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 12px center',
  } satisfies CSSProperties,
  textarea: {
    width: '100%', height: 96, padding: '10px 12px',
    border: `1px solid ${T.gray20}`, borderRadius: 8,
    fontSize: 14, color: T.gray100, lineHeight: 1.5,
    background: T.white, outline: 'none', resize: 'none' as const,
    boxSizing: 'border-box' as const,
  } satisfies CSSProperties,
} as const;
