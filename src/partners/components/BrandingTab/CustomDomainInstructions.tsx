import { T, text } from '../../../sub-account/tokens';

const EXAMPLE_HOSTNAME = 'panel.yourdomain.com';

function Record({
  title,
  purpose,
  name,
  value,
}: {
  title: string;
  purpose: string;
  name: string;
  value: string;
}) {
  return (
    <div>
      <p style={{ ...text.bodyMed, margin: '0 0 2px' }}>{title}</p>
      <p style={{ ...text.hint, margin: '0 0 6px' }}>{purpose}</p>
      <div
        style={{
          background: T.gray5,
          border: `1px solid ${T.gray20}`,
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          fontFamily: 'monospace',
          color: T.gray80,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div><span style={{ color: T.gray50 }}>Type:</span> CNAME</div>
        <div style={{ wordBreak: 'break-all' }}><span style={{ color: T.gray50 }}>Name:</span> {name}</div>
        <div style={{ wordBreak: 'break-all' }}><span style={{ color: T.gray50 }}>Value:</span> {value}</div>
      </div>
    </div>
  );
}

export function CustomDomainInstructions({ hostname }: { hostname?: string }) {
  const activeHostname = hostname || EXAMPLE_HOSTNAME;

  return (
    <details style={{ margin: '-6px 0 0' }}>
      <summary style={{ ...text.label, color: T.primary, cursor: 'pointer', userSelect: 'none' }}>
        How to point a custom domain here
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
        <p style={{ ...text.hint, margin: 0 }}>
          To use a custom domain, create a CNAME record with whoever manages your domain's DNS
          (Cloudflare, GoDaddy, Route 53, etc.).{' '}
          {hostname ? (
            <>Using the hostname you entered above, <code>{hostname}</code>.</>
          ) : (
            <>This example uses <code>{EXAMPLE_HOSTNAME}</code> — replace it with the hostname you configure above.</>
          )}
        </p>

        <Record
          title="CNAME record"
          purpose="Routes your domain to Internxt."
          name={activeHostname}
          value="saas.internxt.com"
        />

        <div style={{ background: T.gray5, border: `1px solid ${T.gray20}`, borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ ...text.label, margin: '0 0 6px' }}>Important</p>
          <ul style={{ ...text.hint, margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              If you manage DNS through Cloudflare, this record must be set to "DNS only" (grey cloud, not
              orange/proxied), or this won't work.
            </li>
          </ul>
        </div>
      </div>
    </details>
  );
}
