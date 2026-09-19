ALTER TABLE users ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deleted'));
ALTER TABLE users ADD COLUMN flagged boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN flag_reason text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN status_reason text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN moderated_at timestamptz;
ALTER TABLE products ADD COLUMN admin_delisted boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN flagged boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN moderation_reason text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN moderated_at timestamptz;
CREATE TABLE moderation_events (
 id uuid PRIMARY KEY, actor_id uuid NOT NULL REFERENCES users(id),
 target_type text NOT NULL CHECK(target_type IN ('account','product')),
 target_id uuid NOT NULL, action text NOT NULL, reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_events_target_idx ON moderation_events(target_type,target_id,created_at DESC);
CREATE INDEX users_admin_directory_idx ON users(status,role,created_at DESC);
CREATE INDEX products_moderation_idx ON products(admin_delisted,flagged,created_at DESC);
CREATE INDEX order_items_product_idx ON order_items(product_id);
CREATE INDEX reviews_product_idx ON reviews(product_id);
