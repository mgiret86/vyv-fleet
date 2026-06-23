import type { ComplianceScore } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────
function scoreColor(s: number): { bar: string; text: string } {
  if (s >= 80) return { bar: 'bg-green-500',  text: 'text-green-600'  }
  if (s >= 60) return { bar: 'bg-orange-500', text: 'text-orange-600' }
  return        { bar: 'bg-red-500',   text: 'text-red-600'    }
}

// ─── ScoreBar ─────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const { bar, text } = scoreColor(score)
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-black w-9 text-right tabular-nums ${text}`}>
        {score} %
      </span>
    </div>
  )
}

// ─── DetailCell ───────────────────────────────────────────────────
function DetailCell({ compliant, total, expired }: { compliant: number; total: number; expired: number }) {
  const ratio = total > 0 ? compliant / total : 1
  const { text } = scoreColor(ratio >= 0.8 ? 80 : ratio >= 0.6 ? 60 : 0)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xs font-black tabular-nums ${text}`}>{compliant}/{total}</span>
      {expired > 0 && (
        <span className="text-[10px] font-bold text-red-500">
          {expired} exp.
        </span>
      )}
    </div>
  )
}

// ─── Colonnes ─────────────────────────────────────────────────────
const COLS = [
  { label: 'Agence',       align: 'left'   },
  { label: 'Conformité',   align: 'left'   },
  { label: 'Véhicules',    align: 'center' },
  { label: 'ARS',          align: 'center' },
  { label: 'CT',           align: 'center' },
  { label: 'Assurance',    align: 'center' },
  { label: 'Équipement',   align: 'center' },
]

// ─── Composant principal ──────────────────────────────────────────
interface AgencyScoreTableProps {
  scores: ComplianceScore[]
}

export default function AgencyScoreTable({ scores }: AgencyScoreTableProps) {
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">

          {/* En-tête */}
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {COLS.map((col, i) => (
                <th key={i}
                  className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                    col.align === 'center' ? 'text-center' : 'text-left'
                  }${i === 1 ? ' w-52' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Corps */}
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-12 text-center text-xs font-bold text-gray-400">
                  Aucune donnée de conformité disponible
                </td>
              </tr>
            )}
            {sorted.map((row, i) => {
              const rank = i + 1
              scoreColor(row.score)
              return (
                <tr key={row.agencyId}
                  className="hover:bg-violet-50/30 transition-colors duration-100 group">

                  {/* Agence + rang */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
                        rank === 1 ? 'bg-green-100 text-green-700' :
                        rank === 2 ? 'bg-gray-100 text-gray-500'  :
                        rank === 3 ? 'bg-orange-100 text-orange-700' :
                                     'bg-gray-50 text-gray-400'
                      }`}>
                        {rank}
                      </span>
                      <span className="text-xs font-bold text-gray-800">{row.agencyName}</span>
                    </div>
                  </td>

                  {/* Barre de score */}
                  <td className="px-4 py-3 w-52">
                    <ScoreBar score={row.score} />
                  </td>

                  {/* Nb véhicules */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-gray-700 tabular-nums">{row.vehicleCount}</span>
                  </td>

                  {/* ARS */}
                  <td className="px-4 py-3 text-center">
                    <DetailCell {...row.details.ARS} />
                  </td>

                  {/* CT */}
                  <td className="px-4 py-3 text-center">
                    <DetailCell {...row.details.CT} />
                  </td>

                  {/* Assurance */}
                  <td className="px-4 py-3 text-center">
                    <DetailCell {...row.details.ASSURANCE} />
                  </td>

                  {/* Équipement */}
                  <td className="px-4 py-3 text-center">
                    <DetailCell {...row.details.EQUIPEMENT} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
