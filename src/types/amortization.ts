// ─── Source d'un amortissement ────────────────────────────────────
export type AmortizationSource = 'CREDIT_BAIL' | 'MAINTENANCE'

// ─── Statut ───────────────────────────────────────────────────────
export type AmortizationStatus = 'ACTIVE' | 'CLOSED'

// ─── Entrée mensuelle calculée ────────────────────────────────────
export interface AmortizationEntry {
  month:      string   // Format ISO "YYYY-MM"
  dotation:   number   // Montant de la dotation mensuelle (amount / durationMonths)
  cumul:      number   // Cumul des dotations depuis le début
  remaining:  number   // Montant restant à amortir
}

// ─── Amortissement ────────────────────────────────────────────────
export interface Amortization {
  id:             string
  vehicleId:      string
  source:         AmortizationSource
  sourceId:       string            // id du contrat (CREDIT_BAIL) ou id de la maintenance
  reference:      string            // Référence comptable
  label:          string            // Libellé descriptif
  amount:         number            // Montant total à amortir
  startDate:      string            // ISO date — début de l'amortissement
  durationMonths: number            // Durée en mois (1-36 pour maintenance, 12-24 pour VR)
  status:         AmortizationStatus
  closedAt:       string | null     // ISO date — date de clôture anticipée (cession)
  entries:        AmortizationEntry[] // Dotations mensuelles calculées
  createdAt:      string
  updatedAt:      string
}

// ─── Données pour créer un amortissement ─────────────────────────
export interface AmortizationFormData {
  vehicleId:      string
  source:         AmortizationSource
  sourceId:       string
  reference:      string
  label:          string
  amount:         number
  startDate:      string
  durationMonths: number
}
