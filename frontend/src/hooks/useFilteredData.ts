import { useAuthStore } from '@/store/useAuthStore'

export function useAgencyFilter() {
  const getVisibleAgencyIds = useAuthStore((s) => s.getVisibleAgencyIds)

  function filterByAgency<T extends { agencyId: string }>(data: T[]): T[] {
    const ids = getVisibleAgencyIds()
    return data.filter((item) => ids.includes(item.agencyId))
  }

  return { filterByAgency, visibleAgencyIds: getVisibleAgencyIds() }
}
