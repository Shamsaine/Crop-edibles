CREATE TABLE users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE CHECK (email = lower(email)),
 name text NOT NULL, phone text NOT NULL DEFAULT '', password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE seller_applications (
 id uuid PRIMARY KEY, user_id uuid NOT NULL UNIQUE REFERENCES users(id), business_name text NOT NULL,
 legal_entity_name text NOT NULL, registration_number text NOT NULL, category text NOT NULL,
 location text NOT NULL, phone text NOT NULL, description text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
 admin_notes text NOT NULL DEFAULT '', reviewed_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE products (
 id uuid PRIMARY KEY, seller_id uuid NOT NULL REFERENCES users(id), name text NOT NULL,
 description text NOT NULL DEFAULT '', category text NOT NULL CHECK(category IN ('Snacks','Oils','Spices','Grains')),
 origin text NOT NULL, price_minor bigint NOT NULL CHECK(price_minor > 0 AND price_minor <= 100000000),
 stock integer NOT NULL CHECK(stock >= 0 AND stock <= 1000000), image text NOT NULL DEFAULT '',
 unit text NOT NULL DEFAULT 'pack', tags text[] NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_seller_idx ON products(seller_id);
CREATE INDEX products_category_idx ON products(category) WHERE active;
CREATE TABLE addresses (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 label text NOT NULL, recipient_name text NOT NULL, phone text NOT NULL, line1 text NOT NULL,
 line2 text NOT NULL DEFAULT '', city text NOT NULL, state text NOT NULL, postal_code text NOT NULL DEFAULT '',
 is_default boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX addresses_default_idx ON addresses(user_id) WHERE is_default;
CREATE TABLE cart_items (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99), PRIMARY KEY(user_id,product_id));
CREATE TABLE wishlists (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id), PRIMARY KEY(user_id,product_id));
CREATE TABLE orders (
 id uuid PRIMARY KEY, buyer_id uuid NOT NULL REFERENCES users(id), idempotency_key uuid NOT NULL,
 payment_method text NOT NULL CHECK(payment_method IN ('cod','paystack')),
 payment_status text NOT NULL CHECK(payment_status IN ('Unpaid','Pending','Paid','Failed','Needs Review','Cancelled')),
 status text NOT NULL CHECK(status IN ('Awaiting Payment','Confirmed','Processed','In Transit','Delivered','Cancelled')),
 subtotal_minor bigint NOT NULL CHECK(subtotal_minor>0), delivery_fee_minor bigint NOT NULL DEFAULT 0 CHECK(delivery_fee_minor>=0),
 total_minor bigint NOT NULL CHECK(total_minor=subtotal_minor+delivery_fee_minor),
 currency text NOT NULL DEFAULT 'NGN' CHECK(currency='NGN'), address jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(buyer_id,idempotency_key)
);
CREATE INDEX orders_buyer_idx ON orders(buyer_id,created_at DESC);
CREATE TABLE order_items (
 id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id), product_id uuid NOT NULL REFERENCES products(id),
 seller_id uuid NOT NULL REFERENCES users(id), product_name text NOT NULL, product_image text NOT NULL,
 unit text NOT NULL, quantity integer NOT NULL CHECK(quantity>0), unit_price_minor bigint NOT NULL CHECK(unit_price_minor>0),
 total_minor bigint NOT NULL CHECK(total_minor=quantity*unit_price_minor),
 status text NOT NULL CHECK(status IN ('Awaiting Payment','Confirmed','Processed','In Transit','Delivered','Cancelled')),
 UNIQUE(order_id,product_id)
);
CREATE INDEX order_items_seller_idx ON order_items(seller_id,order_id);
CREATE TABLE payments (
 id uuid PRIMARY KEY, order_id uuid NOT NULL UNIQUE REFERENCES orders(id), reference text NOT NULL UNIQUE,
 amount_minor bigint NOT NULL CHECK(amount_minor>0), currency text NOT NULL DEFAULT 'NGN',
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Paid','Failed','Needs Review')),
 authorization_url text, provider_transaction_id text, last_error text, checked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz
);
CREATE TABLE reviews (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), product_id uuid NOT NULL REFERENCES products(id),
 order_item_id uuid NOT NULL UNIQUE REFERENCES order_items(id), rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
 comment text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,product_id)
);
CREATE TABLE disputes (
 id uuid PRIMARY KEY, order_item_id uuid NOT NULL UNIQUE REFERENCES order_items(id), buyer_id uuid NOT NULL REFERENCES users(id),
 reason text NOT NULL CHECK(reason IN ('Damaged','Not Delivered','Wrong Item','Other')),
 status text NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Resolved')), resolution text,
 resolved_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE dispute_messages (
 id uuid PRIMARY KEY, dispute_id uuid NOT NULL REFERENCES disputes(id), sender_id uuid NOT NULL REFERENCES users(id),
 message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dispute_messages_thread_idx ON dispute_messages(dispute_id,created_at);
