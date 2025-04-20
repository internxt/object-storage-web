import { Gear, Key } from '@phosphor-icons/react'
import { Dropdown } from '../../components/Dropdown'
import { Separator } from '../../components/Separator'
import { useEffect, useState } from 'react'
import {
  AccessKey,
  AccessKeyPermission,
  accessKeysService,
} from '../../services/access-keys.service'
import notificationsService from '../../services/notifications.service'
import { AccessKeyTable } from './AccessKeysTable'
import Dialog from '../../components/Dialog'
import { GenerateAccessKeysModal } from '../../components/accessKeys/GenerateAccessKeyModal'
import { PreviewGeneratedAccessKeysModal } from '../../components/accessKeys/PreviewGeneratedAccessKeysModal'
import { copyToClipboard } from '../../utils/copyToClipboard'

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
  const [newGeneratedAccessKey, setNewGeneratedAccessKey] =
    useState<AccessKey | null>()
  const [isGenerateKeysDialogOpened, setIsGenerateKeysDialogOpened] =
    useState<boolean>(false)
  const [isPreviewGeneratedKeysModalOpen, setIsPreviewGeneratedKeysModalOpen] =
    useState<boolean>(false)
  const [isDeleteAccessKeyDialogOpen, setIsDeleteAccessKeyDialogOpen] =
    useState<boolean>(false)
  const [isGeneratingAccessKeys, setIsGeneratingAccessKeys] = useState(false)
  const [isDeletingAccessKey, setIsDeletingAccessKey] = useState(false)

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

  const onPreviewGeneratedKeysModalOpen = (
    newGeneratedAccessKey: AccessKey
  ) => {
    setNewGeneratedAccessKey(newGeneratedAccessKey)
    setIsPreviewGeneratedKeysModalOpen(true)
  }

  const onCloseGenerateNewKeysDialog = () => {
    setIsGenerateKeysDialogOpened(false)
  }

  const onDeleteKeyButtonClicked = (accessKeyToDelete: AccessKey) => {
    setAccessKeyToDelete(accessKeyToDelete)
    setIsDeleteAccessKeyDialogOpen(true)
  }

  const onCloseDeleteBucketModal = () => {
    setIsDeleteAccessKeyDialogOpen(false)
    setAccessKeyToDelete(null)
  }

  const onClosePreviewGeneratedKeysModal = () => {
    setIsGenerateKeysDialogOpened(false)
    setNewGeneratedAccessKey(null)
  }

  const onGenerateNewKeys = async (
    accessKeyName: AccessKey['name'],
    accessKeyPermission: AccessKeyPermission,
    accessKeyRegion: AccessKey['region']
  ) => {
    try {
      setIsGeneratingAccessKeys(true)
      const newAccessKey = await accessKeysService.createAccessKey({
        name: accessKeyName,
        permission: accessKeyPermission,
        region: accessKeyRegion,
      })

      await getAccessKeys()
      onCloseGenerateNewKeysDialog()
      onPreviewGeneratedKeysModalOpen(newAccessKey)
    } catch (error) {
      const err = error as Error

      notificationsService.error({
        text: err.message,
      })
    } finally {
      setIsGeneratingAccessKeys(false)
    }
  }

  const onDeleteAccessKey = async () => {
    if (!accessKeyToDelete) return

    try {
      setIsDeletingAccessKey(true)
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
    } finally {
      setIsDeletingAccessKey(false)
    }
  }

  const onDownloadCredentialsCSV = (
    name: AccessKey['name'],
    accessKey: AccessKey['accessKeyId'],
    secretKey: AccessKey['secretAccessKey']
  ) => {
    try {
      const csvContent = `name,access-key,secret-key\n${name},${accessKey},${secretKey}`
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'credentials.csv'
      document.body.appendChild(a)
      a.click()

      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      notificationsService.success({
        text: 'The keys have been downloaded successfully',
      })
    } catch (error) {
      const err = error as Error
      notificationsService.error({
        text: err.message,
      })
    }
  }

  const onCopyKeys = async (
    accessKey: AccessKey['accessKeyId'],
    secretKey: AccessKey['secretAccessKey']
  ) => {
    const text = `access-key = ${accessKey}\nsecret-key = ${secretKey}`
    try {
      await copyToClipboard(text)

      notificationsService.success({
        text: 'The keys have been copied successfully',
      })
    } catch (error) {
      const err = error as Error

      notificationsService.error({
        text: err.message,
      })
    }
  }

  return (
    <section className="flex flex-col gap-10 min-h-screen">
      <div className="flex flex-col rounded-md bg-white gap-7 p-7">
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

      {/* Delete Access Key Dialog */}
      <Dialog
        isOpen={isDeleteAccessKeyDialogOpen}
        isLoading={isDeletingAccessKey}
        onClose={onCloseDeleteBucketModal}
        onPrimaryAction={onDeleteAccessKey}
        onSecondaryAction={onCloseDeleteBucketModal}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete bucket"
        subtitle="By deleting this bucket, all associated usage data will also be permanently removed."
      />

      {newGeneratedAccessKey && (
        <PreviewGeneratedAccessKeysModal
          generatedAccessKey={newGeneratedAccessKey}
          isModalOpen={isPreviewGeneratedKeysModalOpen}
          onDownloadCredentials={onDownloadCredentialsCSV}
          onCopyKeys={onCopyKeys}
          onClose={onClosePreviewGeneratedKeysModal}
        />
      )}

      <GenerateAccessKeysModal
        isCreateAccessKeyModalOpen={isGenerateKeysDialogOpened}
        isLoading={isGeneratingAccessKeys}
        onClose={onCloseGenerateNewKeysDialog}
        onCreateAccessKey={onGenerateNewKeys}
      />
    </section>
  )
}
