import { InfoCard } from '../components/usage/InfoCard'

const INFO_CARDS = [
  {
    value: '0B',
    name: 'Total Storage',
    info: 'Lorem ipsum',
  },
  {
    value: '0',
    name: 'Total Objects',
    info: 'Lorem ipsum',
  },
  {
    value: '14',
    name: 'API Calls',
    info: 'Lorem ipsum',
  },
  {
    value: '10 KB',
    name: 'Egress',
    info: 'Lorem ipsum',
  },
  {
    value: '10 KB',
    name: 'Ingress',
    info: 'Lorem ipsum',
  },
]

export const UsagePage = () => {
  return (
    <section className="flex flex-col items-center p-7 w-full gap-12">
      <div className="grid w-full gap-5 justify-center items-center [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
        {INFO_CARDS.map((infoCard) => (
          <InfoCard
            key={infoCard.name}
            value={infoCard.value}
            name={infoCard.name}
            info={infoCard.info}
          />
        ))}
      </div>
      <div className="flex flex-col p-8 w-full bg-white gap-5"></div>
    </section>
  )
}
