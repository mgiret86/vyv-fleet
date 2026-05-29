import { Router, Request, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

interface ImportRow {
  registration: string;
  agencyName: string;
  category: string;
  status: string;
  brand: string;
  model: string;
  energy: string;
  mileage: string;
  firstRegistrationDate: string;
  entryDate: string;
  technicalInspectionExpiry: string;
  taxiMeterControlExpiry: string;
  insuranceExpiry: string;
  arsApprovalExpiry: string;
  nextMaintenanceDate: string;
  monthlyLeaseCost: string;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { registration: string; reason: string }[];
}

const VALID_CATEGORIES = new Set([
  "AMBULANCE", "AMBULANCE_A", "AMBULANCE_B",
  "VSL", "TAXI", "TPMR", "VSL_TPMR", "TAXI_TPMR",
  "SERVICE", "FUNCTION", "FUNERAIRE", "OTHER"
]);

const VALID_STATUSES = new Set([
  "ACTIVE", "MAINTENANCE", "IMMOBILIZED",
  "PENDING_APPROVAL", "IN_TRANSFER"
]);

function parseDate(raw: string): Date | null {
  if (!raw || raw.trim() === "") return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseFloat2(raw: string): number {
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

function parseInt2(raw: string): number {
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

router.post(
  "/",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier recu." });
    }

    let rows: ImportRow[];
    try {
      const content = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, "");
      rows = parse(content, {
        delimiter: ",",
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as ImportRow[];
    } catch (err) {
      return res.status(422).json({ error: "Impossible de lire le fichier CSV.", detail: String(err) });
    }

    const result: ImportResult = { total: rows.length, imported: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      const reg = (row.registration || "").trim().toUpperCase();

      if (!reg) {
        result.skipped++;
        result.errors.push({ registration: "—", reason: "Immatriculation vide, ligne ignoree." });
        continue;
      }

      const category = (row.category || "OTHER").trim().toUpperCase();
      if (!VALID_CATEGORIES.has(category)) {
        result.skipped++;
        result.errors.push({ registration: reg, reason: `Categorie inconnue : ${category}` });
        continue;
      }

      const status = (row.status || "ACTIVE").trim().toUpperCase();
      const safeStatus = VALID_STATUSES.has(status) ? status : "ACTIVE";

      const agencyName = (row.agencyName || (row as any).agencyname || "").trim();
      if (!agencyName) {
        result.skipped++;
        result.errors.push({ registration: reg, reason: "agencyName manquant." });
        continue;
      }

      const agencyId = ((row as any).agencyid || "").trim();
      const agency = agencyId
        ? await (prisma as any).agency.findUnique({ where: { id: agencyId } })
        : await (prisma as any).agency.findFirst({ where: { name: agencyName } });
      if (!agency) {
        result.skipped++;
        result.errors.push({ registration: reg, reason: `Agence introuvable : ${agencyName}` });
        continue;
      }

      try {
        await (prisma as any).vehicle.upsert({
          where: { registration: reg },
          create: {
            registration: reg,
            brand: row.brand || "",
            model: row.model || "",
            category: category as any,
            status: safeStatus as any,
            agency: { connect: { id: agency.id } },
            energy: (row.energy || "DIESEL").trim().toUpperCase() as any,
            mileage: parseInt2(row.mileage),
            firstRegistrationDate: parseDate(row.firstRegistrationDate || (row as any).firstregistrationdate),
            entryDate: parseDate(row.entryDate || (row as any).entrydate),
            technicalInspectionExpiry: parseDate(row.technicalInspectionExpiry || (row as any).technicalinspectionexpiry),
            taxiMeterControlExpiry: parseDate(row.taxiMeterControlExpiry || (row as any).taximetercontrolexpiry),
            insuranceExpiry: parseDate(row.insuranceExpiry || (row as any).insuranceexpiry),
            arsApprovalExpiry: parseDate(row.arsApprovalExpiry || (row as any).arsapprovalexpiry),
            nextMaintenanceDate: parseDate(row.nextMaintenanceDate || (row as any).nextmaintenancedate),
            monthlyLeaseCost: (row.monthlyLeaseCost || (row as any).monthlyleasecost) ? parseFloat2(row.monthlyLeaseCost || (row as any).monthlyleasecost) : null,
          },
          update: {
            brand: row.brand || "",
            model: row.model || "",
            category: category as any,
            status: safeStatus as any,
            agency: { connect: { id: agency.id } },
            energy: (row.energy || "DIESEL").trim().toUpperCase() as any,
            mileage: parseInt2(row.mileage),
            firstRegistrationDate: parseDate(row.firstRegistrationDate || (row as any).firstregistrationdate),
            entryDate: parseDate(row.entryDate || (row as any).entrydate),
            technicalInspectionExpiry: parseDate(row.technicalInspectionExpiry || (row as any).technicalinspectionexpiry),
            taxiMeterControlExpiry: parseDate(row.taxiMeterControlExpiry || (row as any).taximetercontrolexpiry),
            insuranceExpiry: parseDate(row.insuranceExpiry || (row as any).insuranceexpiry),
            arsApprovalExpiry: parseDate(row.arsApprovalExpiry || (row as any).arsapprovalexpiry),
            nextMaintenanceDate: parseDate(row.nextMaintenanceDate || (row as any).nextmaintenancedate),
            monthlyLeaseCost: (row.monthlyLeaseCost || (row as any).monthlyleasecost) ? parseFloat2(row.monthlyLeaseCost || (row as any).monthlyleasecost) : null,
          },
        });
        result.imported++;
      } catch (err) {
        result.errors.push({ registration: reg, reason: `Erreur base de donnees : ${String(err)}` });
      }
    }

    return res.json(result);
  }
);

export default router;
