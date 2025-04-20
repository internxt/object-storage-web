export const LoadingRowSkeleton = ({
  numberOfColumns,
  numberOfRows,
  itemWidth = '33%',
}: {
  numberOfColumns: number
  numberOfRows: number
  itemWidth?: string
}) => {
  const totalRowsArray = new Array(numberOfRows).fill(null)
  return (
    <>
      {totalRowsArray.map((_, index) => (
        <tr className="w-full h-12 text-sm text-gray-500" key={index}>
          {new Array(numberOfColumns).fill(null).map((_, index) => (
            <td className={`w-[${itemWidth}] px-5`} key={index}>
              <div className="flex flex-col w-full gap-1">
                <div className="h-4 w-full animate-pulse rounded bg-gray-80 dark:bg-gray-20" />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
