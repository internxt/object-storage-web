import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, HardDrives, Users } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartner, WholesalerPartnerUsageSummary } from '../services/wholesalers.service';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { DeletePartnerAction } from '../components/DeletePartnerAction';
import { StatusBadge } from '../../components/StatusBadge';
import { useWholesalers } from '../context/wholesalersContext';
import { Switch } from '../../components/Switch';
import { StorageQuotaCell } from '../../management/components/PartnersSubAccountsTable';
import {
  belowUsageMessage,
  storageLimitSaveErrorMessage,
  storageLimitValidationError,
} from '../utils/storageLimit';

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className='bg-white rounded-xl shadow-sm p-5 flex items-center gap-4'>
    <div className='w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0'>
      {icon}
    </div>
    <div>
      <div className='text-lg font-bold text-gray-900'>{value}</div>
      <div className='text-xs text-gray-400'>{label}</div>
    </div>
  </div>
);

const StorageLimitCard = ({
  limit,
  usedTb,
  readOnly,
  onSave,
}: {
  limit: number | null;
  usedTb?: number;
  readOnly: boolean;
  onSave: (storageLimitTB: number | null) => Promise<void>;
}) => {
  const [enabled, setEnabled] = useState(limit != null);
  const [value, setValue] = useState(limit != null ? String(limit) : '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEnabled(limit != null);
    setValue(limit != null ? String(limit) : '');
  }, [limit]);

  const validationError = enabled && value !== '' ? storageLimitValidationError(value) : undefined;
  const nextLimit = enabled ? Number(value) : null;
  const belowUsage = nextLimit != null && !validationError && usedTb != null && nextLimit < usedTb;
  const hasChanges = enabled ? value !== '' && nextLimit !== limit : limit != null;
  const canSave = !readOnly && !busy && hasChanges && !validationError && !belowUsage;

  const save = async () => {
    setBusy(true);
    try {
      await onSave(nextLimit);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-sm font-semibold text-gray-900'>Storage Limit</h2>
          {usedTb != null && <StorageQuotaCell used={usedTb} quota={limit} />}
        </div>
        <Switch label='Limit storage' checked={enabled} disabled={readOnly || busy} onChange={setEnabled} />
      </div>

      {!readOnly && (
        <div className='flex items-center gap-2 flex-wrap'>
          {enabled && (
            <>
              <input
                inputMode='numeric'
                value={value}
                disabled={busy}
                placeholder='1–10'
                onChange={(e) => setValue(e.target.value)}
                className='w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400 disabled:bg-gray-50'
              />
              <span className='text-sm text-gray-700'>TB</span>
            </>
          )}
          <button
            disabled={!canSave}
            onClick={save}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          {validationError && <span className='text-xs text-red-600'>{validationError}</span>}
          {belowUsage && <span className='text-xs text-red-600'>{belowUsageMessage(usedTb)}</span>}
        </div>
      )}
    </div>
  );
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

  const handleStorageLimitSave = async (storageLimitTB: number | null) => {
    if (!partner) return;
    try {
      await wholesalersService.updatePartnerStorageLimit(partner.id, storageLimitTB);
      navigate(location.pathname, { replace: true, state: { partner: { ...partner, storageLimitTB } } });
      notificationsService.success({
        text: storageLimitTB == null ? 'Storage limit removed' : `Storage limit set to ${storageLimitTB} TB`,
      });
    } catch (err) {
      notificationsService.error({ text: storageLimitSaveErrorMessage(err, usage?.activeStorageTb) });
    }
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

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
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
      </div>

      {partner && (
        <StorageLimitCard
          limit={partner.storageLimitTB ?? null}
          usedTb={usage?.activeStorageTb}
          readOnly={isViewer}
          onSave={handleStorageLimitSave}
        />
      )}
    </div>
  );
};
