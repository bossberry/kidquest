-- Migration: 2026-07-10 — SPEC GAME-B §B.1 Dressing Room
-- Extends get_mystery_adventurers RPC to ALSO return equipped_body/equipped_back
-- (the 2 new cosmetic slots — outfits + back accessories, src/egg/eggCosmeticLayer.js
-- COSMETIC_ITEMS) so the Friends screen can show a friend's/bot's full look,
-- including whether their combo forms one of the 6 named outfit sets (client-side
-- detection via src/lib/outfitSets.js's detectFullSet, no new column needed for
-- that — it's derived from these 4 equipped_* fields the same way the local
-- player's own set badge is).
-- All previously-returned fields are preserved. Privacy unchanged.
--
-- Item ids MUST match src/egg/eggCosmeticLayer.js COSMETIC_ITEMS. Bots only ever
-- roll SHOP-acquirable items (same policy as the existing head/face bot pools) —
-- drop/craft/event items (ninja_suit, turtle_shell, butterfly_wings, angel_wings,
-- mini_umbrella, thai_costume) are excluded from the bot pools below.
--
-- ⚠️ APPLY MANUALLY: paste-and-run this in the Supabase SQL Editor
--    (Dashboard → SQL Editor → Run). There is no Supabase CLI / service key in the
--    repo, so it CANNOT be applied automatically. Until it is run, the client keeps
--    working against the OLD RPC shape — equipped_body/equipped_back come back
--    undefined and FriendsScreen.jsx degrades gracefully (no set badge shown, same
--    as an account with no body/back equipped).
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
  equipped_body text,
  equipped_back text,
  room_layout   jsonb,
  rooms         jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_elements text[] := ARRAY['fire','water','thunder','nature','shadow','light'];
  v_eyes     text[] := ARRAY['gba','tama','sanrio','summoners'];
  v_genders  text[] := ARRAY['male','female'];
  v_themes   text[] := ARRAY['pool','garden','veggie','forest','space'];
  v_head_items text[] := ARRAY[
    'bow','party_hat','beanie','cap','headband_stars',
    'flower_crown','top_hat','wizard_hat','gold_crown','jeweled_crown'
  ];
  v_face_items text[] := ARRAY[
    'blush','freckles','flower_cheek','mustache',
    'round_glasses','eye_mask','sunglasses','star_glasses'
  ];
  v_body_items text[] := ARRAY[
    'adventurer_suit','winter_coat','swimsuit','hawaiian_shirt','scientist_coat',
    'sport_jersey','royal_outfit','gardener_overalls','raincoat','pajamas'
  ];
  v_back_items text[] := ARRAY[
    'backpack','mini_rocket','hero_cape','balloon'
  ];
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
  SELECT COUNT(*) INTO v_real_count
  FROM companions c
  WHERE c.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  v_real_count := LEAST(v_real_count, p_limit);
  v_bot_count  := p_limit - v_real_count;

  -- Real users (anonymized)
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
      (e.state_json -> 'equipped' ->> 'body')     AS equipped_body,
      (e.state_json -> 'equipped' ->> 'back')     AS equipped_back,
      COALESCE(e.state_json -> 'roomLayout', '{}'::jsonb) AS room_layout,
      COALESCE(
        e.state_json -> 'rooms',
        jsonb_build_array(jsonb_build_object(
          'id', 'main', 'theme', 'default',
          'layout', COALESCE(e.state_json -> 'roomLayout', '{}'::jsonb)
        ))
      )                                           AS rooms
    FROM companions c
    LEFT JOIN eggs e ON e.user_id = c.user_id
    WHERE c.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY RANDOM()
    LIMIT v_real_count;
  END IF;

  -- Bots — plausible cosmetics + 1–2 themed rooms with iso-format furniture keys.
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
      CASE WHEN RANDOM() < 0.45 THEN NULL
           ELSE (v_body_items)[1 + FLOOR(RANDOM() * array_length(v_body_items, 1))::int] END,
      CASE WHEN RANDOM() < 0.55 THEN NULL
           ELSE (v_back_items)[1 + FLOOR(RANDOM() * array_length(v_back_items, 1))::int] END,
      COALESCE(rl.layout1, '{}'::jsonb),          -- flat room_layout (first room, back-compat)
      -- 50% of bots get a second themed room (grid neighbor to the right)
      CASE WHEN RANDOM() < 0.5 THEN
        jsonb_build_array(
          jsonb_build_object('id','main','theme','default','gridX',0,'gridY',0,'layout',COALESCE(rl.layout1,'{}'::jsonb)),
          jsonb_build_object('id','r2','theme',rl.theme2,'gridX',1,'gridY',0,'layout',COALESCE(rl.layout2,'{}'::jsonb))
        )
      ELSE
        jsonb_build_array(
          jsonb_build_object('id','main','theme','default','gridX',0,'gridY',0,'layout',COALESCE(rl.layout1,'{}'::jsonb))
        )
      END
    FROM generate_series(1, v_bot_count) s
    LEFT JOIN LATERAL (
      SELECT
        (v_themes)[1 + FLOOR(RANDOM() * array_length(v_themes, 1))::int] AS theme2,
        (SELECT jsonb_object_agg('floor_' || col || '_' || row, item)
         FROM (
           SELECT DISTINCT ON (col, row)
             (FLOOR(RANDOM() * 6))::int AS col,
             (FLOOR(RANDOM() * 4))::int AS row,
             (v_room_items)[1 + FLOOR(RANDOM() * array_length(v_room_items, 1))::int] AS item
           FROM generate_series(1, (1 + FLOOR(RANDOM() * 3))::int) g
         ) picks) AS layout1,
        (SELECT jsonb_object_agg('floor_' || col || '_' || row, item)
         FROM (
           SELECT DISTINCT ON (col, row)
             (FLOOR(RANDOM() * 6))::int AS col,
             (FLOOR(RANDOM() * 4))::int AS row,
             (v_room_items)[1 + FLOOR(RANDOM() * array_length(v_room_items, 1))::int] AS item
           FROM generate_series(1, (1 + FLOOR(RANDOM() * 3))::int) g
         ) picks) AS layout2
    ) rl ON true;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_mystery_adventurers(integer) TO authenticated, anon;
