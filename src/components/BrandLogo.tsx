import { type CSSProperties, useEffect, useState } from 'react';

interface BrandLogoProps {
  logoUrl: string | null | undefined;
  fallbackLogoUrl: string;
  fallbackAlt: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  darkenFallback?: boolean;
}

/**
 * Shows a configured partner logo or the caller's default logo.
 *
 * A failed partner logo is hidden instead of falling back to Internxt branding,
 * so a configuration error is not silently concealed.
 */
export function BrandLogo({
  logoUrl,
  fallbackLogoUrl,
  fallbackAlt,
  width,
  height,
  style,
  darkenFallback = false,
}: BrandLogoProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const hasCustomLogo = logoUrl !== null && logoUrl !== undefined;
  const source = logoUrl ?? fallbackLogoUrl;

  useEffect(() => {
    setLoadFailed(false);
  }, [source]);

  if (hasCustomLogo && loadFailed) return null;

  return (
    <img
      src={source}
      alt={hasCustomLogo ? 'Partner logo' : fallbackAlt}
      width={width}
      height={height}
      onError={() => setLoadFailed(true)}
      style={{
        objectFit: 'contain',
        objectPosition: 'left',
        filter: !hasCustomLogo && darkenFallback ? 'brightness(0)' : undefined,
        ...style,
      }}
    />
  );
}
