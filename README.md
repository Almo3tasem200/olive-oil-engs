# El Mohandeseen Olive Oil Store

Arabic-first e-commerce application for El Mohandeseen Olive Oil.

## Current state

The app is being implemented. Initial catalog prices are stored in the database seed, not in the storefront. The seed creates the three products with these values: 500 ml EGP 275, 1 liter EGP 550, and 12 liters EGP 6,100. Products start unpublished because approved product photos were not included with the brief. Upload the real photos and then publish each product in Admin.

Delivery zones and COD start disabled/unconfigured. Configure these in Admin after the business owner confirms the live policy. No external email, WhatsApp, or payment provider is active by default.

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
6. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in the shell, then run npm run admin:create. Use a strong unique password and remove the variables after setup.
7. Start the site with npm run dev.

The initial owner is the only account with price-edit permission. Product content managers can edit copy and images but cannot edit prices. Price changes have a separate owner-only server route and an immutable audit/history entry.

## Production configuration

- Set a strong random APP_ENCRYPTION_KEY (32-byte hex) and DATABASE_URL in the hosting secret manager.
- Set MEDIA_DRIVER=s3, S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and MEDIA_PUBLIC_BASE_URL. Use a private write credential and public read through an approved CDN/bucket policy.
- Set STORE_BASE_URL to the public HTTPS origin.
- Apply migrations with npm run db:deploy. Seed only when the database is empty/approved.
- Provision the first owner account using a private one-time deployment command; do not put real credentials in source control.
- Configure delivery/COD and publish products only after verifying prices, policies, and actual product imagery.
- Configure official WhatsApp Business API/email provider credentials only after the owner supplies them and approves notification content.
- Use managed PostgreSQL backups with point-in-time recovery where available, test restores, and alert on application/database/notification errors.
- Add domain and HTTPS in the selected host. Deployment is not claimed until a live URL and real order flow are verified.

## Administration access policy

OWNER is the only role that can create/change product prices. This is enforced in the price API and service layer, not just by hiding UI controls. MANAGER can edit approved content/images and delivery settings; FULFILLMENT can process orders. Every price change stores before/after values, actor, and timestamp in ProductPriceHistory and AuditLog.

## Verification

Run `npm run typecheck`, `npm run lint`, and `npm test` for the local checks. For the Playwright smoke tests, start `npm run dev` in one terminal and then run `npm run test:e2e` in another. Those browser checks cover the admin sign-in screen at desktop and narrow mobile widths; checkout still needs database-backed integration coverage against a configured PostgreSQL instance.

Do not treat the app as ready for live sales until product photos and business policies are configured, delivery/COD settings are confirmed, external alerts are wired if required, and a real order flow is verified against the deployment database.

