import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample brands (Indian brands)
  const amulBrand = await prisma.brand.upsert({
    where: { name: 'Amul' },
    update: {},
    create: {
      name: 'Amul',
    },
  })

  const britanniaBrand = await prisma.brand.upsert({
    where: { name: 'Britannia' },
    update: {},
    create: {
      name: 'Britannia',
    },
  })

  const tataBrand = await prisma.brand.upsert({
    where: { name: 'Tata' },
    update: {},
    create: {
      name: 'Tata',
    },
  })

  const aashirvaadBrand = await prisma.brand.upsert({
    where: { name: 'Aashirvaad' },
    update: {},
    create: {
      name: 'Aashirvaad',
    },
  })

  // Create sample products (Indian products)
  const milk = await prisma.product.upsert({
    where: { name_brandId: { name: 'Full Cream Milk 1L', brandId: amulBrand.id } },
    update: {},
    create: {
      name: 'Full Cream Milk 1L',
      description: 'Fresh full cream milk',
      category: 'Dairy',
      brandId: amulBrand.id,
      barcode: '1234567890123',
    },
  })

  const bread = await prisma.product.upsert({
    where: { name_brandId: { name: 'White Bread 400g', brandId: britanniaBrand.id } },
    update: {},
    create: {
      name: 'White Bread 400g',
      description: 'Soft white bread',
      category: 'Bakery',
      brandId: britanniaBrand.id,
      barcode: '2345678901234',
    },
  })

  const tea = await prisma.product.upsert({
    where: { name_brandId: { name: 'Premium Tea 1kg', brandId: tataBrand.id } },
    update: {},
    create: {
      name: 'Premium Tea 1kg',
      description: 'Premium black tea',
      category: 'Beverages',
      brandId: tataBrand.id,
      barcode: '3456789012345',
    },
  })

  const atta = await prisma.product.upsert({
    where: { name_brandId: { name: 'Whole Wheat Atta 5kg', brandId: aashirvaadBrand.id } },
    update: {},
    create: {
      name: 'Whole Wheat Atta 5kg',
      description: 'Premium whole wheat flour',
      category: 'Grains',
      brandId: aashirvaadBrand.id,
      barcode: '4567890123456',
    },
  })

  // Create generic products without brands
  const bananas = await prisma.product.upsert({
    where: { name_brandId: { name: 'Bananas (per kg)', brandId: null } },
    update: {},
    create: {
      name: 'Bananas (per kg)',
      description: 'Fresh bananas',
      category: 'Produce',
      brandId: null,
    },
  })

  const eggs = await prisma.product.upsert({
    where: { name_brandId: { name: 'Eggs (dozen)', brandId: null } },
    update: {},
    create: {
      name: 'Eggs (dozen)',
      description: 'Fresh farm eggs',
      category: 'Dairy',
      brandId: null,
    },
  })

  const rice = await prisma.product.upsert({
    where: { name_brandId: { name: 'Basmati Rice 1kg', brandId: null } },
    update: {},
    create: {
      name: 'Basmati Rice 1kg',
      description: 'Premium basmati rice',
      category: 'Grains',
      brandId: null,
    },
  })

  console.log('Database seeded successfully!')
  console.log('Created brands:', { amulBrand, britanniaBrand, tataBrand, aashirvaadBrand })
  console.log('Created products:', { milk, bread, tea, atta, bananas, eggs, rice })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })