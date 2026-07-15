CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL
);

INSERT INTO store_settings (setting_key, setting_value)
VALUES ('hero_image', 'https://images.unsplash.com/photo-1617331721458-bd3bd3f9c7f8?q=80&w=2000&auto=format&fit=crop');
