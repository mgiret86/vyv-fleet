-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('AMBULANCE_A', 'AMBULANCE_B', 'VSL', 'TPMR', 'TAXI', 'SERVICE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'IMMOBILIZED', 'SOLD');

-- CreateEnum
CREATE TYPE "Energy" AS ENUM ('DIESEL', 'HYBRID', 'ELECTRIC', 'GASOLINE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'REGULATORY', 'SANITAIRE');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'THEFT', 'VANDALISM', 'BREAKDOWN');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'HYBRID', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('STRETCHER', 'DEFIBRILLATOR', 'OXYGEN', 'RADIO', 'GPS', 'FIRST_AID', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OK', 'WARNING', 'CRITICAL', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AlertCategory" AS ENUM ('ARS', 'CT', 'ASSURANCE', 'EQUIPEMENT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'AGENCY_MANAGER', 'STANDARD');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('view', 'create', 'edit', 'delete');

-- CreateEnum
CREATE TYPE "AppModule" AS ENUM ('dashboard', 'vehicles', 'maintenance', 'compliance', 'incidents', 'drivers', 'fuel', 'equipment', 'settings');

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" "AppModule" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_agencies" (
    "userId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,

    CONSTRAINT "user_agencies_pkey" PRIMARY KEY ("userId","agencyId")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "energy" "Energy" NOT NULL,
    "agencyId" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "monthlyLeaseCost" DOUBLE PRECISION,
    "arsApprovalExpiry" TIMESTAMP(3),
    "insuranceExpiry" TIMESTAMP(3) NOT NULL,
    "technicalInspectionExpiry" TIMESTAMP(3) NOT NULL,
    "nextMaintenanceDate" TIMESTAMP(3),
    "complianceScore" INTEGER NOT NULL DEFAULT 100,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "medicalExamDate" TIMESTAMP(3),
    "medicalExamExpiry" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenances" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "provider" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "realCost" DOUBLE PRECISION,
    "mileageAtMaintenance" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "declarationDate" TIMESTAMP(3) NOT NULL,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "driverResponsible" BOOLEAN NOT NULL DEFAULT false,
    "injuredPersons" INTEGER NOT NULL DEFAULT 0,
    "patientInVehicle" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyInvolved" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyInsurance" TEXT,
    "insuranceReference" TEXT,
    "estimatedRepairCost" DOUBLE PRECISION,
    "realRepairCost" DOUBLE PRECISION,
    "immobilizationDays" INTEGER,
    "repairProvider" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_incidents" (
    "driverId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,

    CONSTRAINT "driver_incidents_pkey" PRIMARY KEY ("driverId","incidentId")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "serialNumber" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OK',
    "installDate" TIMESTAMP(3),
    "lastCheckDate" TIMESTAMP(3),
    "nextCheckDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "maintenanceProvider" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_entries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "mileageAtFill" INTEGER NOT NULL,
    "distanceSinceLast" INTEGER NOT NULL DEFAULT 0,
    "consumption" DOUBLE PRECISION,
    "station" TEXT,
    "driverName" TEXT,
    "cardNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tco_entries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "monthlyLease" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyFuel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyMaintenance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyInsurance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyOther" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMonthlyCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tco_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" "AlertCategory" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_scores" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "globalScore" INTEGER NOT NULL DEFAULT 100,
    "arsScore" INTEGER NOT NULL DEFAULT 100,
    "ctScore" INTEGER NOT NULL DEFAULT 100,
    "insuranceScore" INTEGER NOT NULL DEFAULT 100,
    "equipmentScore" INTEGER NOT NULL DEFAULT 100,
    "openAlerts" INTEGER NOT NULL DEFAULT 0,
    "criticalAlerts" INTEGER NOT NULL DEFAULT 0,
    "resolvedAlerts" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_code_key" ON "agencies"("code");

-- CreateIndex
CREATE INDEX "agencies_isActive_idx" ON "agencies"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "permissions_roleId_idx" ON "permissions"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_roleId_module_action_key" ON "permissions"("roleId", "module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registration_key" ON "vehicles"("registration");

-- CreateIndex
CREATE INDEX "vehicles_agencyId_idx" ON "vehicles"("agencyId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_category_idx" ON "vehicles"("category");

-- CreateIndex
CREATE INDEX "vehicles_deletedAt_idx" ON "vehicles"("deletedAt");

-- CreateIndex
CREATE INDEX "vehicles_insuranceExpiry_idx" ON "vehicles"("insuranceExpiry");

-- CreateIndex
CREATE INDEX "vehicles_technicalInspectionExpiry_idx" ON "vehicles"("technicalInspectionExpiry");

-- CreateIndex
CREATE INDEX "drivers_agencyId_idx" ON "drivers"("agencyId");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "drivers"("status");

-- CreateIndex
CREATE INDEX "drivers_deletedAt_idx" ON "drivers"("deletedAt");

-- CreateIndex
CREATE INDEX "maintenances_vehicleId_idx" ON "maintenances"("vehicleId");

-- CreateIndex
CREATE INDEX "maintenances_agencyId_idx" ON "maintenances"("agencyId");

-- CreateIndex
CREATE INDEX "maintenances_status_idx" ON "maintenances"("status");

-- CreateIndex
CREATE INDEX "maintenances_scheduledDate_idx" ON "maintenances"("scheduledDate");

-- CreateIndex
CREATE INDEX "maintenances_type_idx" ON "maintenances"("type");

-- CreateIndex
CREATE INDEX "incidents_vehicleId_idx" ON "incidents"("vehicleId");

-- CreateIndex
CREATE INDEX "incidents_agencyId_idx" ON "incidents"("agencyId");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_date_idx" ON "incidents"("date");

-- CreateIndex
CREATE INDEX "equipment_vehicleId_idx" ON "equipment"("vehicleId");

-- CreateIndex
CREATE INDEX "equipment_agencyId_idx" ON "equipment"("agencyId");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "equipment_nextCheckDate_idx" ON "equipment"("nextCheckDate");

-- CreateIndex
CREATE INDEX "fuel_entries_vehicleId_idx" ON "fuel_entries"("vehicleId");

-- CreateIndex
CREATE INDEX "fuel_entries_agencyId_idx" ON "fuel_entries"("agencyId");

-- CreateIndex
CREATE INDEX "fuel_entries_date_idx" ON "fuel_entries"("date");

-- CreateIndex
CREATE INDEX "fuel_entries_fuelType_idx" ON "fuel_entries"("fuelType");

-- CreateIndex
CREATE UNIQUE INDEX "tco_entries_vehicleId_key" ON "tco_entries"("vehicleId");

-- CreateIndex
CREATE INDEX "tco_entries_agencyId_idx" ON "tco_entries"("agencyId");

-- CreateIndex
CREATE INDEX "alerts_vehicleId_idx" ON "alerts"("vehicleId");

-- CreateIndex
CREATE INDEX "alerts_agencyId_idx" ON "alerts"("agencyId");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_category_idx" ON "alerts"("category");

-- CreateIndex
CREATE INDEX "compliance_scores_agencyId_idx" ON "compliance_scores"("agencyId");

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_agencies" ADD CONSTRAINT "user_agencies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_agencies" ADD CONSTRAINT "user_agencies_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_incidents" ADD CONSTRAINT "driver_incidents_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_incidents" ADD CONSTRAINT "driver_incidents_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tco_entries" ADD CONSTRAINT "tco_entries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_scores" ADD CONSTRAINT "compliance_scores_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

