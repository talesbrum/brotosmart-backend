-- migrations/004_schema_updates.sql
-- Adiciona todos os campos criados após a migration inicial (001).
-- Campos vindos de: streakService, schoolLevels, parentPin, multi-device, badges.
-- Seguro para rodar em ambiente existente (usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ── child_profiles: novos campos ─────────────────────────────────────────────

-- Trilhas ativas por filho (PRD §5.1) — padrão inclui as 3 trilhas gratuitas
ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS active_track_slugs JSONB
    NOT NULL DEFAULT '["matematica","portugues","conhecimentos-gerais"]';

-- Multi-device: convite, vinculação e controle remoto de sessão
ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS invite_code        VARCHAR     UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS child_device_token VARCHAR,
  ADD COLUMN IF NOT EXISTS has_own_device     BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_locked_at  TIMESTAMPTZ;

-- ── users: PIN parental (PRD §5.2) ───────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS parent_pin VARCHAR;  -- hash bcrypt do PIN de 4 dígitos

-- ── progress: Chama do Saber com pausa (PRD §3.2) ────────────────────────────
ALTER TABLE progress
  ADD COLUMN IF NOT EXISTS streak_paused_at TIMESTAMPTZ;  -- NULL = ativa, não-NULL = pausada

-- ── Tabelas de badges (PRD §3.2) ─────────────────────────────────────────────
CREATE TYPE IF NOT EXISTS "BadgeCategory" AS ENUM (
  'STREAK', 'SEEDS', 'LEARNING', 'GARDEN', 'SESSIONS'
);

CREATE TABLE IF NOT EXISTS badges (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR       UNIQUE NOT NULL,
  name        VARCHAR       NOT NULL,
  description TEXT          NOT NULL,
  icon        VARCHAR       NOT NULL,
  category    "BadgeCategory" NOT NULL,
  threshold   INT           NOT NULL
);

CREATE TABLE IF NOT EXISTS child_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID        NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  badge_id    UUID        NOT NULL REFERENCES badges(id),
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, badge_id)
);

-- ── Tabelas de dispositivos (multi-device) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_device_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID        NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  token_hash   VARCHAR     UNIQUE NOT NULL,
  device_name  VARCHAR,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_child_profiles_invite_code
  ON child_profiles(invite_code);

CREATE INDEX IF NOT EXISTS idx_child_device_sessions_child_id
  ON child_device_sessions(child_id);

CREATE INDEX IF NOT EXISTS idx_child_device_sessions_token
  ON child_device_sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_child_badges_child_id
  ON child_badges(child_id);
