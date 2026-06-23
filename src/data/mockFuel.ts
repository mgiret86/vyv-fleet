export type FuelType = 'DIESEL' | 'HYBRID' | 'ELECTRIC'

export interface FuelEntry {
  id:                string
  vehicleId:         string
  vehicleRegistration: string
  agencyId:          string
  agencyName:        string
  date:              string
  liters:            number
  pricePerLiter:     number
  totalCost:         number
  mileageAtFill:     number
  distanceSinceLast: number
  consumption:       number | null
  fuelType:          FuelType
  station:           string
  driverName:        string
  cardNumber:        string
}

export interface TCOEntry {
  vehicleId:          string
  vehicleRegistration: string
  agencyId:           string
  agencyName:         string
  monthlyLease:       number
  monthlyFuel:        number
  monthlyMaintenance: number
  monthlyInsurance:   number
  monthlyOther:       number
  totalMonthlyCost:   number
  annualCost:         number
  costPerKm:          number
  mileage:            number
}

export const MOCK_FUEL_ENTRIES: FuelEntry[] = [
  { id: 'f1', vehicleId: 'v-1', vehicleRegistration: 'AB-123-CD', agencyId: 'ag1', agencyName: 'VYV Ambulance Lille',      date: '2026-04-10', liters: 65.4, pricePerLiter: 1.82, totalCost: 119.03, mileageAtFill: 87430, distanceSinceLast: 680, consumption: 9.6,  fuelType: 'DIESEL',   station: 'Total Lille Nord',     driverName: 'Jean Dupont',   cardNumber: 'FLEET-001' },
  { id: 'f2', vehicleId: 'v-2', vehicleRegistration: 'EF-456-GH', agencyId: 'ag1', agencyName: 'VYV Ambulance Lille',      date: '2026-04-09', liters: 48.2, pricePerLiter: 1.79, totalCost: 86.28,  mileageAtFill: 54210, distanceSinceLast: 520, consumption: 9.3,  fuelType: 'DIESEL',   station: 'BP Lille Sud',         driverName: 'Marie Martin',  cardNumber: 'FLEET-002' },
  { id: 'f3', vehicleId: 'v-3', vehicleRegistration: 'IJ-789-KL', agencyId: 'ag2', agencyName: 'VYV Ambulance Arras',      date: '2026-04-08', liters: 71.8, pricePerLiter: 1.81, totalCost: 129.96, mileageAtFill: 112650, distanceSinceLast: 740, consumption: 9.7, fuelType: 'DIESEL',   station: 'Intermarche Arras',   driverName: 'Pierre Bernard', cardNumber: 'FLEET-003' },
  { id: 'f4', vehicleId: 'v-4', vehicleRegistration: 'MN-012-OP', agencyId: 'ag4', agencyName: 'VYV Ambulance Nantes',     date: '2026-04-07', liters: 32.1, pricePerLiter: 1.80, totalCost: 57.78,  mileageAtFill: 43800, distanceSinceLast: 580, consumption: 5.5,  fuelType: 'HYBRID',   station: 'Total Nantes Est',     driverName: 'Sophie Leroy',  cardNumber: 'FLEET-004' },
  { id: 'f5', vehicleId: 'v-5', vehicleRegistration: 'QR-345-ST', agencyId: 'ag2', agencyName: 'VYV Ambulance Arras',      date: '2026-04-06', liters: 58.9, pricePerLiter: 1.82, totalCost: 107.20, mileageAtFill: 76200, distanceSinceLast: 610, consumption: 9.7,  fuelType: 'DIESEL',   station: 'Shell Arras Ouest',   driverName: 'Lucas Moreau',  cardNumber: 'FLEET-005' },
  { id: 'f6', vehicleId: 'v-6', vehicleRegistration: 'UV-678-WX', agencyId: 'ag3', agencyName: 'VYV Ambulance Rennes',     date: '2026-04-11', liters: 28.4, pricePerLiter: 1.79, totalCost: 50.84,  mileageAtFill: 31500, distanceSinceLast: 490, consumption: 5.8,  fuelType: 'HYBRID',   station: 'BP Rennes Centre',    driverName: 'Emma Petit',    cardNumber: 'FLEET-006' },
  { id: 'f7', vehicleId: 'v-8', vehicleRegistration: 'CD-234-EF', agencyId: 'ag5', agencyName: 'VYV Ambulance Marseille',  date: '2026-04-12', liters: 0,    pricePerLiter: 0,    totalCost: 18.50,  mileageAtFill: 22100, distanceSinceLast: 420, consumption: null, fuelType: 'ELECTRIC', station: 'Borne Ionity Marseille', driverName: 'Thomas Roux',  cardNumber: 'FLEET-007' },
  { id: 'f8', vehicleId: 'v-1', vehicleRegistration: 'AB-123-CD', agencyId: 'ag1', agencyName: 'VYV Ambulance Lille',      date: '2026-04-03', liters: 62.1, pricePerLiter: 1.80, totalCost: 111.78, mileageAtFill: 86750, distanceSinceLast: 650, consumption: 9.6,  fuelType: 'DIESEL',   station: 'Total Lille Nord',    driverName: 'Jean Dupont',   cardNumber: 'FLEET-001' },
]

export const MOCK_TCO: TCOEntry[] = [
  { vehicleId: 'v-1', vehicleRegistration: 'AB-123-CD', agencyId: 'ag1', agencyName: 'VYV Ambulance Lille',     monthlyLease: 1250, monthlyFuel: 450, monthlyMaintenance: 180, monthlyInsurance: 210, monthlyOther: 45, totalMonthlyCost: 2135, annualCost: 25620, costPerKm: 0.48, mileage: 87430 },
  { vehicleId: 'v-2', vehicleRegistration: 'EF-456-GH', agencyId: 'ag1', agencyName: 'VYV Ambulance Lille',     monthlyLease: 890,  monthlyFuel: 320, monthlyMaintenance: 95,  monthlyInsurance: 175, monthlyOther: 30, totalMonthlyCost: 1510, annualCost: 18120, costPerKm: 0.42, mileage: 54210 },
  { vehicleId: 'v-4', vehicleRegistration: 'MN-012-OP', agencyId: 'ag4', agencyName: 'VYV Ambulance Nantes',    monthlyLease: 1050, monthlyFuel: 210, monthlyMaintenance: 110, monthlyInsurance: 190, monthlyOther: 25, totalMonthlyCost: 1585, annualCost: 19020, costPerKm: 0.35, mileage: 43800 },
  { vehicleId: 'v-5', vehicleRegistration: 'QR-345-ST', agencyId: 'ag2', agencyName: 'VYV Ambulance Arras',     monthlyLease: 1180, monthlyFuel: 410, monthlyMaintenance: 145, monthlyInsurance: 205, monthlyOther: 40, totalMonthlyCost: 1980, annualCost: 23760, costPerKm: 0.44, mileage: 76200 },
  { vehicleId: 'v-6', vehicleRegistration: 'UV-678-WX', agencyId: 'ag3', agencyName: 'VYV Ambulance Rennes',    monthlyLease: 720,  monthlyFuel: 155, monthlyMaintenance: 65,  monthlyInsurance: 140, monthlyOther: 20, totalMonthlyCost: 1100, annualCost: 13200, costPerKm: 0.28, mileage: 31500 },
  { vehicleId: 'v-8', vehicleRegistration: 'CD-234-EF', agencyId: 'ag5', agencyName: 'VYV Ambulance Marseille', monthlyLease: 650,  monthlyFuel: 75,  monthlyMaintenance: 45,  monthlyInsurance: 125, monthlyOther: 15, totalMonthlyCost: 910,  annualCost: 10920, costPerKm: 0.22, mileage: 22100 },
]

// Alias requis par mock.ts : export { MOCK_TCO_ENTRIES }
export const MOCK_TCO_ENTRIES = MOCK_TCO

export const MOCK_FUEL_MONTHLY = [
  { month: 'Oct', cost: 4200 },
  { month: 'Nov', cost: 4650 },
  { month: 'Dec', cost: 5100 },
  { month: 'Jan', cost: 4380 },
  { month: 'Fev', cost: 4520 },
  { month: 'Mar', cost: 4790 },
]
