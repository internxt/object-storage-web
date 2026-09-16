import { useState } from 'react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { T, text } from '../../../sub-account/tokens';
import { DEFAULT_PRIMARY_COLOUR, type BrandingFormValues } from './constants';
import { validateConsoleHostname, validateLogoUrl, validatePrimaryColour } from './service';
import { CustomDomainInstructions } from './CustomDomainInstructions';

type BrandingFormProps = {
  branding: BrandingFormValues;
  loading: boolean;
  saving: boolean;
  onChange: (changes: Partial<BrandingFormValues>) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
};

export function BrandingForm({
  branding,
  loading,
  saving,
  onChange,
  onSave,
  onReset,
}: BrandingFormProps) {
  const [touched, setTouched] = useState({ logoUrl: false, primaryColor: false, consoleHostname: false });
  const {isValid: isValidLogoUrl, error: logoUrlError} = validateLogoUrl(branding.logoUrl);
  const {isValid: isValidPrimaryColor, error: primaryColorError} = validatePrimaryColour(branding.primaryColor);
  const {isValid: isValidConsoleHostname, error: consoleHostnameError} = validateConsoleHostname(branding.consoleHostname);
  const isValid = isValidLogoUrl && isValidPrimaryColor && isValidConsoleHostname;
  const isFormDisabled = loading || saving;
  const isSaveDisabled = isFormDisabled || !isValid;

  function reset() {
    setTouched({ logoUrl: false, primaryColor: false, consoleHostname: false });
    onReset();
  }

  async function save() {
    setTouched({ logoUrl: true, primaryColor: true, consoleHostname: true });
    if (isValid) await onSave();
  }

  return (
    <div style={{ background: T.white, border: `1px solid ${T.gray20}`, borderRadius: 12, padding: 24, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Branding</h2>
      <p style={{ ...text.hint, margin: '4px 0 20px' }}>
        These changes are shown in every sub-account console belonging to your organisation.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label='Logo URL'
          placeholder='https://example.com/logo.svg'
          value={branding.logoUrl}
          disabled={loading}
          onChange={(logoUrl) => onChange({ logoUrl })}
          onBlur={() => setTouched((value) => ({ ...value, logoUrl: true }))}
          accent={touched.logoUrl && logoUrlError ? 'error' : undefined}
          message={touched.logoUrl ? logoUrlError : undefined}
        />
        <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Input
              label='Primary colour'
              placeholder={DEFAULT_PRIMARY_COLOUR}
              value={branding.primaryColor}
              maxLength={7}
              disabled={loading}
              onChange={(primaryColor) => onChange({ primaryColor })}
              onBlur={() => setTouched((value) => ({ ...value, primaryColor: true }))}
              accent={touched.primaryColor && primaryColorError ? 'error' : undefined}
              message={touched.primaryColor ? primaryColorError : undefined}
            />
          </div>
          <label style={{ marginTop: 23, cursor: loading ? 'default' : 'pointer' }}>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)' }}>
              Choose primary colour
            </span>
            <input
              type='color'
              aria-label='Choose primary colour'
              value={branding.primaryColor || DEFAULT_PRIMARY_COLOUR}
              disabled={loading}
              onChange={(event) => {
                onChange({ primaryColor: event.target.value });
                setTouched((value) => ({ ...value, primaryColor: true }));
              }}
              style={{ width: 40, height: 40, padding: 3, border: `1px solid ${T.gray20}`, borderRadius: 8, background: T.white, cursor: loading ? 'default' : 'pointer' }}
            />
          </label>
        </div>
        <div>
          <Input
            label='Console hostname'
            placeholder='acme.cloud.internxt.com'
            value={branding.consoleHostname}
            disabled={loading}
            onChange={(consoleHostname) => onChange({ consoleHostname: consoleHostname.trim().toLowerCase() })}
            onBlur={() => setTouched((value) => ({ ...value, consoleHostname: true }))}
            accent={touched.consoleHostname && consoleHostnameError ? 'error' : undefined}
            message={touched.consoleHostname ? consoleHostnameError : undefined}
          />
          <p style={{ ...text.hint, margin: '6px 0 0' }}>
            This is the domain your sub-accounts (your customers) use to access their console. Once it's pointed
            to Internxt, they'll see your branding automatically whenever they visit it — no setup needed on
            their side.
          </p>
        </div>
        <CustomDomainInstructions
          hostname={branding.consoleHostname?.trim().toLowerCase() ?? undefined}
        />
        <p style={{ ...text.hint, margin: '-10px 0 0' }}>
          Leave any field empty to keep the default Internxt value. Reset values clears all fields; save to apply the reset.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <Button variant='secondary' disabled={isFormDisabled} onClick={reset}>Reset values</Button>
          <Button disabled={isSaveDisabled} loading={saving} onClick={save}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
