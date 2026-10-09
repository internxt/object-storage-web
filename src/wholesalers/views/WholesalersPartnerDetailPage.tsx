import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartner, WholesalerPartnerUsageSummary } from '../services/wholesalers.service';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { PartnerActions } from '../components/PartnerActions';
import { EditClientNameButton } from '../../components/EditClientNameModal';
import { StatusBadge } from '../../components/StatusBadge';
import { useWholesalers } from '../context/wholesalersContext';
import { T, card, shadow, text } from '../../sub-account/tokens';

const ACCENT = '#6366f1';
const POSITIVE = '#10b981';

const labelStyle = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: T.gray60,
};

const metricStyle = {
  fontSize: 48,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: 1,
};

const unitStyle = { fontSize: 20, fontWeight: 500, color: T.gray50 };

const columnStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
  flex: 1,
  padding: '28px 40px',
};

export const WholesalersPartnerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isViewer } = useWholesalers();

  const partner: WholesalerPartner | undefined = (location.state as { partner?: WholesalerPartner })?.partner;

  const [usage, setUsage] = useState<WholesalerPartnerUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    wholesalersService
      .getPartnerUsageSummary(id)
      .then(setUsage)
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          notificationsService.error({ text: 'Failed to load partner usage' });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async (partnerId: string) => {
    setIsDeleting(true);
    try {
      await wholesalersService.deletePartner(partnerId);
      notificationsService.success({ text: 'Partner deleted' });
      navigate('/wholesalers/partners');
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to delete partner') });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async (current: WholesalerPartner, name: string) => {
    await wholesalersService.updatePartnerName(current.id, name);
    // The page reads the partner from router state, so the new name has to be written back there.
    navigate(location.pathname, { replace: true, state: { partner: { ...current, name } } });
  };

  if (notFound) {
    navigate('/wholesalers/partners');
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <button
          onClick={() => navigate('/wholesalers/partners')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 12px',
            fontSize: 14, fontWeight: 500, color: T.gray80,
            border: `1px solid ${T.gray20}`, borderRadius: 8,
            background: T.white, boxShadow: shadow.sm, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ ...text.heading, margin: 0 }}>{partner ? (partner.name ?? '—') : 'Partner'}</h1>
            {partner && !isViewer && partner.status !== 'DELETED' && (
              <EditClientNameButton currentName={partner.name} onSubmit={(name) => handleRename(partner, name)} />
            )}
            {partner && <StatusBadge status={partner.status} />}
          </div>
          {partner?.email && <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{partner.email}</p>}
        </div>

        {/* The partner arrives in the router state and there is no endpoint to fetch it by id, so on a
            fresh history entry (a pasted URL, a new tab) there is nothing to delete. */}
        {partner && !isViewer && (
          <div style={{ marginLeft: 'auto' }}>
            <PartnerActions
              partner={partner}
              isDeleting={isDeleting}
              onDelete={handleDelete}
              variant='button'
            />
          </div>
        )}
      </div>

      <div style={{ ...card, borderRadius: 16, display: 'flex' }}>
        <div style={columnStyle}>
          <p style={labelStyle}>Active Storage</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: ACCENT }}>
              {loading ? '…' : (usage?.activeStorageTb ?? 0).toFixed(4)}
            </span>
            {!loading && <span style={unitStyle}>TB</span>}
          </div>
        </div>
        <div style={{ ...columnStyle, borderLeft: `1px solid ${T.gray20}` }}>
          <p style={labelStyle}>Deleted Storage</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: T.gray80 }}>
              {loading ? '…' : (usage?.deletedStorageTb ?? 0).toFixed(4)}
            </span>
            {!loading && <span style={unitStyle}>TB</span>}
          </div>
        </div>
        <div style={{ ...columnStyle, borderLeft: `1px solid ${T.gray20}` }}>
          <p style={labelStyle}>Sub-accounts</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: POSITIVE }}>
              {loading ? '…' : String(usage?.totalSubAccounts ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
