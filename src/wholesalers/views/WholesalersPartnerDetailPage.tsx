import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Database, HardDrives, Users } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartnerUsageSummary } from '../services/wholesalers.service';
import { useWholesalerPartner } from '../hooks/useWholesalerPartner';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { PartnerActions } from '../components/PartnerActions';
import { EditClientNameButton } from '../../components/EditClientNameModal';
import { StatusBadge } from '../../components/StatusBadge';
import { useWholesalers } from '../context/useWholesalers';

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  </div>
);

export const WholesalersPartnerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isViewer } = useWholesalers();
  const { partner, usage, loading, notFound, rename } = useWholesalerPartner(id);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const statValue = (format: (u: WholesalerPartnerUsageSummary) => string) => {
    if (loading) return '…';
    return usage ? format(usage) : '—';
  };

  if (notFound) {
    return <Navigate to="/wholesalers/partners" replace />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/wholesalers/partners')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">{partner ? (partner.name ?? '—') : 'Partner'}</h1>
            {partner && !isViewer && partner.status !== 'DELETED' && (
              <EditClientNameButton currentName={partner.name} onSubmit={rename} />
            )}
            {partner && <StatusBadge status={partner.status} />}
          </div>
          {partner?.email && <p className="text-sm text-gray-400 mt-0.5">{partner.email}</p>}
        </div>

        {partner && !isViewer && (
          <div style={{ marginLeft: 'auto' }}>
            <PartnerActions partner={partner} isDeleting={isDeleting} onDelete={handleDelete} variant="button" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Database size={20} weight="duotone" className="text-indigo-600" />}
          value={statValue((u) => `${u.activeStorageTb.toFixed(4)} TB`)}
          label="Active Storage"
        />
        <StatCard
          icon={<HardDrives size={20} weight="duotone" className="text-indigo-600" />}
          value={statValue((u) => `${u.deletedStorageTb.toFixed(4)} TB`)}
          label="Deleted Storage"
        />
        <StatCard
          icon={<Users size={20} weight="duotone" className="text-indigo-600" />}
          value={statValue((u) => String(u.totalSubAccounts))}
          label="Sub-accounts"
        />
      </div>
    </div>
  );
};
