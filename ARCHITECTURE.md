# Stripe Gateway Hub - Architecture Overview

## System Context

The Stripe Gateway Hub is a centralized payment platform that manages Stripe transactions for multiple websites through a single Stripe account. It eliminates the need for individual websites to handle Stripe secret keys directly, improving security and simplifying PCI compliance boundaries.

### Actors
- **End Customers**: Visit merchant websites and complete payments via Stripe Checkout
- **Website Owners/Admins**: Configure the plugin/SDK with Hub URL and API Key
- **Platform Administrators**: Manage the central hub through the admin dashboard
- **Stripe**: Payment processor that handles actual transactions and sends webhooks

### External Systems
- **Stripe API**: Payment processing, customer management, subscription billing
- **PostgreSQL**: Primary data storage for tenants, products, orders, etc.
- **Redis** (Optional): Caching, rate limiting, background job queuing
- **Web Browsers**: For admin dashboard and customer-facing Stripe Checkout
- **Email Services**: Optional for sending receipts/notifications

## Architectural Style

**Multi-Tenant Service-Oriented Architecture** with clear separation of concerns:

1. **Presentation Layer**: Next.js React application (admin dashboard)
2. **Application Layer**: RESTful API routes handling business logic
3. **Domain Layer**: Service classes encapsulating Stripe and business operations
4. **Data Access Layer**: Prisma ORM with PostgreSQL
5. **Integration Layer**: Stripe Node SDK for payment processing
6. **Infrastructure Layer**: Docker, environment configuration, monitoring

## Key Architectural Decisions

### 1. Multi-Tenant Data Isolation
- **Approach**: Shared database with tenant_id foreign keys on all relevant tables
- **Alternative Considered**: Separate schemas/databases per tenant
- **Justification**: Simpler backup/restore, easier cross-tenant analytics, lower operational overhead
- **Mitigation**: Row-level security via automatic tenant scoping in Prisma middleware

### 2. API-First Design
- All functionality available through REST API
- Plugin/SDK and admin dashboard both consume the same API
- Enables future mobile apps, marketing integrations, etc.

### 3. Webhook-Centric Event Processing
- Stripe webhooks are the source of truth for payment status
- API endpoints create intentions; webhooks confirm outcomes
- Prevents race conditions between API responses and actual payments

### 4. Secure Secret Management
- Stripe secret keys stored only in environment variables
- Never exposed to frontend or logged
- API keys for tenant authentication are hashed in database (bcrypt)

### 5. Idempotency by Design
- All mutating endpoints support Idempotency-Key header
- Webhook processing tracks processed event IDs
- Safe to retry requests without duplicate side effects

## Component Diagram

```
┌─────────────────┐    ┌─────────────────────┐    ┌────────────────────┐
│   End User      │    │ Merchant Website    │    │   Stripe Gateway   │
│                 ◄───►│  (with Plugin/SDK)  │    │    Central Hub     │
│                 │    └─────────────────────┘    │                    │
│                 │                               │  ┌─────────────┐  │
│                 │                               │  │  API Layer  │  │
┌─────────────┐   │                               │  └─────────────┘  │
│             │   │                           ┌─►│  Service Layer  │  │
│Stripe      │   │                           │  │  └─────────────┘  │
│Checkout    │   │                           │  │  ┌─────────────┐  │
│Redirect    │   │                           │  │  │Stripe SDK │  │
│◄──────────┘   │                           │  │  └─────────────┘  │
│             │   │                           │  │  ┌─────────────┐  │
└─────────────┘   │                           │  │  │Repository │  │
                  │                           │  │  └─────────────┘  │
                  │                           │  │  ┌─────────────┐  │
┌─────────────┐   │                           │  │  │  Prisma   │  │
│ Admin       │◄──┘                           │  │  └─────────────┘  │
│Dashboard    │                               │  │  ┌─────────────┐  │
│             │                               └──►│ PostgreSQL    │  │
└─────────────┘                                   │  └─────────────┘  │
                                                  │                 │
                                                  │  ┌─────────────┐  │
                                                  └────►│   Redis     │  │
                                                    │  (Optional)   │  │
                                                    └─────────────┘  │
                                                    │                 │
                                                    │  ┌─────────────┐  │
                                                    └────►│  Stripe API │  │
                                                          └─────────────┘
```

## Data Flow

### Payment Initiation Flow
1. Customer clicks "Pay" on merchant website
2. Plugin/SDK collects payment details and calls `POST /api/plugin/create-checkout`
3. Central Hub:
   - Validates API key and identifies tenant
   - Validates request with Zod schema
   - Creates Order record (pending)
   - Calls Stripe to create Checkout Session
   - Returns checkout URL to plugin
4. Plugin redirects customer to Stripe Checkout
5. Customer completes payment on Stripe hosted page

### Webhook Processing Flow
1. Stripe sends webhook to `POST /api/stripe/webhook`
2. Central Hub:
   - Verifies webhook signature
   - Checks if event already processed (idempotency)
   - Routes event to appropriate handler based on type
   - Updates database records (Order, Subscription, Customer, etc.)
   - Marks event as processed
   - Returns 200 to Stripe

### Status Query Flow
1. Merchant website calls `GET /api/plugin/order-status?orderId=ord_123`
2. Central Hub:
   - Validates API key and identifies tenant
   - Retrieves order with tenant scoping
   - Returns current status and payment details

## Security Boundaries

### Trust Boundaries
- **Browser ↔ Hub**: HTTPS only, sensitive operations require authentication
- **Hub ↔ Stripe**: Mutual TLS via API keys, webhook signatures
- **Hub ↔ Database**: Connection pooling, parameterized queries prevent injection
- **Plugin ↔ Hub**: API key authentication, rate limiting

### Data Classification
- **Public**: Merchant names, product names, general analytics
- **Internal**: API keys (hashed), order metadata, tenant configuration
- **Confidential**: Stripe secret keys (env only), webhook signing secrets
- **Restricted**: Never stored: full card numbers, CVV (handled entirely by Stripe)

## Scalability Considerations

### Horizontal Scaling
- Stateless API layer can be scaled behind load balancer
- Shared database connection pooling
- Redis for distributed rate limiting and caching
- Webhook processing can be scaled with message queues (future enhancement)

### Database Optimization
- Indexes on tenant_id + commonly queried fields
- Read replicas for analytics/dashboard queries (future)
- Archiving old transactions to cold storage (future)

### Caching Strategy
- API key validation cached briefly (Redis)
- Product catalog caching per tenant
- Rate limiting counters in Redis
- Stripe API responses generally not cached (real-time data needed)

## Deployment Architecture

### Development
- Docker Compose with PostgreSQL, optional Redis
- Next.js dev server with hot reloading
- Local Stripe CLI for webhook testing

### Production
- **Vercel**: For Next.js frontend and API routes (serverless functions)
- **Managed PostgreSQL**: Supabase, AWS RDS, or similar
- **Managed Redis** (Optional): Upstash or AWS ElastiCache
- **Stripe Dashboard**: Configure webhooks to point to production URL
- **Environment Variables**: Stored securely in platform secrets

### Docker Alternative
- Single docker-compose stack for self-hosted deployments
- Nginx reverse proxy for SSL termination
- Health checks and restart policies
- Log aggregation via standardized format

## Technological Rationale

### Next.js 15
- App Router for improved server components and streaming
- API Routes for backend without separate server
- Excellent TypeScript support
- Built-in optimization (images, fonts, etc.)
- Vercel first-class support

### TypeScript
- End-to-end type safety
- Better IDE support and refactoring
- Catches bugs at compile time
- Self-documenting code

### Prisma ORM
- Type-safe database access
- Automatic migration generation
- Powerful query capabilities
- Excellent documentation and community

### Stripe Node SDK
- Official, well-maintained library
- Full coverage of Stripe API
- TypeScript definitions
- Handles API versioning and compatibility

### Tailwind CSS + Shadcn UI
- Utility-first CSS for rapid UI development
- Predesigned, accessible components
- Consistent design system
- Small bundle sizes with proper purging

### Vitest/Playwright
- Fast unit testing
- Reliable end-to-end testing
- Excellent developer experience
- Integration with CI/CD pipelines

## Future Extensibility

### Planned Features
- Multiple Stripe accounts per tenant (connected accounts)
- Advanced fraud detection integrations
- Alternative payment methods (PayPal, Apple Pay, etc.)
- Multi-currency display and automatic conversion
- Tax calculation outsourcing (Avalara, TaxJar)
- Customer loyalty and discount programs
- Advanced analytics and cohort analysis

### Architectural Hooks
- Webhook handler plugin system
- Payment method provider abstraction
- Notification service interface (email, SMS, webhook)
- Audit logging middleware
- Feature flag system for gradual rollouts

## Compliance and Governance

### PCI DSS Scope Reduction
- Merchant websites never handle card data
- All payment processing occurs in Stripe-hosted iframe
- Central hub only handles non-sensitive payment metadata
- Annual SAQ A-EP applicable for hub (minimal controls)

### Data Protection
- GDPR-ready data deletion APIs
- Data export capabilities for tenants
- Configurable data retention policies
- Encryption at rest for sensitive fields (planned)

### Monitoring and Observability
- Structured logging with correlation IDs
- API metrics (latency, error rates, throughput)
- Database query performance monitoring
- Stripe API rate limit tracking
- Health check endpoints
- Alerting on webhook delivery failures

---
*This architecture document provides the foundation for building a secure, scalable, multi-tenant payment platform. Subsequent phases will implement each component according to these specifications.*