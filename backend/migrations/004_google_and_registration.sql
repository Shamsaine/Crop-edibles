ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN google_subject text UNIQUE;
ALTER TABLE users ADD COLUMN account_type text NOT NULL DEFAULT 'buyer' CHECK(account_type IN ('buyer','seller'));
UPDATE users SET account_type='seller' WHERE role='seller' OR id IN (SELECT user_id FROM seller_applications);
ALTER TABLE users ADD CONSTRAINT users_sign_in_method CHECK(password_hash IS NOT NULL OR google_subject IS NOT NULL);
