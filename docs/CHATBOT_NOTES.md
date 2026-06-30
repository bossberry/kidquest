# CHATBOT_NOTES.md — Phase 1: Friend Code System

## Claude Code Handoff
_(Claude Code appends here after each session)_

**2026-06-30 (session 7) — Coins earned shown on all result screens:**
- Built: All 16 result/end screens now display the exact coins earned that round. `GameThai.jsx`: `useFinishRound` refactored to return `{ finish, coins }` — coins pre-computed before the closure, passed as `coins` prop to `ResultScreen`. `GameMath`, `GameShop`, `GameMathBattle`: added `coinsEarned` state, set before dispatch, shown in inline done screens. `GamePhonics`: `ResultScreen` gains `coins` prop; all 4 sub-games (PhonicsGame L1, CVCGame L2, SightGame L3, SentenceGame L4) add `coinsEarned` state. Minigames: EggMemory/EggFishing hardcoded +5; EggTower/EggCatch display computed from `score` state (deterministic, same formula); EggRun badge in canvas dead overlay from `gsRef.ringCount`. WorldBattle: `pendingBattleCoins` state set alongside dispatch, passed to `<RewardChest coins={...}>`; RewardChest shows animated gold pill in reveal phase. Build clean at 165 modules.
- Not finished: Nothing — all screens covered.
- Blockers/risks: None.
- Ready to start next: Coin spending system (shop/wearable items) — Chatbot must define what coins buy first
- Needs Chatbot decision first: What can coins buy? What does the shop UI look like? Any daily coin cap?

**2026-06-27 (session 6) — Coin economy (earn-only foundation):**
- Built: Added `coins`, `lastLoginDate`, `loginStreak`, `coinsLevelBonus` to `defaultState()` + `migrateStateShape()` (existing players load with `coins: 0`). Added `ADD_COINS` and `DAILY_LOGIN` reducer actions. Hooked coin awards at: all ROUND_COMPLETE paths in GameThai (via `useFinishRound`), GameMath, GamePhonics (all 4 sub-games), GameShop, GameMathBattle; world battle win (+10 regular / +15 boss, in `WorldBattle.onComplete`); arcade minigame completions (EggMemory +5, EggTower score-scaled 3–8, EggRun ring-scaled 3–8, EggCatch score-scaled 3–8, EggFishing +5). Level-unlock first-time bonus (+15, guarded by `coinsLevelBonus[world_level]` flag — no re-award). Daily login (+10 + min(streak,5) each new calendar day). Coin HUD added to Home.jsx header (gold 🪙 badge). `showItemToast` used for all coin feedback. Formula: `round(12 × accuracy × (1-mastery))`, clamp [2,12]. Anti-farm: replaying mastered level → min 2 coins/round. Build clean at 165 modules.
- Not finished: No spending, no shop, no items linked to coins — earn-only as specified.
- Blockers/risks found: `showItemToast` in StateContext.jsx (daily login) uses 900ms setTimeout to let ItemToast component register. If app loads very slowly, toast might fire before registry. Acceptable for now.
- Ready to start next: Coin spending system (shop/wearable items) — next session after design from Chatbot
- Needs Chatbot decision first: What can coins buy? What's the shop UI? Any daily coin cap?

**2026-06-27 (session 5) — Legacy creature art removal STEP 2+2.5+§3+§4:**
- Built: Deleted BattleScreen.jsx, HatchOverlay.jsx, CreatureCanvas.jsx, drawCreature.js, creatureAlgorithm.js, creatureHelpers.js (all zero-caller verified). Replaced: LoginBackdrop.jsx → 9 random-element egg RAF sprites (renderEggSprite); EggMemory.jsx → 6 emoji card pairs (🔥💧⚡🌿🌑✨, no creature dependency). Removed dead WorldHUD globals (__kq_activeCreatureSeed/__kq_activeCreatureStats + getCreatureSeed import). Removed dead HatchOverlay import/JSX from App.jsx. Removed dead getCreatureForHatch import from StateContext.jsx. Created db_backups/get_mystery_adventurers.OLD.sql with backup note + retrieval instructions. Build clean at 165 modules.
- Not finished: `get_mystery_adventurers` RPC migration still not applied (supabase/migrations/20260627_mystery_adventurers_egg.sql must be run in Supabase SQL Editor). STEP 3 (DB column/RPC-body drops) not started.
- Blockers/risks found: The db_backups file is a placeholder — user should run `SELECT pg_get_functiondef('get_mystery_adventurers'::regproc)` in Supabase SQL Editor and save the real definition before applying the migration.
- Ready to start next: Apply the RPC migration SQL in Supabase SQL Editor → test FriendsScreen Mystery Adventurers tab; then Phase 4 NPC System
- Needs Chatbot decision first: STEP 3 (actual DB column drops on hatchedEggs blob fields) — user must give explicit OK after verifying backup

**2026-06-27 (session 4) — Full-pipeline animated walkers + Mystery Adventurers egg upgrade:**
- Built: Created `src/egg/renderEggSprite.js` — shared non-React helper running the full 9-step egg compositing pipeline (aura→pose→regalia→body→eyes→expression). Updated `HomeBackground.jsx` to call `renderEggSprite` per-frame into a reused 48×48 offscreen (`basePxOverride=2`); element animations are now live. Updated `WorldScreen.jsx` to set `window.__kq_companionEgg` (not a baked canvas); updated `tileEngine.renderPlayer` to call `renderEggSprite` per-frame into a 32×32 offscreen scaled to 16×16. Removed `drawCreature` from tileEngine. Updated `FriendsScreen.jsx` MysteryTab: `<EggCanvasCore>` per adventurer row/modal; removed `CreatureCanvas`/`ELEMENT_STATS`/`elementToStats`/`drawCreature`. Generated `supabase/migrations/20260627_mystery_adventurers_egg.sql` for new RPC returning `element/eye/gender/stage/...`. Build clean at 170 modules.
- Not finished: Supabase migration for `get_mystery_adventurers` NOT yet applied — adventurers will show default egg (fire/gba/male/stage1) until migration runs
- Blockers/risks found: Migration must be pasted and run at https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql
- Ready to start next: Run the migration SQL, then test FriendsScreen in browser; or BattleScreen.jsx dead-code deletion; or Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-27 — Companion egg walker on Home; Collection placeholder:**
- Built: `HomeBackground.jsx` rewritten — single companion egg entity (walk/jump/spin) using `drawEggBody`+`drawEyeLayer` to 48×48 offscreen canvas; `Home.jsx` passes `companion={resolved}` + `stage` from `useCompanion()`; voice profile now derived from companion element/gender (no DNA). `Collection.jsx` replaced with "เร็วๆ นี้!" placeholder (companion EggCanvas + coming-soon copy). `CreatureDetailPopup.jsx` deleted (orphaned). Build clean at 169 modules.
- Not finished: none
- Blockers/risks found: `HomeBackground` now shows only 1 entity (the companion); the old "meeting gimmick" between multiple walkers is gone — intentional
- Ready to start next: FriendsScreen MysteryTab rework (replace `drawCreature` + `get_mystery_adventurers` with companion EggCanvas); or BattleScreen.jsx deletion (orphaned); or WorldHUD `getCreatureSeed` dead-code removal
- Needs Chatbot decision first: Full Collection redesign (shop/cosmetics/room) — placeholder only for now

**2026-06-26 (session 2) — Companion egg shown on all screens; name = child's account name:**
- Built: Replaced `drawCreature` canvas with `EggCanvas` on Home (large display + party bar), Collection (PartyGrid), PartySelect, and Battle (player side). Name `state.name` shown everywhere instead of `creatureName`. Map player sprite: WorldScreen pre-renders companion egg body+eyes to `window.__kq_playerOffscreen` (32×32); `tileEngine.renderPlayer` uses it. Build passes. Deployed to Vercel.
- Not finished: none — all 5 screens done
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System; or companion aura progression (aura shown based on stage)
- Needs Chatbot decision first: none

**2026-06-26 — Living Egg renderer + one-time Companion Creation:**
- Built: Full `src/egg/` layer system wired into a new `EggCanvas.jsx` React component (RAF loop, DPR-backed canvas, 11-step compositing pipeline). Created `CompanionContext` (loads `companions` row from Supabase, exposes `resolved`/`loading`/`createCompanion`). Created blocking `CompanionCreation` modal (element × 6, eye × 4 with mini previews, gender × 2; live full preview; confirm dialog; Thai UI). Replaced `src/components/EggCanvas.jsx` with a thin wrapper that reads from CompanionContext and accepts legacy `stats` prop — all existing callers untouched. Added companion gate to `App.jsx` (waits for `companionLoading` before showing loading screen; blocks on `!companion` after onboarding). Wrapped app with `CompanionProvider` in `main.jsx`. Created `supabase/migrations/20260626_companions.sql` with DDL + RLS + `create_companion` RPC.
- Not finished: Supabase migration NOT yet applied — must be run manually in the Supabase SQL Editor before companion creation works in production.
- Blockers/risks found: No Supabase CLI available, no service_role key — migration must be pasted and run by hand at https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql
- Ready to start next: Phase 4 NPC System (Prof Owl already wired; add remaining 4 NPCs from SCREEN_NPCS config)
- Needs Chatbot decision first: none

**2026-06-22 — baby-stage Minecraft voxel/cube aesthetic redesign:**
- Built: Pivoted all 4 baby draw functions from organic/Pokémon-style curves to Minecraft mob voxel style. Each type now has one unmistakable Minecraft-style face feature: FURRED = large 4×2 pig snout block with 2 nostril dots at face bottom (Minecraft pig); WINGED = 4×1 accent crest bar at face top + 2×1 accent beak at face bottom (Minecraft chicken), wings as 4×4 panels spanning canvas edges; SCALED = 2×3 side frill blocks at extreme head edges (x=0 and x=10) + 1×2 slit pupils + 3×3 tail block (lizard/turtle style); CHITIN = compound eyes in accent color protruding outside head (Minecraft spider red-eye style), three-segment widening body 6→8→10. All shapes are pure flat rectangles, bigger/fewer than before, with face as the dominant feature.
- Not finished: browser visual test (chrome extension unavailable)
- Blockers/risks found: none
- Ready to start next: teen+final stage Minecraft-style pass, or Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-22 — baby-stage silhouette redesign (block-attachment technique, corrected from diagonal-curve approach):**
- Built: Rewrote all 4 baby-stage draw functions in `creatureAlgorithm.js` using block-attachment silhouette technique derived from Pokémon reference images. Key correction: previous pass wrongly used staircase/diagonal pixels; reference sprites use almost exclusively rectangular blocks with at most 1px step offsets. Per-type changes — FURRED: ears now 2-wide × 3-tall proper ear blocks (was 3×1 thin horizontal bar), head 10-wide with 6-wide body for chibi proportion, tail is flat 3×2 rectangle (was staircase), 4 leg stubs clearly separated. WINGED: wings are pure 3×4 rectangular blocks attached to body sides with consistent 2-wide fill throughout all 4 rows (no taper), 2-stub bipedal legs. SCALED: head enlarged to 8×5 (was 6×4), side frills as 2×3 blocks protruding sideways, tail is straight 2×5 vertical rectangle (no staircase), right leg shifted to x=6 to avoid merging with tail at x=9. CHITIN: antennae shortened to 2 rows (head starts at y=2), compound eyes still protruding 1px outside head shell, 3-segment widening body 6→8→10 intact.
- Not finished: browser visual test (chrome extension unavailable during session)
- Blockers/risks found: none
- Ready to start next: teen+final quality pass, or Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-21 — baby-stage quality pass (Pokémon-reference-informed):**
- Built: All 4 baby draw functions redesigned with reference-quality pixel-art techniques. (1) DARK OUTLINE everywhere — every shape uses "draw dark shell 1px larger, then fill on top" so a 1px dark border appears around every body region. (2) HEAD-TO-BODY FLOW — FURRED: 10-wide head shell → matching-width shoulder bridge row (primary, y=6) → body steps in 1px each side; WINGED: 8-wide head steps to 6-wide body at y=6; SCALED: head and body share same x-range so outline runs continuously; CHITIN: each segment's dark shell is 2px wider than the one above (6→8→10) creating a staircase widening. (3) DIAGONAL PIXELS — FURRED tail = 2-step stair-step arc; WINGED wing nubs = 3×3 dark block with fill tapering from 2-wide to 1-wide (left/right edges step diagonally); SCALED tail = straight column then 1-px rightward bend. (4) EYES — all 4 types now draw 2×2 dark eye block with explicit `r(x,y,1,1,'#ffffff')` white shine at upper-left. Chitin compound eyes moved to x=2/x=9 (1×2 tall, truly outside the head dark shell). Scaled baby spot/stripe overlay coordinates updated (old positions landed on dark-border row y=8 and leg zone y=9).
- Not finished: teen and final stage quality pass (baby approved first)
- Blockers/risks found: none
- Ready to start next: teen+final stage quality pass (same 4 techniques, extend to the other 8 draw functions) — OR — Phase 4 NPC System
- Needs Chatbot decision first: which to do next — creature quality pass on remaining stages, or move to NPC system?

**2026-06-20 — creatureAlgorithm.js silhouette redesign (round 4 — chibi pixel-art principles):**
- Built: Full rewrite of all 12 draw functions using chibi pixel-art proportion principles. FURRED: BIG ROUND HEAD is the focal feature — head 8-wide, ears add 3 rows above; body NARROWER (6-wide) than head to emphasise chibi dome; 4 stub legs; mane crown at final with accent shimmer. WINGED: no ears (smooth dome top), head 6-wide (narrower than furred), eyes HIGH on face (avian), body only 4-wide; wing focal feature grows: shoulder nubs → folded wings in accent colour → fully spread accent wings spanning canvas edges; 2 legs only (bipedal). SCALED: flat-top head (no bumps), side frills protrude sideways, SLIT EYES (1×2 vertical vs 2×2 round), tail IS the focal feature — tiny with no accent at baby → accent tip at teen → large 3-row bold accent block at final. CHITIN: 3-band stacked structure (4→6→8 wide) at all stages; antennae single-pixel thin; compound eyes bulge 1px beyond head width; accent used for wings only — absent at baby, wing buds at teen, full spread wings at final with accent ring on abdomen. Pattern overlays (spots/stripes) updated to match new body layouts.
- Not finished: nothing
- Blockers/risks found: none — visual test recommended in browser with seeds 3=furred, 17=winged, 33=scaled, 49=chitin
- Ready to start next: Phase 4 NPC System (5 NPCs: Prof Owl already wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-20 — creatureAlgorithm.js silhouette redesign (round 3 — Pokémon-proportion):**
- Built: Reverted all stages to 12×12 grid (removed 16×16 final). Redesigned all 12 draw functions using proportion-based differentiation. FURRED: wide quadruped (10-12 wide body, 4-leg pairs with belly gap, triangular ears; baby=stub tail, teen=shoulder mane tufts, final=mane crown). WINGED: narrow bipedal (4 wide body, 2 legs only, beak, tail extending right; baby=tiny wing nubs, teen=folded wing buds, final=wings spread to canvas edges). SCALED: round compact (Squirtle proportion, dorsal ridge above head instead of ears, slit eyes, arm stubs + 2 bottom legs; baby=small frill, teen=head-side frills, final=large dramatic corner frills). CHITIN: 3 stacked segments (head smallest→thorax medium→abdomen largest; antennae always, legs from thorax only; baby=4 legs, teen=6 legs+wing buds, final=full wings+pincers). Draw order fixed: beak and tongue drawn AFTER body so they appear on top.
- Not finished: nothing
- Blockers/risks found: none — visual test needed in browser; test seeds 3=furred, 17=winged, 33=scaled, 49=chitin (small sequential seeds cluster to furred in prng)
- Ready to start next: Phase 4 NPC System (5 NPCs: Prof Owl already wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole)
- Needs Chatbot decision first: none

**2026-06-20 — creatureAlgorithm.js silhouette redesign (round 2):**
- Built: Fundamentally different architecture per body type. FURRED = 4-legged quadruped stance (4 legs in two pairs with belly gap). WINGED = wings dominate width (canvas-edge to canvas-edge on final), beak, 2 taloned feet, fan tail feathers. SCALED = HORIZONTAL for baby/teen (head left, tail right, frills on left edge, horizontal body — completely unique orientation vs other types); final is standing 2-legged serpent dragon. CHITIN = 3 stacked segments where abdomen is LARGEST (true insect proportion), thin antennae, legs radiate from thorax. Final stage uses 16×16 grid for more detail. Squint test passes — all 4 types readable in silhouette alone.
- Not finished: nothing
- Blockers/risks found: none
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — creatureAlgorithm.js full visual redesign:**
- Built: 4 body types (`furred`/`winged`/`scaled`/`chitin`) × 3 stages = 12 hand-placed silhouettes on 12×12 pixel grid. 20 palette variants across 6 elements (3–4 per element). Pattern overlay system: `none`/`spots`/`stripes` (50%/25%/25%). All driven by `prng(seed)` — 3 consecutive draws: palette index → body type → pattern. `COLORS` → `PALETTES` (array-of-objects per element). `getElement()`, `getCreatureSeed()`, `drawCreature()` signature all unchanged. Visually reviewed in browser — 4 body types clearly distinct (furred=cat ears, winged=wing protrusions+beak, scaled=side frills+tongue, chitin=antennae+segmented). Stage evolution (baby→teen→final) clearly readable.
- Not finished: nothing
- Blockers/risks found: prng(seed) with small sequential seeds (1–16) clusters to furred body type. Real creature seeds are hash-of-name×date so they span 32-bit space — distribution is fine in practice. Test seeds needed to be chosen from different clusters to verify all 4 types.
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Phase 1.1c — Mystery Adventurers: real procedural creature rendering:**
- Built: `ELEMENT_STATS` reverse-map (6 entries) + `elementToStats(element, evoStage)` — derives placeholder xp/acc/streak values that route `getElement()` to the correct element without touching `creatureAlgorithm.js`. Used option (a) as specified. `CreatureCanvas` component (canvas + useEffect) calls `drawCreature(canvas, Number(seed), elementToStats(...))`. Card: 64×64 canvas replaces emoji placeholder. Modal: 192×192 canvas replaces emoji placeholder. Both still show creature_name text label. No changes to any lib file.
- Not finished: nothing
- Blockers/risks found: creature_seed from Supabase is a bigint — `Number(seed)` coerces it safely for values within 32-bit range (hash function output); no precision loss expected
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Phase 1.1b — Mystery Adventurers: creature stats + rarity cards:**
- Built: `RARITY` 5-tier color map; `RarityBadge` component (rarity-colored border/bg/glow); `StatBar` component (reuses `.px-hp-bar-outer/.px-hp-bar-inner` CSS, pixel font label, numeric value). `AdventurerModal` (createPortal): opens on "ดูสเตตัส" tap; 72px emoji avatar with rarity border; creature_name + badge; masked display_name; 4 stat bars with fixed max refs (HP/300, ATK/80, DEF/60, SPD/300); "ท้าเล่น" closes modal + fires 3s toast. Card updated: rarity-colored border + optional glow; 48×48 emoji avatar; creature_name + badge + display_name info; "ดูสเตตัส" button. source field intentionally ignored — player/bot cards look identical.
- Not finished: nothing
- Blockers/risks found: stat max reference values (HP 300, ATK 80, DEF 60, SPD 300) are estimates — Chatbot should confirm if bar scaling looks wrong with real data
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**2026-06-20 — Phase 1.1 — Unified Friends screen + Mystery Adventurers tab:**
- Built: FriendsScreen.jsx fully rewritten. Tab bar reduced from 4 → 2 tabs (เพื่อน / ผู้คนอื่นๆ). FriendsTab: single scrollable page loading all data in parallel (Promise.all: friendships + ensure_friend_code + my_friends); pending requests section only renders when requests.length > 0 (no empty state); My Code / Add Friend / Friends list sections always shown. All RPC calls, message logic, and error handling preserved unchanged from Phase 1. MysteryTab: calls get_mystery_adventurers({ p_limit: 8 }) on mount; 8 adventurer cards with display_name + ⚔️ icon (player/bot look identical); "ท้าเล่น" = mock toast for 3s (no backend call); "🔄 สับใหม่" button re-calls RPC. Toast is fixed-positioned at top:60, zIndex:9999.
- Not finished: nothing
- Blockers/risks found: get_mystery_adventurers return shape assumed as array of { display_name, source } — source field intentionally ignored in rendering
- Ready to start next: Phase 4 NPC System
- Needs Chatbot decision first: none

**Status:** Database migration is DONE and deployed to production Supabase project `kidquest`.
**Your job:** Implement the React frontend that calls these existing tables/functions. Do NOT write any SQL or modify the database — it's already live.

---

## What already exists in Supabase (do not recreate)

### Tables

- `public.friend_codes` — `user_id` (PK, FK→auth.users), `code` (text, unique, 6 chars), `created_at`
- `public.friendships` — `id` (PK uuid), `requester_id`, `target_id`, `status` ('pending'|'accepted'|'rejected'), `created_at`, `responded_at`

### View

- `public.my_friends` — already filtered by RLS to the logged-in user. Columns: `friendship_id`, `friend_user_id`, `friend_name`, `created_at`, `responded_at`. Only contains `status = 'accepted'` rows.

### RPC functions (call via `supabase.rpc(...)`)

1. **`ensure_friend_code(p_user_id uuid)`** → returns `text` (the code)
   - Idempotent. Call once right after a user's first egg is created.
   - Generates a permanent 6-char code (charset excludes O/0, I/1, L — kid-safe, no ambiguous chars).

2. **`send_friend_request(p_code text)`** → returns table `(friendship_id uuid, status text)`
   - The ONLY way to look up another user — by exact code match.
   - Handles: code not found (raises exception), self-friend attempt (raises exception), existing pending/accepted relationship (returns existing row instead of duplicating).
   - Auth required (`auth.uid()` used internally as requester).

3. **`respond_friend_request(p_friendship_id uuid, p_accept boolean)`** → returns `text` (new status: 'accepted' or 'rejected')
   - Only callable by the `target_id` of a pending request.
   - Raises exception if not authorized or already resolved.

### Direct table reads (RLS-protected, safe to query directly)

- `select * from friend_codes where user_id = auth.uid()` → get my own code to display
- `select * from friendships where target_id = auth.uid() and status = 'pending'` → incoming requests to show "Accept/Reject" UI for
- `select * from friendships where requester_id = auth.uid() and status = 'pending'` → outgoing requests I'm waiting on (show "Pending..." state)
- `select * from my_friends` → my accepted friends list

---

## UI / UX requirements

**Core safety rule: no browsing, no search, no user list anywhere.** The only way to add a friend is typing in a code given to you outside the app (verbally, or shown by the friend on their own screen).

### Screens to build

1. **My Code screen** (in profile/settings area)
   - Big, friendly display of the user's own code (e.g. large pixel-font text, maybe with a "copy" button)
   - Call `ensure_friend_code` on mount if no code is cached yet, otherwise just read from `friend_codes`
   - Simple flavor text like "Share this code with a friend so they can add you!"

2. **Add Friend screen**
   - 6-character input (auto-uppercase, restrict to the kid-safe charset if you want client-side validation, but server is authoritative)
   - Submit → `send_friend_request(code)`
   - Handle responses:
     - success + status 'pending' → show "Request sent! Waiting for them to accept."
     - success + status 'accepted' (already friends) → show "You're already friends!"
     - error "Code not found" → friendly "Hmm, that code doesn't match anyone. Double-check it!"
     - error "Cannot friend yourself" → friendly "That's your own code, silly!"

3. **Friend Requests screen** (incoming)
   - List rows from `friendships` where `target_id = me` and `status = 'pending'`
   - For each: show requester's name (you'll need to join/fetch `eggs.child_name` for `requester_id`, since `my_friends` view only covers accepted ones — either extend a similar view or do a client-side fetch per row)
   - Accept / Reject buttons → `respond_friend_request(id, true/false)`
   - On accept, refresh the friends list

4. **My Friends screen**
   - Query `my_friends` view directly
   - Show as a simple list/grid with friend names (pixel UI style, consistent with rest of KidQuest)
   - This is also where future features (compare creatures, visit, battle a friend, etc.) would hook in — not in scope for Phase 1, just display for now

### Visual style

Follow existing KidQuest pixel art conventions: Press Start 2P font (English), Sarabun (Thai), hard shadows, zero border-radius, no soft gradients.

---

## Edge cases to handle gracefully

- User has no code yet (new account, first session) → auto-generate via `ensure_friend_code` before showing "Add Friend" or "My Code" screens
- Network/RPC errors → don't crash, show a simple retry-friendly message (this is a kids' app — never show raw error text or stack traces)
- Empty states: no friends yet, no pending requests yet — both need friendly empty-state copy/illustration, not a blank screen

## Explicitly out of scope for this phase

- No friend-vs-friend battles yet
- No chat/messaging between friends
- No "remove friend" UI yet (can be added later — table supports it via a future delete/status policy, not built yet)
- No leaderboards or friend comparison screens yet

---

## Reference: full SQL already deployed

See `friend_system_migration.sql` (already run in Supabase SQL Editor, production). If you need to double check exact column names or constraints, that file is the source of truth — do not re-run it, just reference it.
