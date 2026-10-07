-- Restocking after a reservation is released must remain valid even if a seller
-- replenished inventory while the reservation was outstanding. API edits still
-- cap submitted stock at one million units; database permits released units.
ALTER TABLE products DROP CONSTRAINT products_stock_check;
ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK(stock >= 0);
