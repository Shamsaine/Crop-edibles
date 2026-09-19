# Edible Shop

A React storefront and Express/PostgreSQL marketplace API. The frontend and API
run as npm workspaces. Product, account, basket, order, payment, review, and
support data are persisted in PostgreSQL.

## Run locally

Prerequisites: Node.js 22+ and Docker Desktop with Compose.

1. On a fresh clone, copy .env.example to .env and choose a strong POSTGRES_PASSWORD.
   This working copy already has local database credentials. The host port is 5435;
   change POSTGRES_PORT if another service uses it. The container always uses 5432.
2. Install dependencies: `npm install`.
3. Start the database: `npm run db:up`.
4. Apply database migrations: `npm run db:migrate`.
5. Start the API and frontend together: `npm run dev`.
6. Open http://localhost:3000. The API listens on port 4000, and Vite proxies /api.

Use `npm run dev:frontend` or `npm run dev:backend` to run one workspace.
`npm run db:down` stops PostgreSQL without deleting its named data volume.
PostgreSQL initialization credentials only apply to an empty data volume;
editing .env does not change an existing database password.

## Registration and your first checkout

See [the step-by-step setup guide](docs/FIRST_CHECKOUT.md) for buyer/seller registration,
administrator access, first-product setup, Google sign-in, and local origin settings.

## First real records

The demo catalog, orders, identities, payment screens, and dashboard figures
have been removed. No fictitious transactions or default user passwords are seeded.

Register an account, submit a seller application, and have a provisioned admin
approve it. The approved seller can add products. A buyer can save products,
add items to the basket, save a delivery address, place an order, and follow its
progress. Seller fulfillment, buyer reviews, and dispute messages are persisted.
The initial administrator credentials in this working copy are the ADMIN_EMAIL
and ADMIN_PASSWORD values in the ignored root .env. Sign in with them
and change the password from Account. On a fresh database, set ADMIN_EMAIL,
ADMIN_NAME, and ADMIN_PASSWORD temporarily, then run `npm run admin:create`.
The command never overwrites or promotes an existing account.

See [backend setup and API reference](backend/README.md) for admin provisioning,
endpoint payloads, and database details.

## Payments

Pay on delivery is available without an external provider. Orders are not
recorded as paid just because checkout succeeds.

For Paystack, set PAYSTACK_SECRET_KEY in the root .env to your own test key first,
then restart the API. Keep this key on the server; it is never a VITE_ variable.
Set APP_URL to the browser origin used for the app so callback URLs and origin
checks match. The checkout redirects to Paystack's hosted payment page.

For deployed use, configure your Paystack webhook URL as
https://YOUR_DOMAIN/api/payments/webhook. A local webhook needs a public HTTPS
endpoint forwarded to the API. Returning to the app also triggers server-side
verification; the return URL itself is not evidence of payment.

The implementation uses [Paystack transaction verification](https://paystack.com/docs/payments/accept-payments/)
and [signed webhook events](https://paystack.com/docs/payments/webhooks/).
Online checkout stays unavailable while the secret key is unset.

## Development and validation

- `npm run lint`: TypeScript checks for both workspaces.
- `npm run build`: production frontend and backend builds.
- `npm test`: backend HTTP/database integration tests (PostgreSQL must be running).
- `npm run db:logs`: database logs.

Tests use isolated database data; see the backend README for their exact setup.
The schema uses foreign keys and constraints, keeps money in integer kobo, and
stores product/price/delivery snapshots with orders. Checkout calculates totals
on the server and locks inventory within a database transaction.

## Structure

- frontend/src/: browser UI and API client.
- backend/src/: API routes, authentication, services, database access, and CLI tools.
- backend/migrations/: versioned PostgreSQL schema.
- backend/test/: integration tests.
- compose.yaml: PostgreSQL service, persistent storage, and health check.
- .env: local secrets, ignored by Git; .env.example: safe configuration template.

Production requires HTTPS, NODE_ENV=production for secure session cookies, an
APP_URL matching the deployed browser origin, and a reverse proxy that serves
the frontend build and forwards /api to the backend. Do not expose database
credentials or the PostgreSQL port publicly.

## Administrator workspace

Visit `/#admin` with an administrator account. The dashboard includes searchable accounts, vendor stores, product reviews/complaints, moderation controls, administrator creation, orders, payments and support. See [the admin workflow guide](docs/FIRST_CHECKOUT.md#admin-dashboard-and-moderation) for account suspension/deletion, product delisting and Google setup.
