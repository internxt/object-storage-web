import { Gear, Key } from '@phosphor-icons/react'
import { Dropdown } from '../../components/Dropdown'
import { Separator } from '../../components/Separator'
import { useEffect, useState } from 'react'
import {
  AccessKey,
  accessKeysService,
} from '../../services/access-keys.service'
import notificationsService from '../../services/notifications.service'
import { AccessKeyTable } from './AccessKeysTable'
import Dialog from '../../components/Dialog'

const TABLE_HEADERS = [
  {
    title: 'Name',
    key: 'name',
  },
  {
    title: 'Access Key',
    key: 'accessKey',
  },
  {
    title: 'Created On',
    key: 'createdOn',
  },
]

interface ManageKeysDropdownProps {
  onGenerateNewKeysButtonClicked: () => void
}

const ManageKeysDropdown = ({
  onGenerateNewKeysButtonClicked,
}: ManageKeysDropdownProps) => {
  return (
    <Dropdown
      width="w-full z-50"
      button={
        <div className="flex w-full border border-black/10 flex-row justify-between py-2 px-4 rounded-md items-center">
          <div className="flex flex-row gap-2 items-center">
            <p>Manage Access keys</p>
            <Gear />
          </div>
        </div>
      }
      items={[
        {
          label: 'Generate New Keys',
          icon: <Key />,
          onClick: onGenerateNewKeysButtonClicked,
        },
      ]}
    />
  )
}

export const AccessKeys = () => {
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([])
  const [accessKeyToDelete, setAccessKeyToDelete] = useState<AccessKey | null>()
  const [isGenerateKeysDialogOpened, setIsGenerateKeysDialogOpened] =
    useState(false)
  const [isDeleteAccessKeyDialogOpen, setIsDeleteAccessKeyDialogOpen] =
    useState(false)

  useEffect(() => {
    getAccessKeys()
  }, [])

  const getAccessKeys = async () => {
    try {
      const accessKeys = await accessKeysService.getAccessKeys()
      setAccessKeys(accessKeys)
    } catch (error) {
      const err = error as Error

      notificationsService.error({
        text: err.message,
      })
    }
  }

  const onGenerateNewKeysButtonClicked = () => {
    setIsGenerateKeysDialogOpened(true)
  }

  const onDeleteKeyButtonClicked = (accessKeyToDelete: AccessKey) => {
    setAccessKeyToDelete(accessKeyToDelete)
    setIsDeleteAccessKeyDialogOpen(true)
  }

  const onCloseDeleteBucketModal = () => {
    setIsDeleteAccessKeyDialogOpen(false)
    setAccessKeyToDelete(null)
  }

  const onDeleteAccessKey = async () => {
    if (!accessKeyToDelete) return

    try {
      await accessKeysService.removeAccessKey({
        accessKeyId: accessKeyToDelete.accessKeyId,
        region: accessKeyToDelete?.region,
      })

      notificationsService.success({
        text: `The access key ${accessKeyToDelete.name} has been deleted successfully`,
      })
      await getAccessKeys()
      onCloseDeleteBucketModal()
    } catch (error) {
      const err = error as Error

      notificationsService.error({
        text: err.message,
      })
    }
  }

  return (
    <section className="flex flex-col gap-10 min-h-screen">
      <div className="flex flex-col rounded-sm bg-white gap-7 p-7">
        <div className="flex flex-row w-full justify-between">
          <p className="text-xl font-semibold">Access Keys</p>
          <ManageKeysDropdown
            onGenerateNewKeysButtonClicked={onGenerateNewKeysButtonClicked}
          />
        </div>
        <Separator />
        <AccessKeyTable
          accessKeys={accessKeys}
          headers={TABLE_HEADERS}
          onDeleteAccessKey={onDeleteKeyButtonClicked}
        />
      </div>

      <Dialog
        isOpen={isDeleteAccessKeyDialogOpen}
        onClose={onCloseDeleteBucketModal}
        onPrimaryAction={onDeleteAccessKey}
        onSecondaryAction={onCloseDeleteBucketModal}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete bucket"
        subtitle="By deleting this bucket, all associated usage data will also be permanently removed."
      />
    </section>
  )
}
