interface InfoCardProps {
  value: string
  name: string
}

export const InfoCard = ({ value, name }: InfoCardProps) => {
  return (
    <div className="flex flex-col gap-4 max-w-[400px] bg-white shadow-sm rounded-b-sm rounded-t-xs w-screen p-4 border-t-4 border-primary">
      <p className="font-medium text-lg">{value}</p>
      <div className="flex flex-row gap-2 items-center  text-black/60">
        <p className="text-sm">{name}</p>
      </div>
    </div>
  )
}
