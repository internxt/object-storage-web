import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AccountSettings } from './Account'

const TAB_SETTINGS = [
  {
    id: 'profile',
    name: 'Profile',
    component: <AccountSettings />,
  },
  {
    id: 'access-keys',
    name: 'Access Keys',
    component: <AccountSettings />,
  },
]

const TabSelector = ({ activeTab }: { activeTab: string }) => {
  const navigate = useNavigate()

  return (
    <div className="flex gap-8 pl-5 bg-white w-full rounded-sm shadow-sm">
      {TAB_SETTINGS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(`/settings/${tab.id}`)}
          className={`py-3 flex border-b-4 text-sm px-1 font-medium transition-all ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  )
}

export const SettingsPage = () => {
  const { tab } = useParams<{ tab: string }>()

  const currentTab = TAB_SETTINGS.find((t) => t.id === tab)

  if (!currentTab) return <Navigate to="/settings/profile" replace />

  return (
    <section className="flex flex-col gap-10 items-center justify-center">
      <div className="flex flex-col gap-8 pt-10 max-w-[800px] w-full">
        <h1 className="text-lg font-medium">Settings</h1>
        <TabSelector activeTab={tab!} />
        {currentTab.component}
      </div>
    </section>
  )
}
