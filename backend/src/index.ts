import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Routes
import authRouter       from './routes/auth'
import vehiclesRouter   from './routes/vehicles'
import driversRouter    from './routes/drivers'
import maintenanceRouter from './routes/maintenance'
import incidentsRouter  from './routes/incidents'
import equipmentRouter  from './routes/equipment'
import fuelRouter       from './routes/fuel'
import alertsRouter     from './routes/alerts'
import agenciesRouter   from './routes/agencies'
import usersRouter      from './routes/users'
import dashboardRouter  from './routes/dashboard'
import rolesRouter      from './routes/roles'
import settingsRouter   from './routes/settings'

const app  = express()
app.set("trust proxy", 1)
const PORT = process.env.PORT ?? 3001

// ── Sécurité ──────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  message:  { success: false, error: 'Trop de requêtes, réessayez plus tard.' },
}))
app.use(express.json())

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ── Routes API ────────────────────────────────────────────────
app.use('/api/auth',        authRouter)
app.use('/api/vehicles',    vehiclesRouter)
app.use('/api/drivers',     driversRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/incidents',   incidentsRouter)
app.use('/api/equipment',   equipmentRouter)
app.use('/api/fuel',        fuelRouter)
app.use('/api/alerts',      alertsRouter)
app.use('/api/agencies',    agenciesRouter)
app.use('/api/users',       usersRouter)
app.use('/api/dashboard',   dashboardRouter)
app.use('/api/roles',       rolesRouter)
app.use('/api/settings',   settingsRouter)
app.use('/uploads',        express.static('public/uploads'))

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route introuvable' }))

// ── Démarrage ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Fleet API démarrée sur le port ${PORT}`)
  console.log(`   Environnement : ${process.env.NODE_ENV ?? 'development'}`)
})

export default app
