import PrettySize from 'pretty-bytes'

export function bytesToString(size: number): string {
  return PrettySize(size)
}

const sizeService = {
  bytesToString,
}

export default sizeService
