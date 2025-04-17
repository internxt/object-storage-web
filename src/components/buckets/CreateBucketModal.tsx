import { useEffect, useState } from 'react'
import { Bucket, bucketsService, Region } from '../../services/buckets.service'
import Modal from '../Modal'
import Input from '../Input'
import { Dropdown } from '../Dropdown'
import { CaretDown } from '@phosphor-icons/react'
import { Separator } from '../Separator'
import notificationsService from '../../services/notifications.service'
import { getFlagAndNameFromRegion } from '../../utils/getFlagAndNameFromRegion'

interface DeleteBucketModalProps {
  isCreateBucketOpened: boolean
  onClose: () => void
  onCreateBucket: (
    bucketName: Bucket['name'],
    bucketRegion: Bucket['region']
  ) => Promise<void>
}

export const CreateBucketModal = ({
  isCreateBucketOpened,
  onClose,
  onCreateBucket,
}: DeleteBucketModalProps) => {
  const [bucketName, setBucketName] = useState<string>('')
  const [bucketRegion, setBucketRegion] = useState<Bucket['region']>('eu-ie')
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
    <Modal isOpen={isCreateBucketOpened} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-black text-xl font-semibold">Create Bucket</p>
        <Separator />
        <div className="flex flex-col w-full gap-4">
          <Input
            label="Bucket Name"
            className="text-black/60"
            onChange={setBucketName}
          />
          <Dropdown
            width="w-full z-50"
            button={
              <div className="flex w-full border border-black/10 flex-row justify-between py-2 px-4 rounded-md items-center">
                <div className="flex flex-row gap-2 items-center">
                  <p>{getFlagAndNameFromRegion(bucketRegion).flag}</p>
                  <p className="text-black">
                    {getFlagAndNameFromRegion(bucketRegion).name}
                  </p>
                </div>
                <CaretDown size={14} className="text-black" />
              </div>
            }
            items={
              regions
                ? regions.map((region) => ({
                    disabled: !region.enabled,
                    render: () => (
                      <div className="flex flex-row w-full items-center justify-between">
                        <div className="px-4 py-2 text-left text-gray-700 flex items-center gap-3">
                          <p>{getFlagAndNameFromRegion(region.region).flag}</p>
                          <p className="text-black">
                            {getFlagAndNameFromRegion(region.region).name}
                          </p>
                        </div>
                        <div className="flex flex-row items-center gap-3">
                          <div className="h-3 w-3 rounded-full border border-black/30 p-[1px]">
                            <div
                              className={`h-full w-full rounded-full  ${
                                region.enabled ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                          <p className="text-sm">
                            {region.enabled ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    ),

                    onClick: () => setBucketRegion(region.region),
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
            onClick={() => onCreateBucket(bucketName, bucketRegion)}
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  )
}
