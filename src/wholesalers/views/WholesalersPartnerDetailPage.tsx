import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Gauge, HardDrives, PencilSimple, Users } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartner, WholesalerPartnerUsageSummary } from '../services/wholesalers.service';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { DeletePartnerAction } from '../components/DeletePartnerAction';
import { StatusBadge } from '../../components/StatusBadge';
import { useWholesalers } from '../context/wholesalersContext';
import { IconButton } from '../../components/IconButton';
import { StorageLimitInfo } from '../components/StorageLimitInfo';
import { EditPartnerStorageLimitModal } from '../components/EditPartnerStorageLimitModal';

const StatCard = ({
  icon,
  value,
  label,
  labelSuffix,
  action,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  labelSuffix?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className='bg-white rounded-xl shadow-sm p-5 flex items-center gap-4'>
    <div className='w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0'>
      {icon}
    </div>
    <div>
      <div className='text-lg font-bold text-gray-900'>{value}</div>
      <div className='flex items-center gap-1 text-xs text-gray-400'>
        {label}
        {labelSuffix}
      </div>
    </div>
    {action && <div className='ml-auto self-start'>{action}</div>}
  </div>
);

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
  const [isEditingStorageLimit, setIsEditingStorageLimit] = useState(false);

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

  const handleStorageLimitSave = async (storageLimitTB: number | null) => {
    if (!partner) return;
    await wholesalersService.updatePartnerStorageLimit(partner.id, storageLimitTB);
    navigate(location.pathname, { replace: true, state: { partner: { ...partner, storageLimitTB } } });
    notificationsService.success({
      text: storageLimitTB == null ? 'Storage limit removed' : `Storage limit set to ${storageLimitTB} TB`,
    });
  };

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

  if (notFound) {
    navigate('/wholesalers/partners');
    return null;
  }

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-start gap-4'>
        <button
          onClick={() => navigate('/wholesalers/partners')}
          className='flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0'
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-bold text-gray-900'>{partner?.name ?? 'Partner'}</h1>
            {partner && <StatusBadge status={partner.status} />}
          </div>
          {partner?.email && <p className='text-sm text-gray-400 mt-0.5'>{partner.email}</p>}
        </div>

        {/* The partner arrives in the router state and there is no endpoint to fetch it by id, so on a
            fresh history entry (a pasted URL, a new tab) there is nothing to delete. */}
        {partner && !isViewer && (
          <div style={{ marginLeft: 'auto' }}>
            <DeletePartnerAction
              partner={partner}
              isDeleting={isDeleting}
              onDelete={handleDelete}
              variant='button'
            />
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          icon={<Database size={20} weight='duotone' className='text-indigo-600' />}
          value={loading ? '…' : `${(usage?.activeStorageTb ?? 0).toFixed(4)} TB`}
          label='Active Storage'
        />
        <StatCard
          icon={<HardDrives size={20} weight='duotone' className='text-indigo-600' />}
          value={loading ? '…' : `${(usage?.deletedStorageTb ?? 0).toFixed(4)} TB`}
          label='Deleted Storage'
        />
        <StatCard
          icon={<Users size={20} weight='duotone' className='text-indigo-600' />}
          value={loading ? '…' : String(usage?.totalSubAccounts ?? 0)}
          label='Sub-accounts'
        />
        {partner && (
          <StatCard
            icon={<Gauge size={20} weight='duotone' className='text-indigo-600' />}
            value={partner.storageLimitTB != null ? `${partner.storageLimitTB} TB` : 'No limit'}
            label='Storage Limit'
            labelSuffix={<StorageLimitInfo />}
            action={
              !isViewer &&
              usage && (
                <IconButton
                  aria-label='Edit storage limit'
                  title='Edit limit'
                  className='text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                  onClick={() => setIsEditingStorageLimit(true)}
                >
                  <PencilSimple size={16} />
                </IconButton>
              )
            }
          />
        )}
      </div>

      {partner && usage && (
        <EditPartnerStorageLimitModal
          isOpen={isEditingStorageLimit}
          onClose={() => setIsEditingStorageLimit(false)}
          limit={partner.storageLimitTB ?? null}
          usedTb={usage.activeStorageTb}
          onSave={handleStorageLimitSave}
        />
      )}
    </div>
  );
};
