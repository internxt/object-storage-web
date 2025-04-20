import { X } from '@phosphor-icons/react'
import { AccessKey } from '../../services/access-keys.service'
import Input from '../Input'
import Modal from '../Modal'
import { Separator } from '../Separator'
import Button from '../Button'

interface PreviewGeneratedAccessKeysModalProps {
  generatedAccessKey: AccessKey
  isModalOpen: boolean
  onDownloadCredentials: (
    name: AccessKey['name'],
    accessKey: AccessKey['accessKeyId'],
    secretKey: AccessKey['secretAccessKey']
  ) => void
  onCopyKeys: (
    accessKey: AccessKey['accessKeyId'],
    secretKey: AccessKey['secretAccessKey']
  ) => Promise<void>
  onClose: () => void
}

export const PreviewGeneratedAccessKeysModal = ({
  generatedAccessKey,
  isModalOpen,
  onDownloadCredentials,
  onCopyKeys,
  onClose,
}: PreviewGeneratedAccessKeysModalProps) => {
  return (
    <Modal isOpen={isModalOpen} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-row w-full justify-between items-center">
          <p className="text-black text-xl font-semibold">
            Generate Access Key
          </p>
          <button
            className="flex p-1 hover:bg-black/10 text-black rounded-sm"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <Separator />
        <div className="flex flex-col w-full gap-4">
          <p className="text-black">
            Please copy or download the Access Keys and store in a safe place.
            This is the only time the Secret Key will be available and there is
            no way to retrieve the Secret Key after closing this window.
          </p>
          <p className="text-black font-medium text-lg">S3 Credentials</p>
          <Input
            label="Access key"
            className="text-black/60"
            disabled
            value={generatedAccessKey.accessKeyId}
          />
          <Input
            label="Secret Key"
            className="text-black/60"
            disabled
            value={generatedAccessKey.secretAccessKey}
          />
        </div>
        <div className="flex flex-row w-full gap-3 items-center justify-end">
          <Button
            className="rounded-md"
            onClick={() =>
              onDownloadCredentials(
                generatedAccessKey.name,
                generatedAccessKey.accessKeyId,
                generatedAccessKey.secretAccessKey
              )
            }
          >
            Download Keys
          </Button>
          <Button
            className="rounded-md"
            onClick={() =>
              onCopyKeys(
                generatedAccessKey.accessKeyId,
                generatedAccessKey.secretAccessKey
              )
            }
          >
            Copy Keys
          </Button>
        </div>
      </div>
    </Modal>
  )
}
