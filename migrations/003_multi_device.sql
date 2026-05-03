-- migrations/003_multi_device.sql
-- Suporte a dispositivos separados para pais e filhos

-- Campos no perfil da criança
ALTER TABLE child_profiles
  ADD COLUMN invite_code        VARCHAR     UNIQUE,
  ADD COLUMN invite_expires_at  TIMESTAMPTZ,
  ADD COLUMN child_device_token VARCHAR,
  ADD COLUMN has_own_device     BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN session_locked_at  TIMESTAMPTZ;

-- Sessões de dispositivo da criança
-- Token JWT de longa duração armazenado no celular da criança
CREATE TABLE child_device_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID        NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  token_hash   VARCHAR     UNIQUE NOT NULL,  -- hash SHA-256 do JWT
  device_name  VARCHAR,                      -- "iPhone da Ana"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX idx_child_device_sessions_child_id ON child_device_sessions(child_id);
CREATE INDEX idx_child_device_sessions_token    ON child_device_sessions(token_hash);
CREATE INDEX idx_child_profiles_invite_code     ON child_profiles(invite_code);
