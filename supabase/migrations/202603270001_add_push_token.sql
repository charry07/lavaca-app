-- Add push_token column for Expo push notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users (push_token) WHERE push_token IS NOT NULL;
