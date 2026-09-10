import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, HardDrives, Users } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartner, WholesalerPartnerUsageSummary } from '../services/wholesalers.service';
import notificationsService from '../../services/notifications.service';

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

export const WholesalersPartnerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const partner: WholesalerPartner | undefined = (location.state as { partner?: WholesalerPartner })?.partner;

  const [usage, setUsage] = useState<WholesalerPartnerUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          <h1 className='text-lg font-bold text-gray-900'>{partner?.name ?? 'Partner'}</h1>
          {partner?.email && <p className='text-sm text-gray-400 mt-0.5'>{partner.email}</p>}
        </div>
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
    </div>
  );
};
