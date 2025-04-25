import { useEffect, useState } from 'react'
import { bucketsService, Region } from '../../services/buckets.service'
import notificationsService from '../../services/notifications.service'
import { LoadingRowSkeleton } from '../../components/LoadingSkeleton'
import { getFlagAndNameFromRegion } from '../../utils/getFlagAndNameFromRegion'
import { Separator } from '../../components/Separator'

const TABLE_COLUMNS_COUNT = 3

export const Regions = () => {
  const [regions, setRegions] = useState<Region[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    setIsLoading(true)

    bucketsService
      .getRegions()
      .then((regions) => {
        setRegions(regions)
      })
      .catch((err) => {
        const error = err as Error
        notificationsService.error({
          text: error.message,
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col rounded-md bg-white gap-7 p-7">
      <div className="flex flex-row w-full justify-between">
        <p className="text-xl font-semibold">Regions</p>
      </div>
      <Separator />
      <table className="w-full table-fixed">
        <thead>
          <tr className="h-12 bg-gray-10 text-black text-sm">
            <th className="px-5 text-left">Name</th>
            <th className="px-5 text-left w-[60%]">Endpoint</th>
            <th className="px-5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <LoadingRowSkeleton numberOfColumns={3} numberOfRows={3} />
          )}
          {!isLoading && (
            <>
              {regions.length > 0 ? (
                regions.map((region) => (
                  <tr
                    className="w-full h-12 text-sm text-gray-500"
                    key={region.id}
                  >
                    <td className="pl-5">
                      <div className="flex flex-row gap-2 items-center">
                        <p>{getFlagAndNameFromRegion(region.region).flag}</p>
                        <p className="text-black">
                          {getFlagAndNameFromRegion(region.region).name}
                        </p>
                      </div>
                    </td>
                    <td className="w-[80%] px-5">
                      <p
                        className={`truncate whitespace-nowrap overflow-hidden text-ellipsis w-full ${
                          region.enabled ? 'select-text' : ''
                        }`}
                      >
                        {region.storageDns}
                      </p>
                    </td>

                    <td className="px-5">
                      <div className="flex flex-row items-center gap-3">
                        <div className="h-3 w-3 rounded-full border border-black/30 p-[1px]">
                          <div
                            className={`h-full w-full rounded-full  ${
                              region.enabled ? 'bg-green' : 'bg-red'
                            }`}
                          />
                        </div>
                        <p className="text-sm">
                          {region.enabled ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="text-center py-4 text-sm text-gray-400"
                    colSpan={TABLE_COLUMNS_COUNT}
                  >
                    There are no results to show
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
