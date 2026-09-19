# Register accounts and test your first checkout

Use http://localhost:3000 on the development computer. Email registration also
works at http://172.20.80.1:3000 on this local network. Google sign-in requires
localhost or HTTPS; use the localhost address when testing Google.

## Administrator

Administration is part of the same app: http://localhost:3000/#admin
(or http://172.20.80.1:3000/#admin). Sign in using ADMIN_EMAIL and ADMIN_PASSWORD
from the ignored root .env. The initial admin has already been created.
After signing in, choose Administration. No new administrator registration is needed.

## First seller and product

1. Sign out, choose Sign in, then New here? Create an account.
2. Select Seller. Register with email/password, or use Google after configuring it.
3. You land in Account. Complete the business application under Sell on Edible Shop
   and submit it. Seller registration saves the choice; publishing awaits approval.
4. Sign out, sign in as the administrator, open Administration ? Seller applications,
   and approve that application.
5. Sign back in as the seller (or click Refresh if using another browser session).
   Open My store ? Add product. Enter the name, category, origin, pack size, price,
   and positive stock. Keep Publish in marketplace selected and save.

## First buyer and checkout

1. Use a separate email/account: sign out, create an account and select Buyer.
   Sellers cannot buy their own listings.
2. In Account, add a delivery address with recipient name, phone, street, city, and state.
3. Browse Marketplace, add the seller's product, and open Basket.
4. Choose the saved address and Pay on delivery, then place the order.
   Paystack additionally needs PAYSTACK_SECRET_KEY and an order of at least NGN 50.
5. Open Orders to see the saved order. Refresh or sign back in to confirm persistence.
6. Sign in as the seller and use My store ? Fulfillment: Processed, In Transit,
   then confirm delivery and cash collection. Only confirm collection after payment.
   The buyer can then review the delivered product or open a support case.

## Enable real Google sign-in

1. Open Google Cloud Console and create or select a project.
2. In Google Auth Platform, configure Branding, Audience and Data Access for sign-in.
   If the app is in testing, add your testing Google accounts to the test-user list.
3. In Clients, create an OAuth client of type Web application.
4. Add http://localhost and http://localhost:3000 as Authorized JavaScript origins.
   For deployment, add your exact HTTPS frontend origin. An origin has no /#auth path.
5. Copy the Client ID ending in .apps.googleusercontent.com into the root .env:

   GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

6. Restart the API (stop and rerun npm run dev) and refresh the sign-in page.
   This popup/ID-token flow does not need a client secret or redirect URI.

Google users can edit their name, phone and delivery addresses in Account.
Subsequent Google sign-ins preserve these profile changes. If an email/password
account already exists for the same email, sign in using the password first,
then connect Google in Account ? Sign-in methods. This avoids silently merging identities.
The existing administrator can connect Google this way too.

Google setup: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
Server verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

## Origin errors

APP_URL is the canonical browser origin. ALLOWED_ORIGINS accepts additional exact
origins separated by commas, without paths. The current .env explicitly allows
http://172.20.80.1:3000. Development also allows this computer's local interfaces
on the configured frontend port. Production uses only the explicit configured origins.
Restart the API after changing .env. Do not use a wildcard origin or remove CSRF checks.
