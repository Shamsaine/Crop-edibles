ALTER TABLE users ADD COLUMN location text NOT NULL DEFAULT '';
UPDATE users SET location=concat_ws(', ',nullif(city,''),nullif(state,''));
ALTER TABLE seller_applications ADD COLUMN business_registration_number text NOT NULL DEFAULT '';
UPDATE seller_applications SET business_registration_number=registration_number WHERE registration_number<>'';
ALTER TABLE seller_applications ADD COLUMN images text[] NOT NULL DEFAULT '{}';
ALTER TABLE uploaded_images DROP CONSTRAINT uploaded_images_purpose_check;
ALTER TABLE uploaded_images ADD CONSTRAINT uploaded_images_purpose_check CHECK (purpose IN ('product','profile','store'));
