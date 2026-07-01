-- Migration: 2026-07-01 — Mystery Adventurers room visit + cosmetics
-- Extends get_mystery_adventurers RPC to return the data a "room visit" screen needs:
--   equipped_head text  — real rows: eggs.state_json->'equipped'->>'head' (null if none)
--   equipped_face text  — real rows: eggs.state_json->'equipped'->>'face' (null if none)
--   room_layout  jsonb  — real rows: eggs.state_json->'roomLayout' (default '{}')
-- Bots get plausible random cosmetics + a small random room layout so their
-- cards/visit screens look decorated (item ids match the real client catalogs:
--   head/face → src/egg/eggCosmeticLayer.js COSMETIC_ITEMS
--   furniture → src/lib/roomItems.js ROOM_ITEMS).
-- All existing return fields are preserved. Privacy is unchanged: neither bots nor
-- real users expose child_name or user_id (real display_name stays the generic mask).
--
-- ⚠️ APPLY MANUALLY: paste-and-run this in the Supabase SQL Editor
--    (Dashboard → SQL Editor → Run). There is no Supabase CLI / service key in the
--    repo, so it CANNOT be applied automatically. Until it is run, the client keeps
--    working against the OLD RPC shape — equipped_head/equipped_face/room_layout come
--    back undefined and the UI degrades gracefully (undecorated room, no cosmetics).
--    https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql

DROP FUNCTION IF EXISTS get_mystery_adventurers(integer);

CREATE OR REPLACE FUNCTION get_mystery_adventurers(p_limit integer DEFAULT 8)
RETURNS TABLE (
  display_name  text,
  element       text,
  eye           text,
  gender        text,
  stage         integer,
  hp            integer,
  atk           integer,
  def           integer,
  spd           integer,
  rarity_label  text,
  is_bot        boolean,
  equipped_head text,
  equipped_face text,
  room_layout   jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_elements text[] := ARRAY['fire','water','thunder','nature','shadow','light'];
  v_eyes     text[] := ARRAY['gba','tama','sanrio','summoners'];
  v_genders  text[] := ARRAY['male','female'];
  -- Cosmetic ids — MUST match COSMETIC_ITEMS in src/egg/eggCosmeticLayer.js
  v_head_items text[] := ARRAY[
    'bow','party_hat','beanie','cap','headband_stars',
    'flower_crown','top_hat','wizard_hat','gold_crown','jeweled_crown'
  ];
  v_face_items text[] := ARRAY[
    'blush','freckles','flower_cheek','mustache',
    'round_glasses','eye_mask','sunglasses','star_glasses'
  ];
  -- Furniture ids — MUST match ROOM_ITEMS in src/lib/roomItems.js
  v_room_items text[] := ARRAY[
    'plant','rug','lamp','stuffed_animal','window_curtain',
    'small_chair','desk','toy_chest','bookshelf','wall_art','bed','fish_tank'
  ];
  v_bot_names text[] := ARRAY[
    'AceWanderer','BlueStar','CinderPeak','DuskFox','EchoRift',
    'FlareKnight','GloomDancer','HexBlade','IrisMage','JoltSeeker',
    'KrazyClaw','LunarByte','MoonDrifter','NovaEdge','OakShield'
  ];
  v_real_count integer := 0;
  v_bot_count  integer;
BEGIN
  -- Count how many real users have a companion record (excluding self)
  SELECT COUNT(*) INTO v_real_count
  FROM companions c
  WHERE c.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  v_real_count := LEAST(v_real_count, p_limit);
  v_bot_count  := p_limit - v_real_count;

  -- Real users (anonymized — display_name is generic to protect privacy;
  -- never expose child_name or user_id)
  IF v_real_count > 0 THEN
    RETURN QUERY
    SELECT
      'นักผจญภัยลึกลับ'::text                    AS display_name,
      c.element,
      c.eye,
      c.gender,
      GREATEST(1, LEAST(9,
        COALESCE(
          CAST(e.state_json #>> '{hatchedEggs,0,battleLevel}' AS integer) / 3 + 1,
          1
        )
      ))::integer                                 AS stage,
      (80 + FLOOR(RANDOM() * 120)::int)::integer  AS hp,
      (30 + FLOOR(RANDOM() * 50)::int)::integer   AS atk,
      (20 + FLOOR(RANDOM() * 40)::int)::integer   AS def,
      (40 + FLOOR(RANDOM() * 80)::int)::integer   AS spd,
      CASE
        WHEN COALESCE(CAST(e.state_json #>> '{hatchedEggs,0,battleLevel}' AS integer), 0) >= 18 THEN 'Legendary'
        WHEN COALESCE(CAST(e.state_json #>> '{hatchedEggs,0,battleLevel}' AS integer), 0) >= 12 THEN 'Epic'
        WHEN COALESCE(CAST(e.state_json #>> '{hatchedEggs,0,battleLevel}' AS integer), 0) >= 6  THEN 'Rare'
        WHEN COALESCE(CAST(e.state_json #>> '{hatchedEggs,0,battleLevel}' AS integer), 0) >= 3  THEN 'Uncommon'
        ELSE 'Common'
      END                                         AS rarity_label,
      false                                       AS is_bot,
      (e.state_json -> 'equipped' ->> 'head')     AS equipped_head,
      (e.state_json -> 'equipped' ->> 'face')     AS equipped_face,
      COALESCE(e.state_json -> 'roomLayout', '{}'::jsonb) AS room_layout
    FROM companions c
    LEFT JOIN eggs e ON e.user_id = c.user_id
    WHERE c.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY RANDOM()
    LIMIT v_real_count;
  END IF;

  -- Bots fill remaining slots — plausible random cosmetics + small random room layout.
  -- head/face independently ~35% empty, so bots naturally mix (both / one / neither).
  IF v_bot_count > 0 THEN
    RETURN QUERY
    SELECT
      (v_bot_names)[1 + (s % array_length(v_bot_names, 1))]::text,
      (v_elements)[1 + FLOOR(RANDOM() * 6)::int],
      (v_eyes)   [1 + FLOOR(RANDOM() * 4)::int],
      (v_genders)[1 + FLOOR(RANDOM() * 2)::int],
      (1 + FLOOR(RANDOM() * 5)::int)::integer,
      (80 + FLOOR(RANDOM() * 120)::int)::integer,
      (30 + FLOOR(RANDOM() * 50)::int)::integer,
      (20 + FLOOR(RANDOM() * 40)::int)::integer,
      (40 + FLOOR(RANDOM() * 80)::int)::integer,
      (ARRAY['Common','Common','Uncommon','Uncommon','Rare','Epic','Legendary'])[1 + FLOOR(RANDOM() * 7)::int],
      true,
      CASE WHEN RANDOM() < 0.35 THEN NULL
           ELSE (v_head_items)[1 + FLOOR(RANDOM() * array_length(v_head_items, 1))::int] END,
      CASE WHEN RANDOM() < 0.35 THEN NULL
           ELSE (v_face_items)[1 + FLOOR(RANDOM() * array_length(v_face_items, 1))::int] END,
      COALESCE(rl.layout, '{}'::jsonb)
    FROM generate_series(1, v_bot_count) s
    LEFT JOIN LATERAL (
      -- 0–3 furniture entries; keys are slot indices "0".."11", values are item ids.
      -- DISTINCT ON (slot) dedupes any collisions, so the result may be fewer entries.
      SELECT jsonb_object_agg(slot::text, item) AS layout
      FROM (
        SELECT DISTINCT ON (slot)
          (FLOOR(RANDOM() * 12))::int AS slot,
          (v_room_items)[1 + FLOOR(RANDOM() * array_length(v_room_items, 1))::int] AS item
        FROM generate_series(1, (FLOOR(RANDOM() * 4))::int) g
      ) picks
    ) rl ON true;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_mystery_adventurers(integer) TO authenticated, anon;
