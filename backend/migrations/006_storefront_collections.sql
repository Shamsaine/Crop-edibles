ALTER TABLE products ADD COLUMN featured boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN sale_kind text CHECK (sale_kind IN ('promo','flash'));
ALTER TABLE products ADD COLUMN sale_price_minor bigint;
ALTER TABLE products ADD COLUMN sale_starts_at timestamptz;
ALTER TABLE products ADD COLUMN sale_ends_at timestamptz;
ALTER TABLE products ADD CONSTRAINT products_sale_valid CHECK (
 (sale_kind IS NULL AND sale_price_minor IS NULL AND sale_starts_at IS NULL AND sale_ends_at IS NULL)
 OR (sale_kind IS NOT NULL AND sale_price_minor IS NOT NULL AND sale_starts_at IS NOT NULL AND sale_ends_at IS NOT NULL
 AND sale_price_minor > 0 AND sale_price_minor < price_minor AND sale_ends_at > sale_starts_at)
);
CREATE INDEX products_featured_idx ON products(created_at DESC) WHERE featured;
