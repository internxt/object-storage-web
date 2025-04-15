import PrettySize from 'pretty-bytes'

export function bytesToString(size: number): string {
  if (size > 0) {
    return PrettySize(size)
  } else {
    return ''
  }
}

const sizeService = {
  bytesToString,
}

export default sizeService
