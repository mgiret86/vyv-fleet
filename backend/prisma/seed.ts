import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool   = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

async function main() {
  console.log('🌱 Seeding base de données...')

  // Agence par défaut
  const agency = await prisma.agency.upsert({
    where:  { code: 'VIENNE-86' },
    update: {},
    create: {
      name:    'Harmonie Ambulance Vienne',
      code:    'VIENNE-86',
      address: '1 Rue de la Santé',
      city:    'Poitiers',
      zipCode: '86000',
      phone:   '05 49 00 00 00',
      email:   'vienne@harmonie-ambulance.fr',
    },
  })
  console.log(`✅ Agence : ${agency.name}`)

  // Rôle Super Admin
  const adminRole = await prisma.role.upsert({
    where:  { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name:        'SUPER_ADMIN',
      description: 'Accès complet à toutes les fonctionnalités',
      isSystem:    true,
      color:       'red',
    },
  })
  console.log(`✅ Rôle : ${adminRole.name}`)

  // Utilisateur admin par défaut
  const passwordHash = await bcrypt.hash('Admin2024!', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@harmonie-ambulance.fr' },
    update: {},
    create: {
      firstName:    'Mickael',
      lastName:     'Giret',
      email:        'admin@harmonie-ambulance.fr',
      passwordHash,
      roleId:       adminRole.id,
      agencies: {
        create: [{ agencyId: agency.id }],
      },
    },
  })
  console.log(`✅ Utilisateur admin : ${admin.email}`)
  console.log(`   Mot de passe par défaut : Admin2024! (à changer immédiatement)`)

  console.log('\n🎉 Seed terminé avec succès !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
