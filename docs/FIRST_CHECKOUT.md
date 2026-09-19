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

## Admin dashboard and moderation

Open http://localhost:3000/#admin and sign in with your administrator account.

- **Accounts → Create admin:** enter the name, email and initial password. The new administrator can sign in immediately and change their password under Account. Credentials are not emailed automatically.
- **Accounts → Manage:** flag/unflag, suspend, restore or delete account access. A reason is required. Deletion also requires typing the account email. Suspension and deletion revoke all sessions, block both password and Google login, and hide seller listings from shopping and checkout.
- Deletion is a recoverable access deletion: linked account and transaction records remain in the database to preserve order history. It is not personal-data erasure. Administrators cannot suspend/delete their own account; at least one active administrator must remain.
- **Vendors → View store:** see the business profile, location, inventory, rating and complaint counts. Click **Inspect** on any product to view its description, stock, customer reviews/comments, support conversations and moderation history.
- **Products → Inspect → Moderate listing:** flag for review or delist, with a reason. Flags alone do not remove a listing. Delisting blocks new purchases even for items already in a basket; sellers cannot override it. Removing admin delisting preserves the seller's own published/archived choice. Existing orders remain available for fulfillment and support.
- Search and paginate the account, vendor and product directories. Filter by role/status, flags, location and age; product filters also include category, stock, price, rating and complaints. Age means time since the account or listing was created, not a person's age. Locations come from seller applications, buyer addresses and product origins.
- The overview shows current counts, seven days of order activity, review queues and recent moderation actions. All values come from PostgreSQL.

Google sign-in reads GOOGLE_CLIENT_ID from the root .env when the API starts. Restart the API after changing it. Test at http://localhost:3000/#auth, and add http://localhost and http://localhost:3000 to the Web client's Authorized JavaScript origins in Google Cloud. Google sign-in cannot use the private-IP HTTP development URL; deploy with HTTPS for non-localhost access. See [Google's setup instructions](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

Success notifications disappear after four seconds. Notifications also have a dismiss button, and action feedback clears when navigating between pages.

## Home page and pantry

The home page (`/#catalog`, also the default page) keeps the original banner and shows Featured products, Promos & flash sales, and Best sellers. Explore the pantry opens `/#pantry`. Each See more link opens the same pantry with its collection and sort order in the URL, so links can be shared and browser Back/Forward restores filters.

Pantry filters include collection, category, text search, NGN price range, origin/vendor location, minimum rating and availability. Sort by newest, best selling, price ascending/descending, highest rated or biggest percentage discount. Results are paginated.

In Administration → Products → Inspect → Home page & promotions, an admin can feature a product and schedule either a promo or a flash sale with a sale price and start/end times. Dates are entered in the administrator's local time. Only currently active offers appear in the deals collections. No products are featured or discounted automatically. Empty sections stay honest until real products qualify.

Best sellers use units from delivered, paid orders, ranked across all time. Pending and cancelled purchases do not contribute. Featured/promotional products must still satisfy normal account, approval and listing visibility rules.

Sale prices apply consistently to product cards, details, baskets and new checkout. If a price changes or an offer expires while a buyer is checking out, the basket refreshes and asks them to review the new total before placing the order. Existing orders retain their original price snapshots.

## Support tickets

Administrators open **Administration → Support**. Orders, Saved and Support are no longer duplicated in their top navigation. Buyers and sellers retain their normal navigation; sellers can also use **My store → Support**.

- **Open ticket** creates a general enquiry or optionally links an order item. Tickets have references such as `TKT-001001`. Buyers, sellers and admins can all create tickets while signed in. Orders → Get help also creates an order ticket and opens its detail page.
- The list shows subject, opener, priority, status, reply count and last update. Filter by reference/subject/person/product/order, status, category, priority, own tickets, general/order type, date range and (for admins) opener role. Sort and paginate results. Filter settings and ticket detail links are stored in the URL.
- Open a ticket to see its full conversation and status history. General tickets are visible to their creator and admins. Order tickets are also visible to the related buyer and seller, who can reply while the ticket is open.
- Only the person who opened a ticket can close it as a regular user. Being the related buyer or seller is not enough. Admins can close, resolve or reopen any ticket. A reason is required for closure/reopening; resolving requires a written outcome.
- Closed and Resolved tickets remain readable but accept no replies until an admin reopens them. Reopening preserves every earlier comment and resolution. Users can open a new ticket if further help is needed.

Existing support cases were migrated in place: their IDs, messages, order links and resolutions are retained, with ticket references and history added. Recording a resolution does not issue a refund.
