import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data (optional, but useful for development)
  await prisma.auditLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.tenant.deleteMany();

  const tenants = [
    { name: 'Essentials Store', slug: 'essentials-store', domain: 'essentials-store.example.com' },
    { name: 'Tech Gadgets', slug: 'tech-gadgets', domain: 'tech-gadgets.example.com' },
    { name: 'Fashion Hub', slug: 'fashion-hub', domain: 'fashion-hub.example.com' },
    { name: 'Home Decor', slug: 'home-decor', domain: 'home-decor.example.com' },
    { name: 'Fitness Gear', slug: 'fitness-gear', domain: 'fitness-gear.example.com' },
    { name: 'Book Nook', slug: 'book-nook', domain: 'book-nook.example.com' },
    { name: 'Pet Supplies', slug: 'pet-supplies', domain: 'pet-supplies.example.com' },
    { name: 'Art Studio', slug: 'art-studio', domain: 'art-studio.example.com' },
    { name: 'Food Market', slug: 'food-market', domain: 'food-market.example.com' },
    { name: 'Digital Downloads', slug: 'digital-downloads', domain: 'digital-downloads.example.com' },
  ];

  const createdTenants = await Promise.all(
    tenants.map(async (tenant) => {
      const generatedKey = `sk_live_${Math.random().toString(36).substring(2, 15)}`;
      const keyHash = await bcrypt.hash(generatedKey, 12);

      const createdTenant = await prisma.tenant.create({
        data: {
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          apiKeyHash: keyHash,
          branding: {
            primaryColor: '#3b82f6',
            logoUrl: 'https://example.com/logo.png',
          },
        },
      });

      // Create an API key record for the tenant (we'll return the plain key only once)
      await prisma.apiKey.create({
        data: {
          tenantId: createdTenant.id,
          keyHash: keyHash,
          active: true,
        },
      });

      // Create a sample one-time product
      await prisma.product.create({
        data: {
          tenantId: createdTenant.id,
          stripeProductId: `prod_${createdTenant.id}_oneTime`,
          stripePriceId: `price_${createdTenant.id}_oneTime`,
          name: `${tenant.name} - One-Time Product`,
          description: 'A sample one-time product',
          amount: 1000, // $10.00
          currency: 'usd',
          billingType: 'one_time',
          active: true,
        },
      });

      // Create a sample subscription product
      await prisma.product.create({
        data: {
          tenantId: createdTenant.id,
          stripeProductId: `prod_${createdTenant.id}_subscription`,
          stripePriceId: `price_${createdTenant.id}_subscription`,
          name: `${tenant.name} - Subscription Product`,
          description: 'A sample subscription product ($10/month)',
          amount: 1000, // $10.00
          currency: 'usd',
          billingType: 'subscription',
          active: true,
        },
      });

      return {
        ...createdTenant,
        plainApiKey: generatedKey, // Only for logging, never store this in production
      };
    })
  );

  console.log('Created tenants:');
  createdTenants.forEach((t) => {
    console.log(`- ${t.name} (${t.slug}): API Key: ${t.plainApiKey}`);
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });