import { Info } from '@phosphor-icons/react'
import Tooltip from '../Tooltip'

interface InfoCardProps {
  value: string
  name: string
  info: string
}

export const InfoCard = ({ value, name, info }: InfoCardProps) => {
  return (
    <div className="flex flex-col gap-4 bg-white shadow-sm rounded-b-sm rounded-t-xs w-full p-4 border-t-4 border-blue-600">
      <p className="font-medium text-lg">{value}</p>
      <div className="flex flex-row gap-2 items-center  text-black/60">
        <p className="text-sm">{name}</p>
        <Tooltip popsFrom="bottom" title={info} delayInMs={200}>
          <Info weight="fill" />
        </Tooltip>
      </div>
    </div>
  )
}
