import { ButtonHTMLAttributes } from 'react';

const baseStyle = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'none',
  borderRadius: 6,
  cursor: 'pointer',
} as const;

export const IconButton = ({ style, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" style={{ ...baseStyle, ...style }} {...props} />
);
