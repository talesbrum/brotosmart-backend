-- migrations/001_initial_schema.sql
-- Schema inicial do BrotoSmart
-- Aplique com: psql -U brotosmart -d brotosmart_db -f migrations/001_initial_schema.sql
-- OU use: npx prisma migrate dev --schema src/models/schema.prisma

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM types ────────────────────────────────────────────────────────────────
CREATE TYPE "ActivityType" AS ENUM ('QUIZ', 'FILL_BLANK', 'MATCH');
CREATE TYPE "SessionEndReason" AS ENUM ('TIME_LIMIT', 'PARENT_ENDED', 'CHILD_EXITED');

-- ── Pais / responsáveis ───────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  VARCHAR     UNIQUE NOT NULL,
  email         VARCHAR     UNIQUE NOT NULL,
  name          VARCHAR     NOT NULL,
  push_token    VARCHAR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Perfis das crianças ───────────────────────────────────────────────────────
CREATE TABLE child_profiles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR     NOT NULL,
  age               INT         NOT NULL CHECK (age BETWEEN 4 AND 12),
  avatar            VARCHAR     NOT NULL DEFAULT 'seed_01',
  daily_limit_mins  INT         NOT NULL DEFAULT 15 CHECK (daily_limit_mins BETWEEN 5 AND 120),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Progresso ─────────────────────────────────────────────────────────────────
CREATE TABLE progress (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID        UNIQUE NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  seeds             INT         NOT NULL DEFAULT 0,
  streak_days       INT         NOT NULL DEFAULT 0,
  last_activity_at  TIMESTAMPTZ,
  garden_level      INT         NOT NULL DEFAULT 1,
  garden_slots      JSONB       NOT NULL DEFAULT '[]',
  total_minutes     INT         NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trilhas de aprendizado ────────────────────────────────────────────────────
CREATE TABLE learning_tracks (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR NOT NULL,
  slug        VARCHAR UNIQUE NOT NULL,
  icon        VARCHAR NOT NULL,
  color       VARCHAR NOT NULL,
  description VARCHAR NOT NULL
);

-- ── Atividades ────────────────────────────────────────────────────────────────
CREATE TABLE activities (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      UUID          NOT NULL REFERENCES learning_tracks(id),
  title         VARCHAR       NOT NULL,
  type          "ActivityType" NOT NULL DEFAULT 'QUIZ',
  level         INT           NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  seeds_reward  INT           NOT NULL DEFAULT 10,
  question      TEXT          NOT NULL,
  options       JSONB         NOT NULL,
  correct_index INT           NOT NULL,
  explanation   TEXT          NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Respostas dos quizzes ────────────────────────────────────────────────────
CREATE TABLE quiz_answers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID        NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  activity_id  UUID        NOT NULL REFERENCES activities(id),
  is_correct   BOOLEAN     NOT NULL,
  answered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sessões de uso ────────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id       UUID               NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  duration_mins  DECIMAL(6,2),
  end_reason     "SessionEndReason",
  zombie_pauses  INT                NOT NULL DEFAULT 0,
  seeds_earned   INT                NOT NULL DEFAULT 0
);

-- ── Índices para performance ──────────────────────────────────────────────────
CREATE INDEX idx_child_profiles_parent_id  ON child_profiles(parent_id);
CREATE INDEX idx_progress_child_id         ON progress(child_id);
CREATE INDEX idx_quiz_answers_child_id     ON quiz_answers(child_id);
CREATE INDEX idx_quiz_answers_answered_at  ON quiz_answers(answered_at);
CREATE INDEX idx_sessions_child_id         ON sessions(child_id);
CREATE INDEX idx_sessions_started_at       ON sessions(started_at);
CREATE INDEX idx_activities_track_id       ON activities(track_id);
CREATE INDEX idx_activities_level          ON activities(level);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_progress_updated_at    BEFORE UPDATE ON progress  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
