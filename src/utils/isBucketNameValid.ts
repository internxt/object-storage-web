export function isValidBucketName(name: string): boolean {
  const MIN_LENGTH = 3
  const MAX_LENGTH = 63

  if (!name || name.length < MIN_LENGTH || name.length > MAX_LENGTH) {
    return false
  }

  if (name.includes('..') || name.includes('-.') || name.includes('.-')) {
    return false
  }

  const pattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
  return pattern.test(name)
}
