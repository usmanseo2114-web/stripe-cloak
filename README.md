# Stripe Gateway Hub

A production-ready, enterprise-grade multi-tenant payment platform that centrally manages Stripe credentials, products, subscriptions, customers, orders, and analytics for multiple websites.

## Overview

The Stripe Gateway Hub is a centralized web application that securely stores and manages all Stripe credentials, products, subscriptions, customers, orders, and analytics for up to 10 different websites. Each website connects via a lightweight plugin/SDK using an API key, ensuring that individual websites never store Stripe secret keys.

### Key Features

- **Multi-tenant Architecture**: Securely manage multiple websites (tenants) from a single hub
- **Secure API Key Authentication**: Websites authenticate using API keys (hashed in database)
- **Stripe Integration**: Full support for Checkout Sessions, Subscriptions, Refunds, and Webhooks
- **Admin Dashboard**: Comprehensive UI to manage tenants, products, customers, orders, and view analytics
- **Client SDK**: TypeScript/JavaScript SDK for easy integration
- **WordPress Plugin**: Ready-to-use WordPress plugin for seamless integration
- **Docker Support**: Easy deployment with Docker Compose
- **Comprehensive Testing**: Unit tests, integration tests, and end-to-end tests

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- PostgreSQL (v15 or later)
- Docker and Docker Compose (for Docker deployment)
- A Stripe account with access to the Dashboard

### Quick Start with Docker Compose

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd StripeGatewayHub
   ```

2. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   # Edit .env with your Stripe keys and database credentials
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Wait for the containers to start, then run database migrations:
   ```bash
   docker-compose exec central-hub npx prisma migrate deploy
   ```

5. Seed the database with initial data (optional but recommended):
   ```bash
   docker-compose exec central-hub npm run seed
   ```

6. Access the application at `http://localhost:3000`
   - Admin dashboard: `http://localhost:3000/dashboard`
   - API documentation: Available via the API endpoints

### Manual Setup

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Set up your environment variables (copy `.env.example` to `.env` and configure)

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Seed the database (optional):
   ```bash
   npm run seed
   ```

5. Start the application:
   ```bash
   npm run dev
   ```

## Project Structure

```
StripeGatewayHub/
├── packages/
│   ├── central-hub/          # Main Next.js application
│   │   ├── app/              # Next.js app router
│   │   │   ├── api/          # API routes
│   │   │   │   ├── plugin/   # Tenant-facing API endpoints
│   │   │   │   └── stripe/   # Stripe webhook endpoint
│   │   │   ├── dashboard/    # Admin dashboard pages
│   │   │   └── layout.tsx    # Root layout
│   │   ├── components/       # Shared React components
│   │   ├── lib/              # Utility functions and services
│   │   │   ├── stripe/       # Stripe service layer
│   │   │   ├── auth/         # Tenant authentication middleware
│   │   │   ├── prisma/       # Prisma client extension
│   │   │   └── validation/   # Zod validation schemas
│   │   ├── prisma/           # Prisma schema and migrations
│   │   ├── public/           # Static assets
│   │   ├── styles/           # Global styles
│   │   ├── types/            # TypeScript type definitions
│   │   ├── .env.example      # Environment variables template
│   │   ├── next.config.js    # Next.js configuration
│   │   ├── package.json      
│   │   └── tsconfig.json     
│   └── sdk/                  # JavaScript/TypeScript SDK package
│       ├── src/
│       │   ├── index.ts      # Main export
│       │   ├── StripeGateway.ts # SDK class
│       │   └── types/        # TypeScript types
│       ├── package.json
│       └── tsconfig.json
├── wordpress-plugin/         # WordPress plugin
│   ├── stripe-gateway-connector.php
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── includes/
│   │   ├── admin/
│   │   ├── shortcodes/
│   │   └── rest-api/
│   ├── languages/
│   └── README.md
├── prisma/                   # Prisma schema (shared)
│   ├── schema.prisma
│   └── migrations/
├── infra/                    # Infrastructure and deployment
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── scripts/
├── scripts/                  # Utility scripts
│   ├── setup.sh
│   ├── seed.ts
│   └── dev.sh
├── .gitignore
├── README.md
├── DEPLOYMENT.md             # Detailed deployment instructions
├── ARCHITECTURE.md           # Detailed architecture overview
└── package.json              # Root package (for workspaces)
```

## API Endpoints

All tenant-facing endpoints require `X-API-Key` header:
- `POST /api/plugin/connect` - Verify tenant connection
- `POST /api/plugin/create-checkout` - Create Stripe Checkout Session
- `POST /api/plugin/create-subscription` - Create subscription
- `POST /api/plugin/cancel-subscription` - Cancel subscription
- `POST /api/plugin/refund` - Refund payment
- `GET /api/plugin/order-status` - Check order status
- `GET /api/plugin/orders` - List tenant orders
- `GET /api/plugin/revenue` - Get revenue analytics
- `POST /api/stripe/webhook` - Stripe webhook endpoint (no auth, uses signature verification)

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL, Stripe Node SDK, Redis (optional)
- **Authentication**: API key based for plugins
- **Infrastructure**: Docker, Docker Compose, Vercel-ready
- **Testing**: Vitest, Playwright, Supertest

## License

MIT