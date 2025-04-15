import { useMemo, useState } from 'react'
import { Usage } from '../services/usage.service'

export const usePaginatedUsageData = (data: Usage[], itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  const pageInfo = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage + 1
    const to = Math.min(currentPage * itemsPerPage, totalItems)
    return {
      from,
      to,
    }
  }, [currentPage, itemsPerPage, totalItems])

  return {
    currentPage,
    setCurrentPage,
    paginatedData,
    pageInfo,
    totalItems: data.length,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}
