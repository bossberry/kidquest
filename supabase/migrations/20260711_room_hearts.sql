-- Migration: 2026-07-11 — SPEC GAME-B §B.2 Room Hearts
-- New room_hearts table + like_room/credit_ambient_room_hearts RPCs, and a
-- 3rd extension of get_mystery_adventurers to surface heart_total (+, for
-- real non-bot rows only, an opaque target_user_id used solely to power the
-- ❤️ like button — see the judgment-call note below).
--
-- ── Architecture note (found while building this, not assumed) ─────────────
-- Bots returned by get_mystery_adventurers have NO STABLE IDENTITY: every
-- call re-rolls RANDOM() with no seed and no persisted row (confirmed by
-- reading every prior version of this RPC). "Hearts on a bot's room" can
-- therefore never mean anything real — the next fetch (or the reshuffle
-- button) returns a different random bot. So this migration implements the
-- spec's two heart clauses as two DELIBERATELY DIFFERENT mechanisms:
--   1. "Friend room visits get a ❤️ button" → like_room(target_user_id, room_id),
--      real accounts only (bots: target_user_id is NULL, client hides the
--      button — see RoomVisit.jsx).
--   2. "Mystery adventurer bots leave 0-2 hearts daily" → NOT bots liking the
--      PLAYER back (impossible, they don't persist) — instead a one-way,
--      self-only, once-per-day AMBIENT credit on the player's OWN room,
--      flavored as "some mystery adventurers visited today", via
--      credit_ambient_room_hearts(room_id). Reuses the exact same table +
--      unique-constraint-as-once-per-day mechanism, just with
--      visitor_user_id = NULL as the sentinel for "ambient/bot credit"
--      instead of a real visitor.
--
-- ── Privacy judgment call (flagged for review, see CHATBOT_NOTES.md) ───────
-- get_mystery_adventurers' real-user branch already anonymizes DISPLAY (masked
-- name, no other identifying fields) but has never exposed the row's raw
-- user_id to the client. This migration adds target_user_id ONLY so
-- like_room has something to write against — the client can do nothing with
-- it beyond calling like_room (RLS still blocks any direct table access to
-- another user's rows). If this is judged too much even for that limited
-- purpose, the fallback is to drop target_user_id/heart_total from real rows
-- too and scope hearts to a future real-friends-can-visit-each-other feature
-- instead (not built yet — see FriendsScreen.jsx's friends tab, which
-- currently has no room-visit entry point at all).
--
-- ⚠️ APPLY MANUALLY: paste-and-run this in the Supabase SQL Editor
--    (Dashboard → SQL Editor → Run). There is no Supabase CLI / service key in
--    the repo, so it CANNOT be applied automatically. Until it is run, the
--    client's supabase.rpc('like_room', ...) / ('credit_ambient_room_hearts', ...)
--    calls fail silently (caught, see RoomVisit.jsx/Room.jsx) and heart_total
--    comes back undefined — degrades to "no hearts shown" everywhere.
--    https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql

-- ── room_hearts table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_hearts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id text NOT NULL,
  visitor_user_id uuid,        -- NULL = ambient/bot credit, not a real visitor
  hearts integer NOT NULL DEFAULT 1,
  liked_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Doubles as the "1/visitor/day" (and "1 ambient credit/day") constraint:
  -- a 2nd insert for the same owner+room+visitor+day is a no-op via
  -- ON CONFLICT DO NOTHING in the RPCs below.
  UNIQUE (owner_user_id, room_id, visitor_user_id, liked_date)
);
ALTER TABLE room_hearts ENABLE ROW LEVEL SECURITY;

-- Only the room's owner can read their own raw rows directly. Every other
-- read path (another user's heart_total for the Friends list) goes through
-- get_mystery_adventurers, which is SECURITY DEFINER and bypasses RLS.
CREATE POLICY "select own room hearts" ON room_hearts
  FOR SELECT USING (auth.uid() = owner_user_id);

-- No direct INSERT/UPDATE/DELETE policies — all writes go through the
-- SECURITY DEFINER RPCs below (same immutable-via-RPC-only convention as
-- companions/eggs in this project).
REVOKE ALL ON room_hearts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON room_hearts TO authenticated;

-- ── like_room — a real visitor hearting someone else's room, 1/day ─────────
CREATE OR REPLACE FUNCTION like_room(p_owner_user_id uuid, p_room_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_owner_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot like your own room';
  END IF;
  INSERT INTO room_hearts (owner_user_id, room_id, visitor_user_id, hearts, liked_date)
  VALUES (p_owner_user_id, p_room_id, auth.uid(), 1, CURRENT_DATE)
  ON CONFLICT (owner_user_id, room_id, visitor_user_id, liked_date) DO NOTHING;
  SELECT COALESCE(SUM(hearts), 0) INTO v_total
  FROM room_hearts WHERE owner_user_id = p_owner_user_id AND room_id = p_room_id;
  RETURN v_total;
END;
$$;
REVOKE ALL ON FUNCTION like_room(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION like_room(uuid, text) TO authenticated;

-- ── credit_ambient_room_hearts — "mystery adventurers visited today", 0-2,
-- self-only, once/day (the unique constraint with visitor_user_id NULL
-- makes a 2nd same-day call a safe no-op). Called client-side once per Room
-- mount per day (see Room.jsx) — the DB constraint is authoritative, not a
-- client-side dedupe, so it's safe to call more than once.
CREATE OR REPLACE FUNCTION credit_ambient_room_hearts(p_room_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_hearts integer; v_total integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  v_hearts := FLOOR(RANDOM() * 3)::integer; -- 0, 1, or 2
  INSERT INTO room_hearts (owner_user_id, room_id, visitor_user_id, hearts, liked_date)
  VALUES (auth.uid(), p_room_id, NULL, v_hearts, CURRENT_DATE)
  ON CONFLICT (owner_user_id, room_id, visitor_user_id, liked_date) DO NOTHING;
  SELECT COALESCE(SUM(hearts), 0) INTO v_total
  FROM room_hearts WHERE owner_user_id = auth.uid() AND room_id = p_room_id;
  RETURN v_total;
END;
$$;
REVOKE ALL ON FUNCTION credit_ambient_room_hearts(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_ambient_room_hearts(text) TO authenticated;

-- ── get_mystery_adventurers — 3rd extension: heart_total (+ target_user_id
-- for real rows only, see the privacy note above; bots get target_user_id
-- NULL and heart_total 0, since neither can mean anything for a row with no
-- persisted identity). Full re-definition, all previously-returned columns
-- preserved (SPEC GAME-B §B.1's equipped_body/back included).
DROP FUNCTION IF EXISTS get_mystery_adventurers(integer);

CREATE OR REPLACE FUNCTION get_mystery_adventurers(p_limit integer DEFAULT 8)
RETURNS TABLE (
  display_name    text,
  element         text,
  eye             text,
  gender          text,
  stage           integer,
  hp              integer,
  atk             integer,
  def             integer,
  spd             integer,
  rarity_label    text,
  is_bot          boolean,
  equipped_head   text,
  equipped_face   text,
  equipped_body   text,
  equipped_back   text,
  room_layout     jsonb,
  rooms           jsonb,
  target_user_id  uuid,     -- SPEC GAME-B §B.2 — real rows only; NULL for bots
  heart_total     integer   -- SPEC GAME-B §B.2 — 0 for bots (no persisted identity)
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

  -- Real users (anonymized display, but target_user_id + heart_total exposed
  -- so the ❤️ button + heart badge can work — see the privacy note above).
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
      )                                           AS rooms,
      c.user_id                                   AS target_user_id,
      COALESCE((SELECT SUM(rh.hearts) FROM room_hearts rh WHERE rh.owner_user_id = c.user_id), 0)::integer AS heart_total
    FROM companions c
    LEFT JOIN eggs e ON e.user_id = c.user_id
    WHERE c.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY RANDOM()
    LIMIT v_real_count;
  END IF;

  -- Bots — plausible cosmetics + 1–2 themed rooms with iso-format furniture
  -- keys. target_user_id/heart_total always NULL/0 (no persisted identity).
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
      END,
      NULL::uuid,
      0::integer
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
