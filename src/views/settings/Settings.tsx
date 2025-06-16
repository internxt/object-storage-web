import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Profile } from './Profile';
import { AccessKeys } from './AccessKeys';
import { Regions } from './Regions';
import Members from './Members';
import Billing from './Billing';

const TAB_SETTINGS = [
  {
    id: 'profile',
    name: 'Profile',
    component: <Profile />,
  },
  {
    id: 'members',
    name: 'Members',
    component: <Members />,
  },
  {
    id: 'access-keys',
    name: 'Access Keys',
    component: <AccessKeys />,
    hidden: true,
  },
  {
    id: 'regions',
    name: 'Regions',
    component: <Regions />,
    hidden: true,
  },
  {
    id: 'billing',
    name: 'Billing',
    component: <Billing />,
  },
];

const TabSelector = ({ activeTab }: { activeTab: string }) => {
  const navigate = useNavigate();

  return (
    <div className='flex gap-8 pl-5 bg-white w-full rounded-md shadow-sm'>
      {TAB_SETTINGS.filter((tab) => !tab.hidden).map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(`/settings/${tab.id}`)}
          className={`py-3 flex border-b-4 text-sm px-1 font-medium transition-all ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-50 hover:text-gray-70'
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};

export const SettingsPage = () => {
  const { tab } = useParams<{ tab: string }>();

  const currentTab = TAB_SETTINGS.find((t) => t.id === tab);

  if (!currentTab) return <Navigate to='/settings/profile' replace />;

  return (
    <section className='flex w-full flex-col gap-10 items-center justify-center overflow-hidden'>
      <div className='flex flex-col gap-8 pt-10 max-w-[800px] w-full'>
        <h1 className='text-lg font-semibold'>Settings</h1>
        <TabSelector activeTab={tab!} />
        {currentTab.component}
      </div>
    </section>
  );
};
