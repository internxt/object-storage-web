import { useEffect, useState } from 'react'
import { Bucket, bucketsService, Region } from '../../services/buckets.service'
import Modal from '../Modal'
import Input from '../Input'
import { Dropdown } from '../Dropdown'
import { CaretDown } from '@phosphor-icons/react'
import { Separator } from '../Separator'
import notificationsService from '../../services/notifications.service'
import { getFlagAndNameFromRegion } from '../../utils/getFlagAndNameFromRegion'
import {
  AccessKey,
  AccessKeyPermission,
} from '../../services/access-keys.service'
import { getAccessPermissionFormatted } from '../../utils/getAccessKeyPermissionFormatted'

interface CreateAccessKeyModal {
  isCreateAccessKeyModalOpen: boolean
  onClose: () => void
  onCreateAccessKey: (
    accessKeyName: AccessKey['name'],
    accessKeyPermission: AccessKeyPermission,
    accessKeyRegion: AccessKey['region']
  ) => Promise<void>
}

const AccessKeyPermissions: AccessKeyPermission[] = [
  'read',
  'write',
  'read-write',
]

export const GenerateAccessKeysModal = ({
  isCreateAccessKeyModalOpen,
  onClose,
  onCreateAccessKey,
}: CreateAccessKeyModal) => {
  const [accessKeyName, setAccessKeyName] = useState<string>('')
  const [region, setRegion] = useState<Bucket['region']>('eu-ie')
  const [permission, setPermission] = useState<AccessKeyPermission>('read')
  const [regions, setRegions] = useState<Region[]>()

  useEffect(() => {
    bucketsService
      .getRegions()
      .then((regions) => setRegions(regions))
      .catch((err) => {
        const error = err as Error

        notificationsService.error({
          text: error.message,
        })

        onClose()
      })
  }, [])

  return (
    <Modal isOpen={isCreateAccessKeyModalOpen} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-black text-xl font-semibold">Generate Access Key</p>
        <Separator />
        <div className="flex flex-col w-full gap-4">
          <Input
            label="Access Key Name"
            className="text-black/60"
            onChange={setAccessKeyName}
          />
          <Dropdown
            width="w-full z-50"
            button={
              <div className="flex w-full border border-black/10 flex-row justify-between py-2 px-4 rounded-md items-center">
                <div className="flex flex-row gap-2 items-center">
                  <p className="text-black">
                    {getAccessPermissionFormatted(permission)}
                  </p>
                </div>
                <CaretDown size={14} className="text-black" />
              </div>
            }
            items={AccessKeyPermissions.map((permission) => ({
              label: getAccessPermissionFormatted(permission),
              onClick: () => setPermission(permission),
            }))}
          />

          <Dropdown
            width="w-full z-50"
            button={
              <div className="flex w-full border border-black/10 flex-row justify-between py-2 px-4 rounded-md items-center">
                <div className="flex flex-row gap-2 items-center">
                  <p>{getFlagAndNameFromRegion(region).flag}</p>
                  <p className="text-black">
                    {getFlagAndNameFromRegion(region).name}
                  </p>
                </div>
                <CaretDown size={14} className="text-black" />
              </div>
            }
            items={
              regions
                ? regions.map((region) => ({
                    label:
                      getFlagAndNameFromRegion(region.region).flag +
                      getFlagAndNameFromRegion(region.region).name,

                    onClick: () => setRegion(region.region),
                    active: region.enabled,
                  }))
                : []
            }
          />
        </div>
        <div className="flex flex-row w-full gap-3 items-center justify-end">
          <button
            className="flex text-black hover:bg-gray-200 rounded-sm py-2 px-3"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex text-white bg-blue-600 rounded-sm py-2 px-3"
            onClick={() => onCreateAccessKey(accessKeyName, permission, region)}
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  )
}
