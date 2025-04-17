import { AccessKeyPermission } from '../services/access-keys.service'

export function getAccessPermissionFormatted(permission: AccessKeyPermission) {
  switch (permission) {
    case 'read':
      return 'Read only'
    case 'write':
      return 'Write only'
    case 'read-write':
      return 'Read and Write'

    default:
      return permission
  }
}
