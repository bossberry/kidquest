# CHATBOT_NOTES.md — Phase 1: Friend Code System

## Claude Code Handoff
_(Claude Code appends here after each session)_

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
