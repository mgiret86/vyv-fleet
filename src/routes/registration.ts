import { Router }      from 'express'
import { prisma }      from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import type { Request, Response } from 'express'

const router = Router()
router.use(requireAuth)

const RAPIDAPI_HOST = 'api-de-plaque-d-immatriculation-france.p.rapidapi.com'
const API_URL       = `https://${RAPIDAPI_HOST}/`

async function getApiKey(): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: 'rapidapi_key' } })
  return row?.value && row.value.trim().length > 10 ? row.value.trim() : null
}



// POST /api/registration/test — teste la cle sauvegardee
router.post('/test', async (_req: Request, res: Response) => {
  try {
    const apiKey = await getApiKey()
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'NO_API_KEY' })
      return
    }
    const response = await fetch(`${API_URL}?plaque=AB-123-CD`, {
      method:  'GET',
      headers: {
        'x-rapidapi-key':  apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type':    'application/json',
      },
    })
    res.json({ success: response.ok, error: response.ok ? null : `Erreur ${response.status}` })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Erreur reseau' })
  }
})

// GET /api/registration/:plate
router.get('/:plate', async (req: Request, res: Response) => {
  try {
    const apiKey = await getApiKey()
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'NO_API_KEY' })
      return
    }
    const response = await fetch(`${API_URL}?plaque=${encodeURIComponent(req.params.plate)}`, {
      method:  'GET',
      headers: {
        'x-rapidapi-key':  apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type':    'application/json',
      },
    })
    if (!response.ok) {
      res.status(response.status).json({ success: false, error: `Erreur API ${response.status}` })
      return
    }
    const json = await response.json()
    res.json({ success: true, data: json })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})


export default router
