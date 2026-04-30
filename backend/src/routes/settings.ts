import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { Request, Response } from 'express'

const router = Router()

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, 'logo' + ext)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

// GET /api/settings (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.appSetting.findMany()
    const settings: Record<string, string> = {}
    for (const r of rows) settings[r.key] = r.value
    res.json({ success: true, data: settings })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// PUT /api/settings
router.use(requireAuth)

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  if (!body || typeof body !== 'object') {
    res.status(400).json({ success: false, error: 'Body invalide' })
    return
  }
  try {
    for (const [key, value] of Object.entries(body)) {
      await prisma.appSetting.upsert({
        where:  { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
    res.json({ success: true, data: { saved: true } })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// POST /api/settings/logo
router.post('/logo', upload.single('logo'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'Fichier manquant ou format invalide' })
    return
  }
  try {
    const logoUrl = '/uploads/' + req.file.filename
    await prisma.appSetting.upsert({
      where:  { key: 'logoUrl' },
      update: { value: logoUrl },
      create: { key: 'logoUrl', value: logoUrl },
    })
    res.json({ success: true, data: { logoUrl } })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

export default router
