ALTER TABLE orders
  ADD COLUMN delivery_priority text NOT NULL DEFAULT 'normal'
  CHECK (delivery_priority IN ('normal','urgent'));
