ALTER TABLE users ADD COLUMN city text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN state text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN bio text NOT NULL DEFAULT '';
ALTER TABLE seller_applications ADD COLUMN registration_sequence bigint GENERATED ALWAYS AS IDENTITY (START WITH 1001);
ALTER TABLE seller_applications ADD CONSTRAINT seller_applications_registration_sequence_key UNIQUE(registration_sequence);
-- Preserve previously supplied business numbers, but new applications use a server-issued shop reference.
ALTER TABLE seller_applications ALTER COLUMN registration_number SET DEFAULT '';
