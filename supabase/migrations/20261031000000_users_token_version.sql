-- Sign-ins issued before a password or email change stop working once this number goes up
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
