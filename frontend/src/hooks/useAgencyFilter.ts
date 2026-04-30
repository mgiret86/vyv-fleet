import { useMemo } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export function useAgencyFilter() {
  const getVisibleAgencyIds = useAuthStore((s) => s.getVisibleAgencyIds)
  const currentUser         = useAuthStore((s) => s.currentUser)

  // Réactif : recalculé si currentUser change
  const visibleAgencyIds = useMemo(
    () => getVisibleAgencyIds(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser]
  )

  function filterByAgency<T extends { agencyId: string }>(data: T[]): T[] {
    return data.filter((item) => visibleAgencyIds.includes(item.agencyId))
  }

  return { filterByAgency, visibleAgencyIds }
}
