import { useEffect, useState } from 'react';
import { contrastColour, validatePrimaryColour } from './service';
import { T, text } from '../../../sub-account/tokens';
import { DEFAULT_PRIMARY_COLOUR } from './constants';

export function BrandingPreview({ logoUrl, primaryColor }: { logoUrl: string; primaryColor: string }){
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const hasCustomLogo = logoUrl.trim().length > 0;
  const { isValid: isValidPrimaryColour } = validatePrimaryColour(primaryColor);
  const colour = isValidPrimaryColour ? primaryColor || DEFAULT_PRIMARY_COLOUR : DEFAULT_PRIMARY_COLOUR;
  const foreground = contrastColour(colour);
  const badgeTextColour = foreground === '#18181B' ? foreground : colour;

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  return (
    <div>
      <p style={{ ...text.label, margin: '0 0 8px' }}>Sub-account console preview</p>
      <div style={{ overflow: 'hidden', border: `1px solid ${T.gray20}`, borderRadius: 10, background: T.white }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: `1px solid ${T.gray20}` }}>
          {hasCustomLogo && logoLoadFailed ? (
            <div style={{ width: 132, height: 14, borderRadius: 4, background: T.gray15 }} />
          ) : (
            <img
              src={hasCustomLogo ? logoUrl : '/logo.svg'}
              alt={hasCustomLogo ? 'Custom logo preview' : 'Internxt'}
              onError={() => setLogoLoadFailed(true)}
              style={{ maxWidth: 132, height: 14, objectFit: 'contain', objectPosition: 'left', filter: hasCustomLogo ? undefined : 'brightness(0)' }}
            />
          )}
          <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: badgeTextColour, background: `${colour}1A` }}>
            Cloud account
          </span>
          <span style={{ marginLeft: 4, alignSelf: 'stretch', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${colour}`, fontSize: 12, fontWeight: 600, color: T.gray100 }}>
            Buckets
          </span>
        </div>
        <div style={{ padding: 16, background: T.gray5 }}>
          <div style={{ width: 144, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, fontSize: 12, fontWeight: 600, color: foreground, background: colour }}>
            Create bucket
          </div>
        </div>
      </div>
      {logoLoadFailed && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: T.red }}>
          The custom logo could not be loaded. Check that the URL points to a publicly accessible image.
        </p>
      )}
    </div>
  );
};
