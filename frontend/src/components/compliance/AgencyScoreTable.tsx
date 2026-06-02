import type { ComplianceScore } from '@/types'

interface AgencyScoreTableProps {
  scores: ComplianceScore[]
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-10 text-right ${
        score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange-600' : 'text-red-600'
      }`}>
        {score}%
      </span>
    </div>
  )
}

function DetailCell({ compliant, total, expired }: { compliant: number; total: number; expired: number }) {
  return (
    <div className="text-xs">
      <span className="font-medium text-gray-800">{compliant}/{total}</span>
      {expired > 0 && (
        <span className="ml-1 text-red-600 font-semibold">({expired} exp.)</span>
      )}
    </div>
  )
}

export default function AgencyScoreTable({ scores }: AgencyScoreTableProps) {
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Agence</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 w-48">Score conformite</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">VH</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">ARS</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">CT</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Assurance</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Equipement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, i) => (
              <tr key={row.agencyId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.agencyName}</td>
                <td className="px-4 py-3">
                  <ScoreBar score={row.score} />
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{row.vehicleCount}</td>
                <td className="px-4 py-3 text-center">
                  <DetailCell {...row.details.ARS} />
                </td>
                <td className="px-4 py-3 text-center">
                  <DetailCell {...row.details.CT} />
                </td>
                <td className="px-4 py-3 text-center">
                  <DetailCell {...row.details.ASSURANCE} />
                </td>
                <td className="px-4 py-3 text-center">
                  <DetailCell {...row.details.EQUIPEMENT} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
