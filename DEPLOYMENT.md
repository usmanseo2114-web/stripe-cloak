# Deployment Instructions

This document provides instructions for deploying the Stripe Gateway Hub to various environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
   - [Docker Compose (Recommended for Development)](#docker-compose-recommended-for-development)
   - [Vercel Deployment](#vercel-deployment)
   - [Manual Server Deployment](#manual-server-deployment)
4. [Production Hardening Checklist](#production-hardening-checklist)
5. [Stripe Webhook Configuration](#stripe-webhook-configuration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have the following installed:
- Node.js (v20 or later)
- npm or pnpm
- PostgreSQL (v15 or later)
- Docker and Docker Compose (for Docker deployment)
- A Stripe account with access to the Dashboard

## Environment Setup

Copy the example environment file and configure it for your environment:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific values:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/stripe_gateway?schema=public` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (obtain from Stripe Dashboard) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret (obtain from Stripe Dashboard) | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | The public URL of your application (used for redirects) | `https://payments.example.com` |
| `NEXT_PUBLIC_API_URL` | The public URL of your API (usually same as APP_URL) | `https://payments.example.com/api` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_KEY_HASH_SALT_ROUNDS` | Number of salt rounds for bcrypt hashing API keys | `12` |
| `JWT_SECRET` | Secret for JWT tokens (if implemented) | `your_jwt_secret_here` |
| `REDIS_URL` | Redis connection string (if using Redis) | `redis://localhost:6379` |
| `NODE_ENV` | Node environment (`development`, `production`, `test`) | `production` |

## Deployment Options

### Docker Compose (Recommended for Development)

1. Start the services:
   ```bash
   docker-compose up -d
   ```

2. Wait for the containers to start, then run database migrations:
   ```bash
   docker-compose exec central-hub npx prisma migrate deploy
   ```

3. Seed the database with initial data (optional):
   ```bash
   docker-compose exec central-hub npm run seed
   ```

4. Access the application at `http://localhost:3000`

### Vercel Deployment

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Set environment variables in your Vercel project:
   - Go to your project settings in Vercel
   - Add the environment variables from your `.env` file (excluding `DATABASE_URL` if you're using a managed PostgreSQL service)
   - For `DATABASE_URL`, you'll need to set it to your managed PostgreSQL connection string

4. Deploy:
   ```bash
   vercel --prod
   ```

5. After deployment, run database migrations:
   ```bash
   vercel exec -- npx prisma migrate deploy
   ```

### Manual Server Deployment

1. Install Node.js dependencies:
   ```bash
   npm ci
   ```

2. Build the Next.js application:
   ```bash
   npm run build --workspace=packages/central-hub
   ```

3. Set up your environment variables (copy `.env.example` to `.env` and configure)

4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. Start the application:
   ```bash
   npm run start --workspace=packages/central-hub
   ```

6. Consider using a process manager like PM2 for production:
   ```bash
   npm i -g pm2
   pm2 start npm -- run start --workspace=packages/central-hub
   ```

## Production Hardening Checklist

### Security
- [ ] Use HTTPS in production (obtain SSL certificate from Let's Encrypt or similar)
- [ ] Ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are kept secret and never committed to version control
- [ ] Use strong, unique passwords for database and other services
- [ ] Enable automatic security updates for your server OS
- [ ] Configure a firewall to restrict access to necessary ports only (e.g., only allow 80/443 for web, 5432 for database from trusted IPs)
- [ ] Use HTTPS for all Stripe API calls (the Stripe Node SDK does this by default)
- [ ] Implement rate limiting on API endpoints (consider using Redis for distributed rate limiting)
- [ ] Use HTTP security headers (Helmet or similar) - Next.js provides some by default
- [ ] Regularly update dependencies to patch security vulnerabilities

### Data Protection
- [ ] Enable encryption at rest for your PostgreSQL database (if using a managed service, this is often provided)
- [ ] Enable SSL/TLS for database connections
- [ ] Regularly backup your database and store backups securely
- [ ] Test your backup restoration process
- [ ] Consider implementing data retention policies for old transactions

### Monitoring and Maintenance
- [ ] Set up monitoring for application uptime and response times
- [ ] Monitor database performance and storage usage
- [ ] Set up alerts for failed webhook deliveries
- [ ] Monitor Stripe API rate limits and errors
- [ ] Implement logging and log rotation
- [ ] Regularly review audit logs for suspicious activity
- [ ] Set up error tracking (e.g., Sentry) to capture exceptions

### Performance
- [ ] Enable Next.js production optimizations (automatic in `next start`)
- [ ] Consider using a CDN for static assets
- [ ] Enable HTTP/2 if possible
- [ ] Optimize database queries and add missing indexes based on usage patterns
- [ ] Consider using Redis for caching frequently accessed data (e.g., API key validation)

### Stripe Specific
- [ ] Use webhook signatures to verify event authenticity (already implemented)
- [ ] Implement idempotency keys for safe retries (already implemented in API)
- [ ] Test your integration in Stripe test mode before going live
- [ ] Use Stripe's Radar for fraud prevention
- [ ] Ensure your `success_url` and `cancel_url` use HTTPS in production
- [ ] Review Stripe's PCI compliance requirements (your integration should qualify for SAQ A-EP)

## Stripe Webhook Configuration

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select the events to listen for (we recommend all events related to Checkout, PaymentIntents, Subscriptions, Invoices, and Charges):
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
5. Click "Add endpoint"
6. Copy the "Signing secret" and set it as `STRIPE_WEBHOOK_SECRET` in your environment variables
7. Click "Test webhook" to verify your endpoint is working

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your `DATABASE_URL` is correct
   - Ensure PostgreSQL is running and accessible
   - Check that the database and user exist

2. **Stripe Authentication Errors**
   - Verify your `STRIPE_SECRET_KEY` is correct
   - Ensure you're using the correct key (test vs live)
   - Check that your Stripe account is activated

3. **Webhook Signature Verification Failures**
   - Verify your `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard
   - Ensure you're not modifying the request body before verification (our API route uses `bodyParser: false`)

4. **API Key Authentication Issues**
   - Ensure you're sending the `X-API-Key` header with your requests
   - Verify the API key belongs to an active tenant
   - Check that the tenant is active in the database

5. **Next.js Hydration Errors**
   - Ensure that any `useEffect` or client-side code that accesses `window` or `document` checks for undefined values
   - Use `typeof window !== 'undefined'` checks when needed

### Getting Help

If you encounter issues not covered here:
1. Check the application logs for error messages
2. Verify your environment variables are set correctly
3. Ensure all services (Postgres, Redis if used) are running
4. Consult the Stripe Dashboard for any error messages in the Developers > Logs section
5. Reach out to the community or check the GitHub issues for this project

## Updating the Application

To update to a new version of the Stripe Gateway Hub:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Install any new dependencies:
   ```bash
   npm ci
   ```

3. Run any new database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Rebuild the application (if needed):
   ```bash
   npm run build --workspace=packages/central-hub
   ```

5. Restart the application:
   ```bash
   # For Docker
   docker-compose restart central-hub
   
   # For PM2
   pm2 restart all
   
   # For manual server
   # Kill the process and start it again
   ```

## Backing Up and Restoring

### Database Backup

```bash
# Using pg_dump
pg_dump -U postgres -d stripe_gateway -f backup.sql

# Or using Docker
docker exec <postgres_container> pg_dump -U postgres -d stripe_gateway > backup.sql
```

### Database Restore

```bash
# Using psql
psql -U postgres -d stripe_gateway -f backup.sql

# Or using Docker
cat backup.sql | docker exec -i <postgres_container> psql -U postgres -d stripe_gateway
```

Note: Always test your backup and restore procedures in a non-production environment first.