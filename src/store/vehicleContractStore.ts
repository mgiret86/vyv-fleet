import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VehicleContract, VehicleContractType, ContractStatus } from '@/types'
import { MOCK_CONTRACTS } from '@/data/mockContracts'

// ─── Flag environnement (identique à dataService) ─────────────────────────────
const USE_MOCK = true

function fakeFetch<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), 150))
}

function generateId(): string {
  return `contract-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function now(): string { return new Date().toISOString() }

function computeContractedKmTotal(
  contractedKmPerYear: number | null,
  durationMonths: number,
): number | null {
  if (!contractedKmPerYear) return null
  return Math.round(contractedKmPerYear * durationMonths / 12)
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ContractFormData {
  vehicleId:            string
  type:                 VehicleContractType
  status:               ContractStatus
  lessorName:           string
  contractRef:          string
  startDate:            string
  endDate:              string
  durationMonths:       number
  monthlyRentHT:        number
  deposit:              number
  residualValue:        number | null
  startMileage:         number | null
  contractedKmPerYear:  number | null
  excessKmCostPerKm:    number | null
  monthlyInsuranceCost: number | null
  includedServices:     VehicleContract['includedServices']
  notes:                string | null
}

export interface KmStatus {
  contractKmDone:     number
  contractKmLeft:     number | null
  contractKmOverrun:  number | null
  projectedOverrun:   number | null
  excessCostEstimate: number | null
  progressPct:        number
}

// ─── Service contrats (bascule DEV/PROD) ─────────────────────────────────────
export const contractService = {
  list: (): Promise<VehicleContract[]> => {
    if (USE_MOCK) return fakeFetch(MOCK_CONTRACTS)
    // TODO: return get<VehicleContract[]>('/contracts')
    return fakeFetch(MOCK_CONTRACTS)
  },
  create: (data: ContractFormData): Promise<VehicleContract> => {
    if (USE_MOCK) {
      console.info('[MOCK] createContract', data)
      const contract: VehicleContract = {
        ...data,
        id: generateId(),
        contractedKmTotal: computeContractedKmTotal(data.contractedKmPerYear, data.durationMonths),
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      }
      return fakeFetch(contract)
    }
    // TODO: return post<VehicleContract>('/contracts', data)
    return fakeFetch({} as VehicleContract)
  },
  update: (id: string, data: Partial<ContractFormData>): Promise<VehicleContract> => {
    if (USE_MOCK) {
      console.info('[MOCK] updateContract', id, data)
      return fakeFetch({ ...data, id, updatedAt: now() } as VehicleContract)
    }
    // TODO: return put<VehicleContract>(`/contracts/${id}`, data)
    return fakeFetch({} as VehicleContract)
  },
  terminate: (id: string): Promise<void> => {
    if (USE_MOCK) {
      console.info('[MOCK] terminateContract', id)
      return fakeFetch(undefined as void)
    }
    // TODO: return put<void>(`/contracts/${id}/terminate`, {})
    return fakeFetch(undefined as void)
  },
  remove: (id: string): Promise<void> => {
    if (USE_MOCK) {
      console.info('[MOCK] deleteContract', id)
      return fakeFetch(undefined as void)
    }
    // TODO: return del<void>(`/contracts/${id}`)
    return fakeFetch(undefined as void)
  },
}

// ─── Store Zustand ────────────────────────────────────────────────────────────
interface VehicleContractState {
  contracts:   VehicleContract[]
  isLoading:   boolean
  error:       string | null

  fetchContracts:    ()                                              => Promise<void>
  getByVehicle:      (vehicleId: string)                            => VehicleContract[]
  getActive:         (vehicleId: string)                            => VehicleContract | undefined
  getContract:       (id: string)                                   => VehicleContract | undefined
  addContract:       (data: ContractFormData)                       => Promise<VehicleContract>
  updateContract:    (id: string, data: Partial<ContractFormData>)  => Promise<void>
  terminateContract: (id: string)                                   => Promise<void>
  removeContract:    (id: string)                                   => Promise<void>
  computeKmStatus:   (contract: VehicleContract, currentMileage: number) => KmStatus
}

export const useVehicleContractStore = create<VehicleContractState>()(
  persist(
    (set, get) => ({
      contracts: [],
      isLoading: false,
      error:     null,

      fetchContracts: async () => {
    const existing = get().contracts
  
  // En mode mock, ne charge les données initiales que si le store est vide
  // Cela évite d'écraser les modifications faites localement
  if (USE_MOCK && existing.length > 0) {
    return
  }

  set({ isLoading: true, error: null })
  try {
    const contracts = await contractService.list()
    set({ contracts, isLoading: false })
  } catch (err: unknown) {
    set({ error: err instanceof Error ? err.message : 'Erreur', isLoading: false })
  }
},

      getByVehicle: (vehicleId) =>
        get().contracts
          .filter((c) => c.vehicleId === vehicleId)
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),

      getActive: (vehicleId) =>
        get().contracts.find(
          (c) => c.vehicleId === vehicleId && c.isActive && c.status === 'ACTIVE'
        ),

      getContract: (id) =>
        get().contracts.find((c) => c.id === id),

      addContract: async (data) => {
        const contract = await contractService.create(data)
        set((s) => ({ contracts: [...s.contracts, contract] }))
        return contract
      },

      updateContract: async (id, data) => {
        await contractService.update(id, data)
        set((s) => ({
          contracts: s.contracts.map((c) => {
            if (c.id !== id) return c
            const updated = { ...c, ...data, updatedAt: now() }
            if (data.contractedKmPerYear !== undefined || data.durationMonths !== undefined) {
              updated.contractedKmTotal = computeContractedKmTotal(
                updated.contractedKmPerYear,
                updated.durationMonths,
              )
            }
            return updated
          }),
        }))
      },

      terminateContract: async (id) => {
        await contractService.terminate(id)
        set((s) => ({
          contracts: s.contracts.map((c) =>
            c.id !== id ? c : { ...c, status: 'TERMINATED', isActive: false, updatedAt: now() }
          ),
        }))
      },

      removeContract: async (id) => {
        await contractService.remove(id)
        set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }))
      },

      computeKmStatus: (contract, currentMileage): KmStatus => {
        const empty: KmStatus = {
          contractKmDone: 0, contractKmLeft: null, contractKmOverrun: null,
          projectedOverrun: null, excessCostEstimate: null, progressPct: 0,
        }
        if (
          contract.startMileage == null ||
          !contract.contractedKmTotal ||
          !contract.contractedKmPerYear
        ) return empty

        const contractKmDone   = Math.max(0, currentMileage - contract.startMileage)
        const contractKmLeft   = contract.contractedKmTotal - contractKmDone
        const contractKmOverrun = contractKmLeft < 0 ? Math.abs(contractKmLeft) : null

        const start    = new Date(contract.startDate)
        const end      = new Date(contract.endDate)
        const today    = new Date()
        const doneDays = Math.max(1, (today.getTime() - start.getTime()) / 86400000)
        const leftDays = Math.max(0, (end.getTime() - today.getTime()) / 86400000)

        const kmPerDay         = contractKmDone / doneDays
        const projectedTotal   = contractKmDone + kmPerDay * leftDays
        const projectedOverrun = projectedTotal > contract.contractedKmTotal
          ? Math.round(projectedTotal - contract.contractedKmTotal)
          : null

        const excessCostEstimate =
          projectedOverrun && contract.excessKmCostPerKm
            ? Math.round(projectedOverrun * contract.excessKmCostPerKm)
            : null

        const progressPct = Math.min(
          100,
          Math.round((contractKmDone / contract.contractedKmTotal) * 100)
        )

        return {
          contractKmDone, contractKmLeft, contractKmOverrun,
          projectedOverrun, excessCostEstimate, progressPct,
        }
      },
    }),
    { name: 'vyv-vehicle-contracts', version: 1 }
  )
)
