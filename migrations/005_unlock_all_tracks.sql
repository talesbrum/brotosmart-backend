-- migrations/005_unlock_all_tracks.sql
-- Libera todas as 5 trilhas para todos os perfis de crianças existentes.
-- Remove a restrição de BrotoPlus — todas as trilhas são gratuitas.

-- Atualiza o default da coluna para incluir todas as 5 trilhas
ALTER TABLE child_profiles
  ALTER COLUMN active_track_slugs
  SET DEFAULT '["matematica","portugues","conhecimentos-gerais","ciencias","geografia-brasil"]';

-- Atualiza todos os registros existentes para incluir as novas trilhas
-- (adiciona ciencias e geografia-brasil sem remover as que já estão ativas)
UPDATE child_profiles
SET active_track_slugs = '["matematica","portugues","conhecimentos-gerais","ciencias","geografia-brasil"]'::jsonb
WHERE NOT (active_track_slugs @> '["ciencias"]'::jsonb)
   OR NOT (active_track_slugs @> '["geografia-brasil"]'::jsonb);
