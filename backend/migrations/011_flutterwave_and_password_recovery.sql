ALTER TABLE orders DROP CONSTRAINT orders_payment_method_check;
UPDATE orders SET payment_method='flutterwave' WHERE payment_method<>'cod';
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK(payment_method IN ('cod','flutterwave'));
ALTER TABLE payments ADD COLUMN provider text NOT NULL DEFAULT 'flutterwave' CHECK(provider IN ('flutterwave','legacy'));
-- Preserve existing online-payment records without sending old references to the new gateway.
UPDATE payments SET provider='legacy',authorization_url=NULL,last_error='Previous payment provider record; resolve outstanding payments manually.';
UPDATE payments SET status='Needs Review' WHERE provider='legacy' AND status='Pending';
UPDATE orders SET payment_status='Needs Review' WHERE id IN (SELECT order_id FROM payments WHERE provider='legacy' AND status='Needs Review');
CREATE UNIQUE INDEX payments_provider_transaction_unique ON payments(provider_transaction_id) WHERE provider='flutterwave' AND provider_transaction_id IS NOT NULL;

CREATE TABLE password_resets (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 password_snapshot text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 used_at timestamptz
);
CREATE INDEX password_resets_user_idx ON password_resets(user_id,created_at);
