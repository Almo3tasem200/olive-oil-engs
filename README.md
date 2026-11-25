# El Mohandeseen Olive Oil Store

Arabic-first e-commerce application for El Mohandeseen Olive Oil.

## Current state

Initial catalog prices are stored in the database seed, not in the storefront: 500 ml EGP 275, 1 liter EGP 550, and 12 liters EGP 6,100. Prices remain owner-managed. The supplied reference storefront provides a brand logo and matching 500 ml / 1 liter product photos; the owner-supplied 12 liter jerrycan photo is also included. Importing the assets publishes their matching products without changing their database prices.

The seed configures free delivery in New Cairo, EGP 50 for the rest of Cairo, and EGP 80 for Giza. Review the exact delivery coverage with the business owner before production. Cash on delivery is enabled by default, but confirm its operational policy before launch. A direct WhatsApp contact link can be shown; no messaging API, email service, or payment provider is configured by default.

## Store pages

The Arabic storefront is the default language; English pages use the `/en` prefix. Each page has one purpose:

- Home (`/`): short introduction, olive oil information, and featured products.
- Products (`/products`) and product details (`/products/:slug`): the complete catalog and an individual item's information.
- How to order (`/how-to-order`): the ordering steps.
- Delivery (`/delivery`): published areas, fees, and delivery policy.
- FAQ (`/faq`): account, order, delivery, and payment answers.
- About (`/about`): store information and configured contact options.
- Cart, checkout, customer account, privacy, and terms have their own pages as needed.

The header links to the main shopping and help pages, and the footer groups store information, contact methods, and configured policies. English pages mirror the same structure under `/en`.

## Project structure

- `src/app/` contains the Next.js route entry points: storefront pages, admin pages, and API route handlers. Keep these files here so Next.js can discover the routes; API handlers should delegate business logic to the backend modules.
- `src/frontend/components/` contains reusable UI grouped by feature (`store`, `admin`, `cart`, and `checkout`).
- `src/backend/` contains server-side domain logic, authentication, validation, database access, and infrastructure helpers.
- `src/shared/` contains pure utilities used by both frontend and backend, such as currency formatting and product labels.
- `prisma/` contains the database schema, migrations, and seed data. Apply schema changes through migrations.
- `scripts/` contains one-time setup and asset-import commands; `e2e/` contains browser smoke tests.
- `public/reference-assets/` contains source images for the approved import workflow.
- `PHASE-1-PRD.md` and `PHASE-2-UX-ARCHITECTURE.md` record the product requirements and design decisions.

Generated Prisma client files under `src/generated/prisma/`, build output, and Playwright reports are generated artifacts; do not edit or commit them. The top-level `prisma/`, `scripts/`, `public/`, and configuration files remain outside `src/` because their tools expect those locations.

## Requirements

- Node.js 24 or another supported current LTS
- npm
- Docker Desktop for local PostgreSQL, or a PostgreSQL connection
- S3-compatible image storage for production

## Local setup

1. Copy .env.example to .env and set DATABASE_URL. The example matches docker-compose.yml.
2. Start PostgreSQL with docker compose up -d db.
3. Install packages with npm install.
4. Create tables with npm run db:migrate.
5. Seed the store with npm run db:seed.
6. Import the supplied public logo, matching product photos, and public contact links with npm run db:import-reference-assets. This does not change product prices.
7. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in the shell, then run npm run admin:create. Use a strong unique password and remove the variables after setup.
8. Start the site with npm run dev.

Customers must sign in or create an account to complete checkout; browsing and adding products to the cart remain available without signing in. Orders appear in the account used to place them. Admin accounts are private and have no public sign-up. The initial owner is the only account with price-edit permission. Product content managers can edit copy and images but cannot edit prices. Price changes have a separate owner-only server route and an immutable audit/history entry.

Customers who forget their password can request a one-time six-digit code sent to the email on their account. Codes expire after 10 minutes, allow at most five verification attempts, and are stored as keyed hashes. A successful reset revokes that customer's active sessions. To enable recovery email, configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a verified Resend sender), and the 32-byte hex `APP_ENCRYPTION_KEY` in `.env` or the production secret manager. Without these settings, the reset page explains that recovery is unavailable; other customer account features continue to work.

## Production configuration

- Set a strong random APP_ENCRYPTION_KEY (32-byte hex) and DATABASE_URL in the hosting secret manager.
- Set MEDIA_DRIVER=s3, S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and MEDIA_PUBLIC_BASE_URL. Use a private write credential and public read through an approved CDN/bucket policy.
- Set STORE_BASE_URL to the public HTTPS origin.
- Configure `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` for password reset email delivery; keep both values in the hosting secret manager.
- Apply migrations with npm run db:deploy. Seed only when the database is empty/approved.
- Provision the first owner account using a private one-time deployment command; do not put real credentials in source control.
- Configure delivery/COD and publish products only after verifying prices, policies, and actual product imagery.
- Configure official WhatsApp Business API/email provider credentials only after the owner supplies them and approves notification content.
- Use managed PostgreSQL backups with point-in-time recovery where available, test restores, and alert on application/database/notification errors.
- Add domain and HTTPS in the selected host. Deployment is not claimed until a live URL and real order flow are verified.

## Administration access policy

OWNER is the only role that can create/change product prices. This is enforced in the price API and service layer, not just by hiding UI controls. MANAGER can edit approved content/images and delivery settings; FULFILLMENT can process orders. Every price change stores before/after values, actor, and timestamp in ProductPriceHistory and AuditLog.

## Verification

Run `npm run typecheck`, `npm run lint`, and `npm test` for the local checks. For the Playwright smoke tests, start `npm run dev` in one terminal and then run `npm run test:e2e` in another. Those browser checks cover customer sign-in/sign-up links and forms plus the private admin sign-in screen at desktop and mobile widths; checkout still needs database-backed integration coverage against a configured PostgreSQL instance.

Do not treat the app as ready for live sales until product photos and business policies are configured, delivery/COD settings are confirmed, external alerts are wired if required, and a real order flow is verified against the deployment database.

