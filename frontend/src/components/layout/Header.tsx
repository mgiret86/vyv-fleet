import { Bell, Search, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { MOCK_COMPLIANCE_ALERTS } from '@/data/mock'
import { ROLE_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

export default function Header({ title }: { title: string }) {
  const { sidebarCollapsed } = useAppStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const unresolvedCritical = MOCK_COMPLIANCE_ALERTS.filter(
    (a) => a.severity === 'CRITICAL' && !a.resolvedAt
  ).length

  if (!currentUser) return null

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 transition-all duration-300',
      sidebarCollapsed ? 'left-16' : 'left-64'
    )}>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-56">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            placeholder="Rechercher..."
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          {unresolvedCritical > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unresolvedCritical}
            </span>
          )}
        </button>

        <button className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {currentUser.firstName[0]}{currentUser.lastName[0]}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {(ROLE_LABELS as Record<string, string>)[currentUser.role] ?? currentUser.role}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </header>
  )
}
