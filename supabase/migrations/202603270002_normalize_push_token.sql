-- Normalize users push token column to push_token
-- Safe for databases that previously used expo_push_token.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'expo_push_token'
  ) THEN
    UPDATE public.users
    SET push_token = COALESCE(push_token, expo_push_token)
    WHERE expo_push_token IS NOT NULL;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_users_push_token;
CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users (push_token) WHERE push_token IS NOT NULL;

ALTER TABLE public.users DROP COLUMN IF EXISTS expo_push_token;
