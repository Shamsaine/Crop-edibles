# Edible Shop API

Express + TypeScript + PostgreSQL backend. All application records are database backed. No demo products, customers, orders, payments, reviews, ratings, vendor applications or support conversations are inserted. Registration saves a buyer/seller account type; marketplace permissions remain buyer until seller approval; administrator accounts require the local provisioning command. Approved seller applications grant seller access.

## Run

From the repository root:

```powershell
npm install
npm run db:up
npm run db:migrate
npm run dev
```

The root development command starts the frontend and API. The API defaults to port 4000. Vite forwards `/api` requests from port 3000; session cookies use that same browser origin. `APP_URL` must exactly match the frontend origin, including port, without a trailing slash. For production place both applications behind the same HTTPS origin, proxy `/api` to the API, set `NODE_ENV=production`, and serve the frontend build. The standalone API does not serve frontend assets.

Backend commands can also be run directly:

```powershell
npm run dev --workspace=@edible-shop/backend
npm run build --workspace=@edible-shop/backend
npm run start --workspace=@edible-shop/backend
npm run test --workspace=@edible-shop/backend
```

The root `.env` supplies `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `PORT`, `APP_URL`, and optional `PAYSTACK_SECRET_KEY`. `DATABASE_URL` overrides the individual database connection fields. `DATABASE_SSL=true` enables certificate-verified database TLS. The checked-in `.env.example` contains placeholders; keep real credentials in the ignored `.env`. Never prefix backend secrets with `VITE_`.

## Administrator provisioning

```powershell
npm run admin:create
```

This reads `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` from the environment/root `.env`, prompting for missing values. Passwords require at least 10 characters. An interactive password prompt is visible, so prefer the environment. It refuses to overwrite or promote an existing account. Passwords are stored as salted scrypt hashes; no default administrator password is baked into source. Remove the bootstrap password from `.env` after recording it safely if you no longer need it there.

## Schema and consistency

Versioned SQL migrations in `migrations/` apply transactionally under an advisory lock, recorded in `schema_migrations`.

| Table | Purpose |
| --- | --- |
| `users`, `sessions` | Accounts, roles and hashed opaque session tokens with seven-day expiry |
| `seller_applications` | Seller business/contact/CAC registration information and administrator review |
| `products` | Seller-owned catalog, category, package/unit label, price in kobo, available stock and active state |
| `addresses` | Private buyer address book; one default address per buyer |
| `cart_items`, `wishlists` | Persistent account basket and saved products |
| `orders` | Buyer, immutable delivery snapshot, checkout idempotency key and server-computed totals |
| `order_items` | Immutable item/name/image/price snapshots, seller ownership, individual fulfillment and COD collection timestamp |
| `payments` | Paystack reference, expected amount/currency, authorization URL and reconciliation status |
| `reviews` | One verified delivered-purchase review per buyer/product |
| `disputes`, `dispute_messages` | Buyer/vendor/admin support threads and administrator resolution notes |

Money uses integer minor units (NGN kobo). All totals come from current database prices. Checkout serializes the buyer basket, locks product rows in stable ID order, validates stock and seller approval, decrements stock and snapshots all order details in one transaction. Idempotency keys are required UUIDs and are unique per buyer. Reusing a key with another address/payment method fails. Separate sellers receive only their own order items and item totals. Fulfillment moves one step at a time: Confirmed → Processed → In Transit → Delivered.

There is one sale unit per product (`unit`, e.g. `250g pack`); separate sizes can be separate products. No unpriced size multipliers or fictional discounts are applied. Delivery fee is currently zero; logistics/fee calculation remains a business configuration to add before a wider delivery launch.

COD orders are Unpaid at checkout. A seller must explicitly pass `paymentCollected: true` when marking their COD item Delivered. That declaration records `cod_collected_at`; an entire order becomes Paid only when every item has been delivered and collection recorded. This is a seller cash-collection attestation, not a bank or payment-provider confirmation.

## Payment handling

Without `PAYSTACK_SECRET_KEY`, `/api/config` reports Paystack unavailable and checkout accepts COD only. With a Paystack secret, hosted checkout is initialized server side, using the stored expected amount, currency and reference. Configure Paystack's webhook URL to `https://your-domain/api/payments/webhook`; callbacks return to `APP_URL/?paymentReference=...`.

A callback never marks an order paid. The buyer requests server-side verification; signed `charge.success` webhooks are also accepted. Webhook signatures use HMAC SHA512 over the exact raw request bytes. Both settlement paths require the expected reference, amount, NGN currency and success state. Transaction locks make repeated or simultaneous callbacks/webhooks safe. Unpaid online orders cannot be fulfilled.

Online stock is reserved when the order is created. The background worker rechecks pending references older than five minutes, every minute, with a batch size of 20. Confirmed failed/abandoned/reversed pending transactions cancel the order and release inventory exactly once. An unavailable/unknown provider result retains stock and records an explanation; elapsed time alone never frees possibly paid inventory. A late successful payment after stock was released is recorded as **Needs Review**, without restoring or fulfilling unavailable stock. A verified reversal after payment also requires review. Administrators can view and reverify payments through the API.

Operational limit: if Paystack creates a checkout but its response is lost before the authorization URL is stored, a repeated initialize request may be rejected by Paystack for using the same reference. The saved order/reference remains available for provider reconciliation; do not manually release inventory until the provider confirms a terminal failure. Automated refunds, settlement/payout accounting and uploaded CAC document storage are not implemented. Resolving a support case records a resolution only; it never pretends that money was refunded. Real gateway verification requires configured credentials and a publicly reachable webhook; integration tests use a controlled provider stub.

Primary provider documentation: [initialize/verify transactions](https://paystack.com/docs/api/transaction/), [webhook signing and retries](https://paystack.com/docs/payments/webhooks/).

## API

All routes are under `/api`, use JSON, and return `{error: string, details?: [...]}` on failure. Authentication uses the HttpOnly `edible_session` cookie, SameSite=Lax and Secure in production. Browser write requests must originate from `APP_URL`. Never store a password, role authority or session token in browser storage.

| Method and path | Access / behavior |
| --- | --- |
| `GET /health`, `GET /config` | Database liveness and enabled payment options |
| `POST /auth/register` | `{name,email,password}` → `{user}`; role is always buyer |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Sign in/out/current server user |
| `PATCH /account` | `{name,phone}` updates own profile |
| `POST /account/password` | `{currentPassword,password}`; invalidates all old sessions |
| `GET /products?search=&category=` | Public active approved-seller catalog; omit absent query filters |
| `GET /products/:id` | Active product detail |
| `GET /products/:id/reviews`, `POST /products/:id/reviews` | Read reviews / `{rating,comment}` from a delivered buyer |
| `GET /cart`, `PUT /cart/:productId`, `DELETE /cart/:productId` | Read/set `{quantity:0..99}`/remove basket item |
| `GET /wishlist`, `PUT /wishlist/:productId` | Read / set `{saved:boolean}` |
| `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id` | Own address book; PATCH takes complete address form |
| `GET /orders`, `GET /orders/:id` | Own order history/detail |
| `POST /orders` | `{addressId,paymentMethod:"cod" or "paystack",idempotencyKey}` → `{order,authorizationUrl?}` |
| `POST /orders/:id/cancel` | Own COD order before any seller starts processing |
| `POST /orders/:id/payment` | Retry own pending Paystack checkout initialization |
| `POST /payments/verify` | `{reference}` verifies own payment with Paystack |
| `POST /payments/webhook` | Raw signed Paystack event; no user session required |
| `GET /seller/application`, `POST /seller/application` | Own application; rejected applicants may resubmit |
| `GET /seller/products`, `POST /seller/products`, `PATCH /seller/products/:id`, `DELETE /seller/products/:id` | Approved sellers manage only their products; deletion archives |
| `GET /seller/orders`, `PATCH /seller/order-items/:id` | Own order items; `{status,paymentCollected?}` |
| `GET /seller/metrics` | Own catalog, fulfillment and collected/delivered revenue |
| `GET /disputes`, `POST /disputes`, `GET /disputes/:id` | Own buyer/seller support cases; create `{orderItemId,reason,message}` |
| `POST /disputes/:id/messages` | `{message}` to own open case; admins access all |
| `GET /admin/applications`, `PATCH /admin/applications/:id` | Review `{status:"Approved" or "Rejected",adminNotes?}` |
| `GET /admin/orders`, `GET /admin/metrics` | Platform order/operational reports |
| `GET /admin/payments`, `POST /admin/payments/:reference/verify` | Payment reconciliation visibility/manual reverify |
| `GET /admin/disputes`, `PATCH /admin/disputes/:id` | Resolve with `{resolution}` |

Address fields: `label`, `recipientName`, `phone`, `line1`, `line2`, `city`, `state`, `postalCode`, `isDefault`. Seller application fields: `businessName`, `legalEntityName`, `registrationNumber`, `category`, `location`, `phone`, `description`. Product writes: `name`, `description`, `category`, `origin`, `priceMinor`, `stock`, `image` (HTTPS URL or empty), `unit`, `tags`, `active`. Categories are Snacks, Oils, Spices and Grains.

## Validation

`npm test` creates a uniquely named `edible_test_<uuid>` PostgreSQL schema, applies migrations, runs HTTP integration tests on an ephemeral port and drops only that schema. It asserts the isolated search path before exercising account/session/RBAC checks, seller approval/ownership, baskets/addresses, idempotent multi-seller checkout, concurrent stock contention, explicit COD collection, reviews/support access, cancellation, signed Paystack events, replay handling, incorrect payment amounts/currencies, late success, provider outages and password-session invalidation. It never seeds or truncates production tables. The database role needs CREATE SCHEMA permission for tests.

Production hardening still needs deployment-specific shared rate limiting, alerting, backups, email verification/password recovery, seller-document verification/storage and payment/refund operational procedures. The included authentication limiter is per process and does not replace an edge/shared limiter across multiple API instances.

Product PATCH only changes supplied fields. Clients may send expectedStock with stock for an atomic stale-inventory check (409 on a mismatch). The seller form omits unchanged stock when editing other details, so a price or description edit cannot undo concurrent sales.

## Google and registration types

Set GOOGLE_CLIENT_ID to your Google OAuth Web Client ID. GET /config exposes only this public identifier. POST /auth/google accepts {credential,accountType?}; the backend uses Google signature/expiry/audience verification and requires a verified email. New Google identities receive a session with no local password. POST /account/google links Google to the signed-in account after verifying that emails match. Existing identities are not silently linked by matching email. Profile edits survive later Google sign-ins.

The users account_type records buyer/seller registration intent separately from the authorized role. Admin creation stays CLI-only. Browser writes allow APP_URL and exact ALLOWED_ORIGINS; local-interface aliases on the same frontend port are added only outside production. See ../docs/FIRST_CHECKOUT.md for setup and first-product instructions.
