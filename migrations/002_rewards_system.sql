-- migrations/002_rewards_system.sql
-- Sistema de premiações do BrotoSmart (PRD v2 §4)

CREATE TYPE "RewardType" AS ENUM ('REAL', 'GAME_TIME');
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED');

-- Catálogo de premiações (cadastradas pelos pais)
CREATE TABLE rewards (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR       NOT NULL,
  type                "RewardType"  NOT NULL,
  seeds_cost          INT           NOT NULL CHECK (seeds_cost > 0),
  description         TEXT,
  game_name           VARCHAR,                    -- apenas para GAME_TIME
  game_duration_mins  INT,                        -- minutos de jogo
  valid_until         TIMESTAMPTZ,
  weekly_limit        INT,
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Pedidos de resgate das crianças
CREATE TABLE redemptions (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id       UUID                NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id        UUID                NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  status          "RedemptionStatus"  NOT NULL DEFAULT 'PENDING',
  seeds_spent     INT                 NOT NULL,
  parent_message  TEXT,               -- mensagem da "recusa com carinho"
  requested_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_rewards_parent_id     ON rewards(parent_id);
CREATE INDEX idx_rewards_is_active     ON rewards(is_active);
CREATE INDEX idx_redemptions_child_id  ON redemptions(child_id);
CREATE INDEX idx_redemptions_status    ON redemptions(status);
CREATE INDEX idx_redemptions_reward_id ON redemptions(reward_id);
