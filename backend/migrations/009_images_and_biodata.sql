ALTER TABLE users ADD COLUMN profile_image text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN date_of_birth text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN gender text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN nationality text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN occupation text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN images text[] NOT NULL DEFAULT '{}';
UPDATE products SET images=ARRAY[image] WHERE image<>'';

CREATE TABLE uploaded_images (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('product','profile')),
  data bytea NOT NULL CHECK (octet_length(data) <= 5242880),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX uploaded_images_owner_idx ON uploaded_images(owner_id);
