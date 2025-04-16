import { User } from '@phosphor-icons/react'
import { JSX } from 'react'

export default function DefaultAvatar({
  diameter,
  className = '',
}: Readonly<{
  diameter: number
  className?: string
}>): JSX.Element {
  return (
    <div
      style={{ width: diameter, height: diameter, fontSize: diameter / 2.1 }}
      className={`${className} flex shrink-0 select-none  text-blue-600 bg-[#F5F6F8] items-center justify-center rounded-full font-medium`}
    >
      <User size={diameter / 2.1} />
    </div>
  )
}
