import { CSSProperties } from 'react';
import { T, text } from '../../tokens';
import { GRID_TEMPLATE } from './constants';

export const ellipsis: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const gridRow: CSSProperties = { display: 'grid', gridTemplateColumns: GRID_TEMPLATE, padding: '0 24px' };

export const bodyRow: CSSProperties = {
  ...gridRow,
  alignItems: 'center',
  height: 56,
  borderBottom: `1px solid ${T.gray15}`,
  transition: 'background 120ms',
};

export const headerRow: CSSProperties = {
  ...gridRow,
  padding: '10px 24px',
  background: T.gray5,
  borderTop: `1px solid ${T.gray15}`,
  borderBottom: `1px solid ${T.gray15}`,
};

export const headerCell: CSSProperties = {
  ...text.caption,
  color: T.gray60,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const iconTile: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  flexShrink: 0,
  background: 'linear-gradient(135deg, rgba(0,102,255,0.14) 0%, rgba(0,102,255,0.06) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const centeredMessage: CSSProperties = {
  padding: '40px 24px',
  textAlign: 'center',
  color: T.gray50,
  fontSize: 14,
};
