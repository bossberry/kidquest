# Current State — KidQuest
_Last updated: 2026-07-04 (World map visual overhaul: Ragnarok Online style tiles)_

---

## Live Systems

### Icon-first UI pass (2026-07-03)
The child using this app can't reliably read yet, so every tappable element must be identifiable by icon alone, not text. An audit found ~41 elements across the app that were text-only (no icon). All were converted to icon-primary / tiny-optional-label — big emoji/symbol (~24-28px) with the Thai word shrunk to a small secondary label or dropped entirely where the icon is unambiguous (✅/❌/🗑️/🔄/✖️). Touched: `BottomNav.jsx` (5 tabs, real icons replacing plain color swatches — 🏠🛒🏡📊👥), `Collection.jsx` (wearable sub-tabs 🎩/😎, equip toggle now icon-only ✅/❌ with a gold glow when equipped, furniture place button 🏠), `Room.jsx` (zone tabs 🟫/⬅️/➡️, remove/swap buttons icon-only 🗑️/🔄), `MoveSelectBattleMode.jsx` (TTS replay 🔊 enlarged + icon-only, item-use/cancel buttons keep tiny labels intentionally — use-vs-cancel ambiguity risk was judged not worth going fully icon-only, victory return 🏃💨, teach-intro dismiss gets an ⚔️ prefix but keeps its guiding text since it's a new player's first battle instruction), `WorldScreen.jsx` (NPC talk 💬 and sign read 📋 now icon-only, boss-flee/maze-dialog buttons get icon+tiny-label, item-bag close is now ✖️ instead of English "CLOSE" text), `FriendsScreen.jsx` (view-stats button 📊), `Home.jsx` (new-player hatch CTA shrunk from a full sentence to 👆 + "แตะ!"), `TreasureSlot.jsx` (collect button 🎁). Buttons that already had an icon (buy buttons with 🪙, explore 🗺️, minigame starts, accept/decline ✓/✕, D-pad) were left untouched. No game logic, state, reducers, or content changed — CSS/label/icon only. `npm run build` clean; `BottomNav` visually confirmed live (standalone-mounted via dynamic import, since the rest of the app sits behind the Supabase login gate with no test credentials this session — see the other 7 files' diffs for code-review-only verification).

### Room / Den Decoration — full-screen, tap-anywhere (2026-06-30 → iso rewrite 2026-07-02 → UX redesign 2026-07-03)
- **Iso interior**: the room is a true 2:1 isometric interior (`src/lib/roomScene.js`) — a 6×4 diamond checkerboard floor plus two back walls (on-screen LEFT = 4-wide, on-screen RIGHT = 6-wide; both 2 placeable height rows).
- **Home background**: `DecoratedRoom.jsx` draws the same iso room (via `drawRoomScene`, `state.roomLayout`) as Home's full-screen backdrop, now with a genuinely interactive walking companion — see the "Home Screen" entry further down for the 2026-07-03 walking/tap-to-interact rewrite. It picks up the room's ambient visual polish (vignette/wallpaper/ceiling shadow/light) automatically since that's not gated behind any param.
- **Room editor** (`Room.jsx`, redesigned 2026-07-03): the canvas is now `flex:1` inside the screen (no fixed height), filling all space above the bottom nav — `computeRoomGeometry` scales the iso projection to whatever size it's given, so the room reads as large/immersive instead of a small box in empty dark space. The "ROOM" label + coin count moved from a separate header bar into a small translucent pill overlay pinned top-left, so it costs no layout space. A `ResizeObserver` on the canvas wrapper keeps the backing store matched (flex sizing doesn't reliably fire `window.resize`).
- **Zone tabs are GONE.** Tapping anywhere on the room — floor or either wall — auto-detects which zone/slot was hit via a new zone-agnostic `hitTestZone(g, px, py)` (zone param now optional; when omitted it tests floor → left_wall → right_wall in that order and returns the first hit, since floor is drawn on top). No more manual zone selection before placing.
- **Tap-target hints**: every empty slot across all 3 zones shows a faint pulsing gold "+" (fades in on entry/tap, fades out after ~3s idle, driven by a self-stopping `requestAnimationFrame` loop in `Room.jsx` — `drawTapHints()` in `roomScene.js`, gated behind a `showTapHints` param that only `Room.jsx` passes, default off for every other caller). Occupied slots get a soft gold glow instead.
- **Unified bottom sheet**: tapping any slot (empty or occupied) opens ONE sheet (`40vh`, blurred dark panel) instead of the old two separate picker/action modals. Header shows the auto-detected zone (🟫 วางของบนพื้น / ⬅️ แขวนที่ผนังซ้าย / ➡️ แขวนที่ผนังขวา). If occupied, the current item shows at the top with a "🗑️ เอาออก" remove button. Below that: a 3-column grid of the **full catalog** for that zone (not just owned items) — gold border = owned+unplaced (tap to place), grey + 📍 = owned but placed in a different slot (tap → toast, no direct steal), faded + 🔒 + price = not owned. **Buying furniture happens right here** (fixed 2026-07-04 — see "Furniture buy flow" below): tapping a locked item opens a small in-sheet buy-confirm view (item preview, name, "← ย้อนกลับ" / "🛒 ซื้อ 🪙{price}"), and buying immediately places it in the open slot too — one flow, no other screen involved.
- **Placement feedback**: a sparkle burst (`mkSparks`/`tickEffects` from `src/lib/particles.js`, the same particle system battle effects use) plus a 0→1.2→1.0 scale "drop-in" bounce on the placed item, both driven by the same rAF loop as the tap hints. `furniture_place`/`furniture_remove` SFX unchanged.
- **Visual polish** (`roomScene.js`, `!small` render path only — the FriendsScreen 72×80 thumbnail skips all of this): warm vignette darkening the floor's far corners, faint wallpaper-stripe texture + a dark ceiling-corner gradient strip on both walls, a soft ambient warm-light glow near the top-center, and a soft hanging shadow behind wall items (floor items already had `groundShadow()`).
- **Slot keys**: `roomLayout` keys are `"{zone}_{a}_{b}"` strings — `floor_{col}_{row}` (col 0-5, row 0-3), `left_wall_{y}_{z}` (y 0-3, z 1-2), `right_wall_{x}_{z}` (x 0-5, z 1-2) — **unchanged by the 2026-07-03 redesign**, same schema as the iso rewrite.
- **Furniture catalog**: 12 items in `src/lib/roomItems.js`, each with `allowedZones` — floor: plant, rug, lamp, stuffed animal, chair, desk, toy chest, bookshelf, bed, fish tank; wall (both walls): window+curtains, wall art.
- **Shop integration**: furniture is bought directly from Room's own item-picker bottom sheet (see the "Room / Den Decoration" entry above and "Furniture buy flow" below) — as of the 2026-07-03 Shop redesign, `Collection.jsx` no longer has a furniture tab at all; buy with `BUY_ROOM_ITEM` → coins deducted → item added to `ownedRoomItems`.
- **Furniture buy flow** (`Room.jsx`, fixed 2026-07-04): the 2026-07-03 Shop redesign removed the furniture tab on the assumption Room would sell it, but `Room.jsx`'s locked-item tap only ever showed a "go buy it at the shop" toast — pointing at a shop tab that no longer existed, so furniture became **unbuyable anywhere**. Fixed: tapping a locked card now sets a `buyTarget` state that swaps the sheet's grid for a small buy-confirm view (item icon/name, "← ย้อนกลับ" back button, "🛒 ซื้อ 🪙{price}" buy button, disabled+greyed if `coins < price`). Buying dispatches `ACTIONS.BUY_ROOM_ITEM` then immediately `ACTIONS.PLACE_ROOM_ITEM` into the slot that was open (safe — React applies queued dispatches against the updated `state` in order, so `PLACE_ROOM_ITEM`'s `ownedRoomItems.includes(itemId)` gate already sees the just-bought item), closing the sheet via the existing `handlePlace` placement-feedback path (sparkle + bounce + toast). `BUY_ROOM_ITEM` already stamped `lastSavedAt` from an earlier sweep — confirmed, not changed. Live-verified: tapped a locked chair (🔒150), bought it, watched coins deduct exactly (9965→9815) and the chair appear placed in the tapped slot, sheet closed automatically.
- **State**: `state.ownedRoomItems: string[]` (default `[]`), `state.roomLayout: { [slotKey]: itemId }` (default `{}`) — untouched by the redesign.
- **Migration** (`migrateStateShape` in `state.js`): a saved `roomLayout` whose keys are all numeric strings (old flat grid) is reset to `{}` and `lastSavedAt` is bumped. New-format / empty layouts pass through untouched. `ownedRoomItems` is NEVER modified by migration.
- **Actions**: `BUY_ROOM_ITEM`, `PLACE_ROOM_ITEM` (`{ slotKey, itemId }`), `REMOVE_ROOM_ITEM` (`{ slotKey }`) — payload shapes unchanged.
- **Navigation**: 5-tab BottomNav — หน้าหลัก / ร้านค้า / ห้อง / รีพอร์ต / เพื่อน
- **Deferred**: multi-room expansion (1 room is all that exists now); real swipe-to-dismiss on the bottom sheet (tap-outside-scrim only for now, a deliberate scope call — see `docs/CHATBOT_NOTES.md`).

### Cosmetic Shop — "dressing room" (2026-06-30; live try-on 2026-07-01; full redesign 2026-07-03; polish 2026-07-05)
- **Screen renamed "ห้องแต่งตัว"** — a centered title was added to the floating header overlay (the redesign had none); `BottomNav.jsx`'s tab label changed from "ร้านค้า" to "แต่งตัว" (icon unchanged, 🛒).
- **Item grid — icon-only, no egg preview**: item cards previously showed each cosmetic drawn on a small isolated `EggCanvas` (a mini egg wearing just that one item). Replaced with a new `ItemIcon` component that calls the item's own `draw(ctx, {px,ox,oy,faceX,t})` function directly (each `COSMETIC_ITEMS` entry's draw fn — documented at the top of `eggCosmeticLayer.js` — only ever draws the cosmetic itself onto an implied 18×18-cell egg-relative coordinate frame; it never touches the egg body/eyes, so calling it standalone with a synthetic frame is all that's needed — no egg pipeline involved at all). The synthetic frame is sized so both extremes across all 18 items fit without clipping (tallest: wizard hat tip at y≈-10; lowest: blush at y≈+11). Cards grew to `minHeight:96`, item name font bumped to 13px bold, names pre-truncated to 6 Thai characters + "…" (was CSS-width-based ellipsis). Badges repositioned/simplified: ✓ (equipped) or 🔒 (can't-afford) top-right, 🪙 price bottom-right for any unowned item, and a dark overlay drawn over just the icon (not the whole card) for the can't-afford state.
- **Slot switcher bigger**: `minHeight` 48→52, icon 22px→28px, active tab's label color changed from dark brown to white for more contrast against the gold background.
- **Items**: 18 pixel-art cosmetics — 10 head (bow, party hat, beanie, cap, headband stars, flower crown, top hat, wizard hat, gold crown, jeweled crown) + 8 face (blush, freckles, flower cheek, mustache, round glasses, eye mask, sunglasses, star glasses)
- **Tiers**: small 30–60 coins / mid 150–250 / big 500–800
- **State**: `state.ownedItems: string[]` (default `[]`), `state.equipped: { head: null|string, face: null|string }` (default `{head:null,face:null}`); both backfilled on load for existing players
- **Actions**: `BUY_ITEM { id, price, slot }` — deducts coins, adds to ownedItems, **auto-equips** (confirmed in the reducer — this is why the 2026-07-03 redesign's CTA can do "buy + equip" as one dispatch); `EQUIP_ITEM { id, slot }` — toggles equipped slot (tap again = unequip)
- **Render pipeline**: `drawCosmetics(ctx, o, equipped)` called as step 9 in both `src/egg/EggCanvas.jsx` (core React canvas) AND `src/egg/renderEggSprite.js` (non-React walker pipeline), inside pose transform — hats/glasses draw over everything including expression
- **Auto-wired everywhere**: App-level `src/components/EggCanvas.jsx` wrapper reads `state.equipped` automatically; all existing `<EggCanvas>` usages (Home large egg, Battle, Map, popups) show equipped items without per-screen changes. The `DecoratedRoom.jsx` room walker (Home background) also reads `state.equipped` into its companion ref → cosmetics now visible on the walking egg too
- **Shop screen redesign (2026-07-03)** — `Collection.jsx` is now cosmetics-ONLY, a full-screen "dressing room": the furniture tab/section was deleted entirely (furniture purchasing moved to `Room.jsx`'s own item picker, unrelated system, unaffected — `roomItems.js`/`ACTIONS.BUY_ROOM_ITEM`/`state.ownedRoomItems` untouched). Layout: a floating header overlay (🪙 coins left, ✕ close → `navigate('home')`, threaded as a new prop from `App.jsx`), a ~43vh egg zone with a canvas-drawn "dressing room" background (warm gradient, gold-framed oval mirror, wardrobe, vanity-bulb glow arc, animated gold sparkles, wooden floor, potted plant — all vector/canvas, no images) behind a large 190px `EggCanvas` + a `Lv.N · [stage name]` pill (reuses the same `battleLevel`/`EGG_STAGE_NAMES` pattern as `Home.jsx`), a 🎩 หัว / 😎 หน้า slot-switcher (replaces the old head/face sub-tabs), a scrollable 3-column item grid, and a single floating bottom CTA button that reflects whatever's currently selected (✅ ใส่ / ❌ ถอด / 🛒 ซื้อ+ใส่ 🪙N / disabled 🔒 ยังไม่มีเงิน / disabled 👀 แตะเพื่อลองใส่ when nothing's selected) — tapping a card now only *selects/previews* it (owned or not, consistent single interaction model), never toggles equip directly; equip/unequip/buy is exclusively the CTA's job. Item names use real CSS ellipsis truncation, not a fixed character count, since several names (e.g. มงกุฎอัญมณี) run past what a short fixed slice would allow. `BottomNav` stays mounted (same full-screen convention as the `Room.jsx` redesign) with matching bottom clearance; a fade gradient sits just above the floating CTA so a scrolled-to-the-fold item row fades out instead of hard-cutting under the button (found and fixed during live verification on a shorter viewport).
- **Live try-on preview** (2026-07-01, mechanism unchanged by the 2026-07-03 redesign — just re-wired to new UI): tapping any item card instantly shows it on the big preview egg. `previewEquipped = preview ? { ...equipped, [slot]: id } : undefined` overrides the big egg's `equipped` prop only; `state.equipped` is untouched until a real buy/equip via the CTA. Preview resets on unmount/buy/equip/slot-switch — leaving the shop never persists an unbought try-on.

### Coin Economy (Earn-only — 2026-06-27)
- **Balance**: `state.coins` (integer ≥ 0); migrated on load so existing players start at 0
- **Earn triggers**: learning round complete (formula below), world battle win (+10 regular / +15 boss), arcade minigame complete (EggMemory +5, EggTower 3–8, EggRun 3–8 by rings, EggCatch 3–8 by score, EggFishing +5), level-unlock first-time bonus (+15, `coinsLevelBonus` flag prevents re-award), daily login (+10 + streak bonus up to +5 = max +15/day)
- **Round formula**: `coins = clamp(round(12 × accuracyMul × masteryMul), 2, 12)` where `accuracyMul = accuracy < 0.5 ? 0.3 : accuracy` and `masteryMul = 1 - mastery` (mirrors XP decay)
- **Typical daily total**: ~40–70 coins for a 20–30 min session (fresh player higher end; mastered player lower end)
- **HUD**: Gold 🪙 badge in Home header (pixel font, `#FFD23F`)
- **Feedback**: `showItemToast("🪙 +N")` on every award; `showItemToast("ล็อกอินรายวัน 🪙 +N")` on daily login
- **Result screens**: All 16 result/end screens display a gold `🪙 +N` badge showing exact coins earned that round (same value dispatched to `state.coins`)
- **Spending**: NOT implemented yet — earn-only. Shop/items/room planned for next phase.

### Friend Code System (Phase 1.1) + Room Visit (2026-07-01)
- `FriendsScreen.jsx`: 2-tab screen reachable from BottomNav "เพื่อน" tab
  - **เพื่อน tab** (unified scroll): pending requests (conditional, no empty state) → My Code ("ABC-DEF" + copy) → Add Friend (6-char input + `send_friend_request`) → My Friends list (from `my_friends` view). All loaded in parallel via `Promise.all` on mount.
  - **ผู้คนอื่นๆ tab**: `get_mystery_adventurers({ p_limit: 8 })` → 8 adventurer cards. **Each card now shows a mini room preview**: left = 72×80 `<RoomScene small>` (room background via the shared `drawRoomScene` helper + the adventurer's companion egg standing in it, wearing their cosmetics via `renderEggSprite`); right = `display_name` + RarityBadge, element·Lv, HP/ATK/SPD (`MiniStat`), and worn cosmetics as small inline icons (`CosmeticIcon` — icon only, **no text label, no "N ชิ้น" count**). **Tapping the card body opens the Room Visit screen** (`RoomVisit`). The "ดูสเตตัส" button (uses `stopPropagation`) still opens the legacy stats portal modal (`<EggCanvasCore size=160>` + 4 StatBars + "ท้าเล่น" mock 3s toast) — the mock-challenge flow is preserved. "🔄 สับใหม่" re-calls RPC.
  - **Room Visit** (`RoomVisit.jsx`): full-screen read-only overlay, slides in from the right. Header = back button (‹) + "ห้องของ [name]". Main = full-bleed room (`RoomScene`, large) + large centered `EggCanvasCore` (their element/eye/gender/stage, `aura` via `stageToAura`, `equipped` from the RPC's `equipped_head`/`equipped_face`). Bottom panel = HP/ATK/DEF/SPD + rarity + cosmetic chips (icon + Thai name) or "ยังไม่ได้แต่งตัว" when both slots empty. Purely visual — no taps on egg/furniture; back button closes.
  - **Shared render helper** (`src/lib/roomScene.js`): `drawRoomScene(ctx, { W, H, roomLayout, small, hint })` extracted from `DecoratedRoom.jsx` (which now delegates to it) so Home / Room editor / friend cards / room-visit all draw the same room art. `small=true` → thumbnail scaling; `hint=false` → no "decorate at the Room menu" text (used for friend rooms). The `small=false, hint=true` path is pixel-identical to the old DecoratedRoom scene — Home/Room verified unaffected.
  - **Graceful degradation before migration**: the room-visit + card previews default `room_layout→{}` and `equipped_head/equipped_face→null` if those fields are missing, so the UI shows an undecorated room + no cosmetics (never crashes) until the new RPC is live.
  - 🔴 **NEW MIGRATION PENDING — MUST BE RUN MANUALLY IN THE SUPABASE SQL EDITOR**: `supabase/migrations/20260701_mystery_adventurers_room_visit.sql`. It `CREATE OR REPLACE`s `get_mystery_adventurers` to add `equipped_head text`, `equipped_face text`, `room_layout jsonb` (real rows from `eggs.state_json`; bots get random plausible cosmetics + a small random layout). **No Supabase CLI / service key exists in the repo — Claude Code cannot apply it.** Until the user pastes-and-runs it at https://supabase.com/dashboard/project/dgpsnlkedergkbhqnjpu/sql, adventurer rooms stay empty + undecorated (as live-tested). Pre-change backup: `db_backups/get_mystery_adventurers_pre_room_visit.sql`. (This is separate from and in addition to the still-pending 20260627 RPC migration below.)
  - ⚠️ **Prior migration also pending**: `supabase/migrations/20260627_mystery_adventurers_egg.sql` replaced the legacy RPC (`creature_seed/creature_name/evo_stage` → `element/eye/gender/stage/hp/atk/def/spd/rarity_label/is_bot`). The 20260701 migration above is written as a full definition that supersedes it, so running 20260701 alone brings the RPC fully up to date. Until any migration runs, adventurers show default values (fire/gba/male/stage1).
- BottomNav: 5th tab (green dot, "เพื่อน")
- Out of scope (Phase 2+): real challenge backend, friend battles, chat, remove-friend, leaderboards

### Living Egg System (New renderer — 2026-06-26)
- `src/egg/` — 8-layer pixel-art egg renderer with full animation support
  - `eggBaseLayer.js` — round baby sprite (18×18) for ALL stages; `EGG_TINTS` per element; `stageSizeMul` (grows then caps at stage 5); `stageSaturation`
  - `eggEyeLayer.js` — 4 eye styles (gba/tama/sanrio/summoners); female eyelashes+blush via `gender`; dark-body contrast inversion for shadow
  - `eggExpressionLayer.js` — 6 moods (normal/happy/sleepy/angry/sad/excited); brows/mouth/cheeks/extras
  - `eggStageLayer.js` — per-element FX overlay (nature leaf, thunder electric rim, fire particles, water bubbles, light sparkles); mass-body replacements for fire/water/shadow/light (via `drawBodyMass`/`isBodyReplacedBy`)
  - `eggAuraLayer.js` — 5 rarity aura levels; levels 1-3 element-tinted, level 4 rainbow
  - `eggRegaliaLayer.js` — element-themed regalia growing with stage: fire/shadow flame horns, light angel halo, thunder Pikachu-tail horns, nature leaf wings; appears at stage 4+ (tier 1)
  - `eggAnimations.js` — 6 animation states (idle/happy/hurt/attack/sleepy/excited); squash/stretch/rotate pose; ground shadow; red flash overlay
  - `index.js` — barrel export
  - `EggCanvas.jsx` — React component, `requestAnimationFrame` loop, DPR-backed canvas, stage 1-9 rendering pipeline
- `src/components/EggCanvas.jsx` — wrapper reading `eye/gender/element` from `CompanionContext`; accepts legacy `stats={...}` prop (extracts `stats.stage`)
- **All screens now render the companion egg** (not the legacy creature): Home (large display + party bar + background walker), Collection (placeholder), PartySelect, Battle player side, Map player sprite — all show companion `element/eye/gender` with stage/aura from XP progress
- **Companion name everywhere** = `state.name` (the child's account name, e.g. โชแปง); no more `creatureName`/`creature.n` shown
- **`src/egg/renderEggSprite.js`** — new shared helper: `renderEggSprite(ctx, {element,eye,gender,stage,aura,mood,anim,t,canvasSize,basePxOverride})` runs the full 9-step compositing pipeline (aura→pose→regalia-behind→body→regalia-front→eyes→expression) for non-React canvas contexts
- Map player sprite: WorldScreen sets `window.__kq_companionEgg = {element,eye,gender,stage,aura,equipped}` on mount (equipped cosmetics added 2026-07-01); `tileEngine.renderPlayerPandora` calls `renderEggSprite` every frame into a reused 32×32 offscreen then `ctx.drawImage` scaled to 40×48 (Pandora-style pseudo-3D renderer, 2026-07-02 — see "Map System" below) — **fully animated** (element FX + equipped head/face cosmetics live), plus a drop shadow and ambient glow ring
- Home walker (`DecoratedRoom.jsx`, formerly `HomeBackground.jsx` — deleted 2026-07-01; walker made genuinely iso-floor-aware and interactive 2026-07-03, see "Home Screen" below): single animated companion egg walks/hops/spins/wanders across the real iso floor inside the room; `renderEggSprite` called per-frame into a reused offscreen sized to the room's current scale (`SIZE`, `basePxOverride` 2 or 3); `companionRef` kept in sync with props including `equipped`; element animations (flames/water/halo) and equipped cosmetics are **live**
- Procedural canvas egg — `eggAlgorithm.js` (**LOCKED**: `drawEgg`, `hash`, `prng` must never change) — still used by minigames (EggRun, EggCatch)
- 9 display stages (ไข่น้อย → ใกล้ฟักแล้ว!!!), adaptive XP threshold (`120 + n×60`, cap 800)
- Pet/feed/item interaction with formal FSM in `useCreatureInteraction.js`
- Tap/swipe handlers in `useHomeInteractions.js`

### Companion Creation (One-time permanent — 2026-06-26)
- `companions` Supabase table: `user_id (PK) | eye | gender | element | created_at` — RLS enforced; no UPDATE/DELETE policy = immutable from client
- `create_companion(p_eye, p_gender, p_element)` RPC — idempotent (ON CONFLICT DO NOTHING); `security definer`
- `src/context/CompanionContext.jsx` — loads companion on auth; exposes `{ companion, resolved, loading, createCompanion }`
- `src/components/CompanionCreation.jsx` — blocking overlay (no close, no Esc); live EggCanvas preview + element/eye/gender pickers; Thai UI; confirm dialog "แน่ใจไหม?"
- App.jsx gate: shown for new players AND existing players with no `companions` row; never shown again after creation
- Migration SQL: `supabase/migrations/20260626_companions.sql` — **must be run manually in Supabase SQL Editor**

### Legacy Creature System (STEP 2+2.5+§3+§4 retired — 2026-06-27)

**Deleted files (zero callers confirmed before deletion):**
- `src/components/BattleScreen.jsx` — orphaned; was never imported in App.jsx
- `src/components/HatchOverlay.jsx` — gated behind `!hasCreature` (never fires for current players); removed from App.jsx
- `src/components/CreatureCanvas.jsx` — only caller was HatchOverlay
- `src/lib/drawCreature.js` — only caller was CreatureCanvas
- `src/lib/creatureAlgorithm.js` — only callers were BattleScreen + EggMemory + LoginBackdrop + WorldHUD (all fixed)
- `src/context/creatureHelpers.js` — only caller was HatchOverlay; dead import in StateContext removed

**Replaced with egg art:**
- `LoginBackdrop.jsx` — 9 random element eggs (RAF loop, `renderEggSprite`) replace floating `drawCreature` creatures; tap=squish SFX
- `EggMemory.jsx` — 6 element emoji cards (🔥💧⚡🌿🌑✨) replace creature canvas cards; no creature dependency
- `WorldHUD.jsx` — removed dead `getCreatureSeed` import and `window.__kq_activeCreatureSeed/Stats` assignments (both globals were never read)

**Still present (active callers remain):**
- `src/lib/creatureSystem.js` — keeps `EVO_STAGE_LABELS_TH` (App.jsx evo toast), `determineElement`/`calcEvoStage` (StateContext, state.js progress)
- `src/lib/creatureGenerator.js` — `buildCreatureDNA`/`generateCreatureName` still used by StateContext hatch flow and state.js migration
- `src/config/creatureConfig.js` — `GRADE_LABELS`/`HATCH_CREATURES`/`TIERS` exported via gameConfig.js; `GRADE_LABELS` used across OnboardingModal, ProfileModal, state.js

**DB columns not yet dropped (STEP 3 pending backup + explicit OK):**
- `hatchedEggs` blob in `eggs.state_json` retains creature-identity fields (dna, evoStage, creature.rarity) — harmless; no UI reads them
- `get_mystery_adventurers` RPC migration (`20260627_mystery_adventurers_egg.sql`) **not yet applied** — new shape returns `element/eye/gender/stage/...`; old shape returns `creature_seed/creature_name`; adventurers show default egg until migration runs
- `db_backups/get_mystery_adventurers.OLD.sql` created in repo (git-recoverable) before applying the migration

**Bond meter / evolution** — progress fields (`bondMeter`, `evoStage`, `battleLevel`, `battleXP`) still stored and computed in StateContext/state.js; companion stage (egg size/regalia/FX) is what's shown, not creature art

### Treasure Chest (Map Chests)
- `TreasureSlot.jsx`: question gate → correct → chest shakes (tap to open) → chest opens → items float up → collect
- Rolls home item (55% from food/ribbon/shoes/rainbow_star) + battle item via `rollBattleItem()`
- Items drawn via `drawItem` canvas with glow + Thai label + type badge (สู้/บ้าน)
- `onReward` passes `{ rewards: [{type,key},...] }`; WorldScreen dispatches `DROP_HOME_ITEM`/`DROP_BATTLE_ITEM` per item
- Wrong answer: red flash + close (no retry)

### Post-Battle Reward Chest
- `RewardChest.jsx`: shown after every world battle victory (incl. bosses); phases: closed→shaking→opening→reveal; tap to open, tap to continue
- Battle item drop: 55% chance via `rollBattleItem()` from `itemConfig.js`
- Home item drop: 40% chance from `HOME_DROP_TABLE` (food 50 / ribbon 25 / shoes 15 / rainbow_star 10) in `WorldBattle.jsx`
- Items dispatched immediately (DROP_BATTLE_ITEM / DROP_HOME_ITEM) then chest shows pixel art of each reward
- Navigate-to-world deferred until player taps through chest

### Battle System (World Battles)
- **Visual upgrade (2026-07-05)**: the battlefield's flat single CSS gradient (shared by every subject) was replaced with `BattleBackground.jsx` — a painted, atmospheric per-subject canvas scene inserted as a new lowest-z-index layer behind the existing `effectCanvasRef`/`overlayCanvasRef` particle canvases. Same "paint once to an offscreen canvas, animate only the moving bits" technique as `Collection.jsx`'s `DressingRoomBackground`: math→Crystal Cave (purple gradient, glowing crystal formations, faint ground runes, drifting light motes), thai→Enchanted Forest (layered tree silhouettes framing the edges, fog band, hash-seeded grass texture, drifting/pulsing fireflies), eng→Sky Arena (aurora band, soft clouds, twinkling stars, a floating stone platform edge for depth) — all three bake in a ground line + radial vignette. Sizes itself via its own `ResizeObserver` on the shared `battleFieldRef` (does not touch `useBattleEffects.js`, which owns the two particle canvases and is unrelated). `GBHPBar.jsx`/`styles.css` also got a glow (`box-shadow:currentColor`), a glossy shine overlay, and a critical-HP pulse animation (`pct<20`) — the existing `width 400ms steps(20)` fill transition is unchanged. Enemy rounding/volumetric shading and ground-contact shadows were investigated as part of this task and found to already exist (from the earlier `EnemyCanvas.jsx` → `drawEnemyPandora` switch and `EggCanvas`'s `drawGroundShadow` call) — nothing new was added there to avoid duplicating them. `particles.js`, `useBattleEffects.js`, and all combat/question/answer logic are unchanged.
- `MoveSelectBattleMode.jsx` (711 lines, refactored) — answer choices = attack moves
- Real HP combat: hit damage = `max(1, creatureStats.ATK − enemy.def) × mult`; miss = SPD/200 dodge + DEF reduction
- Element attack system: 1 random element per battle × 4 tiers (T0–T3 by combo streak); 24 canvas animations in `elementAnimations.js`; `playElementSFX()` 6×4 Web Audio tones
- Battle items: scroll (skip), thunder (15 free damage), gem (double XP), mirror (hint — eliminate 2 wrong), clover (block miss damage). `itemConfig.js` + `PixelItemIcon.jsx`
- Party system: `state.party[]` (up to 4 slots), `PartySelect.jsx` overlay between encounter and battle
- Response time analytics: rolling 50-entry log per subject in `state.responseTimeLogs`
- `WorldBattle.jsx`: wraps MoveSelectBattleMode for world map battles; scales enemy stats via `Math.pow(level, 1.8)`
- Combat logic extracted to `useBattleCombat.js`: fireHit, fireMiss, showVictory, useBattleItem — all refs/setters passed as params, zero behavior change
- **Numpad input mode** (2026-06-18): math arithmetic questions in world battles randomly alternate 50/50 between 4-choice `MoveCard` grid and `NumpadInput` digit-entry (2-digit cap, confirm button, resets per question). `q.inputMode` field set by `genMathQ()`. `NumpadInput.jsx` in `src/components/battle/`.
- **Word-building input mode** (2026-06-18): Thai levels 2–4 and English CVC (level 2) randomly alternate 50/50 between 4-choice and `WordBuildInput` tap-to-spell. `WordBuildInput` is subject-aware: accepts `distractorPool` prop; detects Latin vs Thai via Unicode; uses pixel font + lowercase for English, Thai font for Thai. CVC words split by `correct.word.split('')`.
- **Memory card matching** (2026-06-18): `genMemoryCardQ` picks 3 random alphabet items, creates 6 emoji+char flip cards. `MemoryCardInput` — flip pairs, mismatch flips back, match stays green. Intermediate pairs: `playTone('correct') + spawnEffect('attack')`. Final pair: `fireHit(-1)` → normal question advance. Thai L1–2 (8%) + English phonics (8%). `MemoryCardInput.jsx` in `src/components/battle/`.
- **Fill-the-gap questions** (2026-06-18): `genFillGapQ` shows `[A] [?] [C]` — player picks the missing middle letter from 4 choices. Active for Thai L1–2 (10%) and English phonics (10%). Wrong choices drawn from non-adjacent alphabet positions.
- **Visual discrimination questions** (2026-06-18): `genVisualDiscriminationQ` shows a large target letter; player picks the matching choice from confusable look-alikes (e.g. ก/ถ/ภ, b/d, p/q). Zone 2 renders custom large-char display with gold glow + Thai subtitle. Active Thai L1–2 (10%) and English phonics (10%).
- **Sequencing input mode** (2026-06-18): Thai levels 1–4 (15% chance) and English phonics/cvc (15% chance) may yield a `SequenceInput` question — shuffle 3–4 consecutive alphabet letters, player taps to reorder them. Zone 2 shows 🔤 placeholder. `SequenceInput.jsx` in `src/components/battle/`.
- **Time-based auto-hint** (2026-06-19): if the player hasn't answered within a per-mode threshold (choice/fillgap/visualdiscrim: 4s; numpad: 5s; wordbuild/sequence: 6s; memory: never), a hint fires automatically. Choice/fillgap/visualdiscrim: eliminates 2 wrong choices (same as mirror item). Numpad: shows "💡 ตัวแรกคือ X" below the display. Wordbuild/sequence: the tile hint (gold pulsing border + "👆 ตัวที่กระพริบ" instruction) which was already mastery-based is now also OR'd with `timeoutHintActive`. Guard: timer callback checks `!lockedRef.current && !battleOverRef.current` before firing — no spurious hints if player already answered.
- Canvas particle effects: `particles.js` (beam/orb/lightning/sparks)
- Enemy sprites: `drawEnemy.js` — two independent sprite sets in the same file: the original flat pixel-art set (`drawEnemy()`/`DRAW_FNS`/`drawEnemyHurt()`, 9 types via `ctx.fillRect`) is now dead code (no remaining callers, kept in place rather than deleted); the rounded/volumetric "Pandora-style" set (`drawEnemyPandora()`/`PANDORA_DRAW_FNS`, 10 types incl. `baby_zombie`) added 2026-07-02 for the world map is now used everywhere, including the battle screen — `EnemyCanvas.jsx` (2026-07-03) wraps it in a fixed 70×70 virtual coordinate space (`cx=35, groundY=41`, scaled to whatever `size` prop it's given) sized so every type's tallest reach (bunny ears) and widest low-alpha spread (ghost wisp's ambient halo) clear the canvas edge; `frame` is passed as `0` (static — no slime wobble/ghost bob in battle, matching the old flat art's lack of animation). The hurt-eyes swap (`drawEnemyHurt`) has no Pandora equivalent and was dropped — hit feedback is the existing `hitFlash` CSS filter + defeat animation, unchanged.

### Map System — Pandora-style pseudo-3D renderer (rewritten 2026-07-02)
The world map's rendering was fully rewritten from a flat 16px top-down GB-palette tile grid to a **Pandora-style pseudo-3D renderer** (`tileEngine.js`'s `renderMapPandora()`/`renderPlayerPandora()`, `useWorldGameLoop.js`, `drawEnemy.js`'s Pandora set, `worldDrawHelpers.js`'s Pandora chest/glow) — painted-texture ground tiles (grass speckle/highlight, path pebbles, tall-grass blades, water shimmer) at 32px tiles, tall trees/rounded rocks as standing objects with real height (canopies extend above their tile), and true **Y-sort depth**: every standing/moving thing (player, enemies, chests, trees, rocks, signs, NPCs, maze portals) is collected into one list each frame and drawn back-to-front by its ground-contact screen Y, so nearer objects correctly occlude farther ones (not row-order painter's algorithm). Camera follows the player, clamped to map bounds. All gameplay logic (movement, collision, battle triggers, tall-grass encounters, chest/sign/NPC interaction, maze fog-of-war/portals, saiyan-boost glow) is unchanged — only the drawing changed. This is the SOLE world-map renderer; two earlier approaches (the original flat renderer, and a mid-session isometric-diamond experiment) were built, then fully removed once Pandora was confirmed working end-to-end — see `docs/CHANGELOG.md` and the dated Stage 1-6 entries in `docs/CHATBOT_NOTES.md`'s Handoff section for that staged history if ever needed (recoverable from git history, not present in current code).
- `tileEngine.js` (T constants, collision, camera-independent exports: `T`, `MAP_COLS`, `MAP_ROWS`, `PANDORA_TILE=32`, `canMove`, `getExitAt`, `getEntryPosition`, `EXIT_OPPOSITE`, `EXIT_DIR_NAME`) + `tileMaps.js` (map generators, unchanged — tile type codes are renderer-agnostic)
- **Color palette brightened (2026-07-05)**: the ground/path palette (`P` in `tileEngine.js`) and `TREE_CANOPY_COLORS` read dull/grey on real screens — grass base `#5c8a3c`→`#6aaa3c`, path base `#c4a265`→`#d4a96a`, tall-grass `#4a7a2c`/`#6ab04c`→`#548a34`/`#78c058` (all derived dot/hilite/line shades moved in step so the texture stays cohesive, not just the base tone), tree canopies widened+brightened from `#1d5010–#5ab030` to `#3a9a22–#5abf30`. A faint warm ambient wash (`rgba(255,220,150,0.06)`) is now composited over the whole frame at the end of `renderMapPandora()` (after ground, trees, and all Y-sorted entities) for a sunnier outdoor feel.
- **Ragnarok Online-style overhaul (2026-07-04)**: water brightened to a clearly-blue `#2b83c4`/`#5fb2e8` + seeded sparkle glints; tall grass gained seeded wildflowers; tree trunks are now two-tone with a dark outline, canopies gained a crisp dark outline (drawn as an oversized near-black pass behind the fill so overlapping lobes don't show internal seams) — replaces the old flat/transparent look with an opaque, clearly-outlined RO-style silhouette; rocks got a dark outline too. Every Pandora enemy type (`drawEnemy.js`'s shared `pBody()` helper) now gets a dark outline stroke as well, on top of the drop shadows that already existed. **New dungeon tile theme**: `drawMazeFloor()`/`drawMazeWall()` in `tileEngine.js` paint a dark stone flagstone floor (grout seams, worn-stone speckles) and pseudo-3D stone wall blocks (torch-lit top face, cracked front face, cast shadow, dark outline) — `renderMapPandora()` takes a new `isMaze` param that routes `T.GRASS`/`T.TREE` cells to these instead of grass/tree art on the MAZE screen (no tile-type/collision changes, purely which paint function runs); `useWorldGameLoop.js` now threads its existing `inMaze` flag into this param (previously the dungeon painters would have been dead code even once written). The maze's fog mask and torch-ring color were already correct (achromatic fog, warm-amber torch) — confirmed, not changed.
- 3 world tiers: Green Meadow (tier 0), Dark Forest (tier 1), Crystal Cave (tier 2) — defined in `worldConfig.js`
- Per tier: 4 regular maps (NW/NE/SW/SE) + BOSS map + secret MAZE map
- Boss unlock: all 4 maps cleared + totalXP ≥ 300; defeat boss → cutscene → next tier
- Secret maze: spawns when `battleWins % 10 === 0`; 30-min countdown; clear for 3 random item drops
- **MAZE fog-of-war**: DOM-based CSS mask overlay. A `<div ref={fogOverlayRef}>` with `background: rgba(8,4,14,0.97)` and a `radial-gradient` CSS `mask-image` creates the transparent circle — the gradient is updated every RAF frame via direct `style.WebkitMaskImage`/`style.maskImage` writes from `useWorldGameLoop`. A second `<div ref={torchRingRef}>` (z-index 3) renders a warm amber ring border at the edge of the lit radius. Both refs are sized/positioned each frame. `drawMazeFog()` is fully removed from `worldDrawHelpers.js`. `fogOverlayRef` + `torchRingRef` passed from WorldScreen to `useWorldGameLoop`. All non-MAZE screens unaffected.
- **Maze entry — glowing purple portal object**: replaces old exit-routing-override mechanism entirely. Portal spawns at a random tile on one of NW/NE/SW/SE screens (saved to `state.mazePortal: { screenId, col, row }`). `drawMazePortal()` in `worldDrawHelpers.js` draws pulsing purple rings + orbiting sparkle particles. Player walks into it → confirm dialog (🌀 "ประตูมิติลึกลับ") → confirm → fade transition to MAZE. Clearing the maze (EXIT_N) immediately spawns a new portal on a random screen. No more 30-min countdown timer or exit-routing override. `mazePortalPosRef` passed from WorldScreen to `useWorldGameLoop` for rendering. **Fix (2026-07-05)**: `drawMazePortal` had never been updated when the Pandora rewrite moved everything else from a 16px tile scale to `PANDORA_TILE=32` — it still sized itself off a stale local `TILE=16` constant and its caller was passing a top-left-corner offset assuming the new 32px scale, so the portal rendered at roughly half the correct size AND 8-16px off from its real position, reading as a faint misplaced blob rather than a landmark (reported as "missing"). Now takes an already-centered `(cx, groundY)` like `drawPandoraChest`/`drawPandoraPlayerGlow` and scales off `PANDORA_TILE`; also enlarged/brightened (soft outer bloom, bigger rings, 4 orbiting sparkles instead of 3, ground shadow) so it reads as clearly unmissable.
- **MAZE contents**: `generateMazeMap()` now returns `{ map, openCells, entryPos, exitPos }` (was plain array). `spawnMazeContents(openCells, entryPos, exitPos)` populates 2–3 treasure chests + 3–4 `ghost_wisp` enemies on safe open tiles (>2 Manhattan distance from entry/exit). Exit is a single EXIT_N tile at col 18, row 1 (top-right corner), rendered as a purple portal swirl via `drawMazePortal`. `mazeOpenCellsRef` + `mazeExitPosRef` refs held in WorldScreen; passed to `useWorldGameLoop` for exit portal rendering.
- 10 enemy types with movement patterns (patrol/wander/chase/aggro); 30s respawn timer. `ghost_wisp`: maze-exclusive, slow random drift (timer≥70), never chases, never in isChaser list; renders with purple glow + vertical bob (`sin((frame+col*13)*0.08)*3`). HP 30/ATK 3, subject: null.
- **rainbow_star (saiyan mode)**: chasers (snake/baby_zombie/woken sleepy_bunny) stop moving while boost is active; player can still walk INTO a chaser to trigger battle; non-chasers (bouncy_slime/fox_kit/egg_pawn/leaf_sprite/mushroom_imp) are unaffected. Fast rainbow hue-cycle glow on world-map player sprite (HSL hue 0→360 per 60 frames). `powerup` SFX plays on activation.
- World HUD (WorldScreen.jsx): mini-map + creature status + XP bar + battle items + item bag + home button
- Treasure chests: `TreasureSlot.jsx` slot machine overlay with gate question; `PixelItemIcon.jsx`
- Screen transitions: 160ms fade; player position restored after battle (`state.worldPosition`)

### Learning System
- 3 subjects, mastery-based unlock (≥80% accuracy EMA):
  - **Thai** — 5 levels: letter match, spell ×3, word-order
  - **Math** — 9 levels: L0 count, L1–L5 add/sub/mixed, L6 word-problems, L7 comparison, L8 patterns AB
  - **English** — 4 levels: phonics, CVC, sight words, sentence ordering
- Math visual models: L1/L2 = emoji objects grid; L3 = ten-frame; L4 = cross-out; L5+ = dot visualization
- Teach overlay (first time per level), GameHeader (progress + streak), hint system (amber highlight / reveal)
- Battle subject routing: `battleSubject.js` — strict thai→math→eng rotation with `notready` override
- **Adaptive difficulty system** (2026-06-16):
  - `state.subjectLevels` drives actual battle level (replaces `getBattleLevel()` rotation)
  - After each non-boss battle: `isStrong = accuracy≥80% AND questions≥6`; 3 consecutive strong → level up + cutscene
  - Accuracy <50% AND questions≥6 → silent level down (clamped to `subjectLevelFloor`)
  - Level up dispatches `SET_PENDING_LEVEL_UP` → `LevelUpCutscene.jsx` global overlay shows
  - `LevelUpCutscene.jsx`: flash→reveal→celebrate→done phases; canvas star rain; tap to continue → navigate('world')
  - Map sky tint shifts by subject level: L1=dawn, L2=golden, L3=sunset, L4+=dark (CSS rgba overlay, 3s transition)
  - `WorldBattle.jsx` uses `accuracyRef` (correct/total) — `scoreRef` preserved for backward compat only
- **Grade system** (updated 2026-06-16): `state.grade` computed from avg subject level in `SET_SUBJECT_LEVEL` reducer: avg≥2→grade1, avg≥3→grade2, avg≥4→grade3; grade only advances; creature evoStage updated immediately on grade change via `calcEvoStageInline()`
- **PROGRESSION_MAP** (2026-06-16) — `battleConfig.js` — unified tier/evo/egg system:
  - 5 tiers: อนุบาล (L1) → ป.1ต้น (L2) → ป.1ปลาย (L3) → ป.2 (L4) → ป.3+ (L5)
  - `readyToHatch` set when grade advances and hatchedEggs < 6
  - `calcEvoStage()` reads PROGRESSION_MAP evo thresholds: teen (Lv≥11, Tier≥1); final (Lv≥26, Tier≥3, Bond≥60)
  - `calcEvoStageInline()` in StateContext.jsx for reducer use (avoids circular import)
- `subjectReadiness.js` shared utility: 4 states (Strong/Comfortable/Exploring/Not Ready)

### Home Screen (`Home.jsx`) — redesigned 2026-07-01; full-screen walking room 2026-07-03
The 2026-07-01 layout (header → status bar → room hero zone → minigame card → item tray → explore button, all as separate stacked rows) has been replaced. The isometric room now fills the ENTIRE screen and the companion egg genuinely walks around inside it as the interactive element — there are no rows below the room anymore.
- **`DecoratedRoom.jsx` rewritten** — was previously a read-only background (`showWalker={false}` on Home; a flat left-right-bouncing walker that never actually shipped enabled anywhere) with a separate large static overlay `EggCanvas` on top for interaction. Now DecoratedRoom IS the interactive surface: its walker uses genuine iso tile-space wander targets (`computeRoomGeometry`'s `project(x,y,0)` over the real `FLOOR_COLS×FLOOR_ROWS` floor, not a flat horizontal band), and handles its own tap events on the canvas — tap near the walker → `onPetTap` callback (Home routes this to the existing pet/bond/hatch logic); tap elsewhere on the floor → `hitTestZone(g,px,py,'floor')` + `slotCenter` (the exact functions `Room.jsx`'s editor already uses) → the egg tweens there, bounces, chirps on arrival, then holds briefly before resuming free wander. An imperative `apiRef.walkToScreen(x,y)` (clamped to the floor diamond) lets `Home.jsx` summon the egg to an arbitrary screen point — used when an item button is tapped. Live walker position is published every frame two ways: `walkerPosRef.current` (on-demand reads) and a DOM "follow layer" transform (so reaction emoji/heal-float/particles track the egg with zero React re-renders). `DecoratedRoom` is Home's exclusive consumer — `Room.jsx` never used it and is completely unaffected; `RoomVisit.jsx`/the FriendsScreen thumbnail use the separate, unrelated `RoomScene.jsx` component.
- **Header + status bar** are now translucent floating overlays pinned to the top of the full-screen room (more transparent than the 2026-07-01 version so the room shows through), not layout rows that shrink the room. Same content as before (avatar/name/stage tap → profile/login, 🔥 streak pill, 🪙 coin pill; ❤️HP/⭐XP/💕Bond thin bars).
- **Floating action buttons replace the old minigame card / item tray / explore button rows**: 🎮 minigame (circular, live-lives-count badge, top-left, calls the unchanged `launchRandomMinigame`), 🗺️ explore (circular, bottom-right, unchanged `ENTER_WORLD`+`navigate('world')`+`playTone('start')`), and a 2×2 circular item cluster (🍗🎀👟⭐, bottom-left) that fully preserves the existing count-badge / armed-highlight / active-and-cooldown-timer / dimmed-when-empty logic from the old item tray, just re-skinned as small circles. Tapping an item button arms it (existing two-step `handleTapItem` flow, unchanged) and cues the egg to trot over to the button's real on-screen position (`getBoundingClientRect()`-derived, passed to `apiRef.walkToScreen`) before the "eat"/use effects fire.
- **New-player hatch flow preserved**: `readyToHatch && hatchedEggs.length===0` → pulsing "แตะเพื่อฟักไข่!" CTA, now anchored bottom-center (can't sit on the egg anymore since it moves); tapping the walker itself also still triggers hatch via the same `onPetTap`→`handleEggTap` route.
- **Reaction emoji / heal-float / tap-particles** now render inside the DOM follow-layer described above, so they visually originate from the egg's actual current position instead of assuming a fixed screen-center.
- All of `useHomeAmbience`/`useCreatureInteraction`/`useHomeInteractions` (ambient butterfly/leaf/star events, stage-up banner, growth banner, combo escalation, item effects, cooldowns/boosts) are unchanged internally — only their trigger UI moved. Live-verified end-to-end with the test account: full-screen room with no dead space, tap-far walks to the exact tapped floor tile, tap-near pets, item-button tap visibly walks the egg to the button and uses the item (count decrements correctly), minigame/explore buttons navigate correctly, zero console errors.

### Collection Screen (`Collection.jsx`)
_(This section described a pre-companion-migration version of the screen — party tabs, ItemBag, `CreatureDetailPopup.jsx` — none of which exist anymore; left uncorrected for a long time, fixed 2026-07-03.)_ See "Cosmetic Shop — 'dressing room'" above for what `Collection.jsx` actually is today: a cosmetics-only full-screen dressing room, no tabs, no item bag, no creature cards. The item bag UI lives on the Home screen's item tray; party/creature management is the single-companion model described elsewhere in this doc (`Home.jsx`, `PartySelect.jsx`).

### Report Screen
- Pixel art dark theme (matches Home/Collection)
- Section 1: Overview stats — mins played, rounds passed, accuracy %, streak
- Section 2: Subject XP bars (Thai/Math/Eng) with readiness label from `computeReadiness()`
- Section 3: LEVEL · GRADE — `SubjectLevelCard` per subject; header shows current level name + grade badge; tap expands full level table with ✓/►/· status icons per level
- Section 4: Response speed per subject — avg seconds + trend arrow (only when ≥5 logs)
- Section 5: Parent Report — natural Thai sentences generated from real data
- Section 6: "ควรเล่นอะไรต่อ" — actionable suggestion based on weakest subject + streak
- `SUBJECT_LEVEL_MAP` in Report.jsx: 5 Thai levels, 9 Math levels, 4 Eng levels each with Thai grade label (อนุบาล/ป.1/ป.2)

### Item System
- `state.homeItems`: food/ribbon/shoes/rainbow_star — used on Home screen; affect HP/activeBoosts
- `state.battleItems`: scroll/thunder/gem/mirror/clover — used in battle; drop 10% on victory, 55% from treasure chests
- `state.activeBoosts`: persisted boost state (ribbon/shoes/rainbow_star) with `endsAt` timestamp; ribbon/shoes/rainbow_star boosts stored here after use
- ACTIONS: USE_HOME_ITEM, USE_BATTLE_ITEM, DROP_HOME_ITEM, DROP_BATTLE_ITEM (backward-compat USE_ITEM/DROP_ITEM aliases remain)
- localStorage migration: old `items{}` → homeItems/battleItems; star→rainbow_star, potion→shoes on load
- HOME_ITEMS config in `itemConfig.js` with duration/cooldown per item
- itemArt.js: pixel art for shoes (orange sneaker) + rainbow_star (multicolor 8-arm star)

### Audio
- **Sound is always on** (2026-07-02) — the 🔊/🔇 toggle UI, `soundOn`/`toggleSound` prop chain (App→Home/GameScreen), `setSoundOn()`/`toggleSound()` exports, and the `kq_sound` localStorage key were all removed. `audio.js` keeps a `_soundOn = true` constant and the existing `if (!_soundOn) return` guards (harmless no-ops now) rather than touching every sound function.
- BGM: `playBGM(track)` / `stopBGM()` — 8 tracks via Web Audio API: `home`, `world`, `battle`, `victory`, `login` (existing) + `room`, `shop`, `minigame` (2026-07-02). `victory` now has a real call site (`showVictory()` in `useBattleCombat.js`, alongside the existing `playTone('fanfare')`/`playSFX('victory')`) — previously defined but never played. `room` plays on `Room.jsx` mount, `shop` on `Collection.jsx` mount (both `stopBGM()` on unmount); `minigame` plays right before `navigate('game')` in `Home.jsx`'s `launchRandomMinigame` (no minigame calls its own BGM, so it plays through the whole session).
- SFX: `playSFX(name)` — 19 existing + 9 new (2026-07-02): `coin_earn` (ting-ting, every non-zero coin award), `coin_purchase` (cha-ching, shop purchases), `item_equip` (whoosh+sparkle, cosmetic equip/unequip), `furniture_place`/`furniture_remove` (thud+pop / pop+thud), `room_visit_enter` (bell chime, `RoomVisit.jsx` mount), `minigame_start` (sweep+sting, minigame launch), `lives_empty` (low buzz, minigame "come back tomorrow" message), `unlock_new` (5-note arpeggio, first time a minigame's unlock-level threshold is crossed in a session — detected via a ref-seeded before/after compare of `unlockedGames(eggLevel)` in `Home.jsx`, not persisted across reloads). iOS `touchstart` resume.
- **Coin sound helper**: `dispatchAddCoins(dispatch, amount, bonusKey)` in `StateContext.jsx` wraps every `ACTIONS.ADD_COINS` dispatch — plays `coin_earn` (if `amount` is non-zero) then dispatches. All ~17 call sites across `GameThai/GameMath/GamePhonics/GameShop/GameMathBattle/WorldBattle.jsx` and the 5 minigames now go through this helper instead of dispatching `ADD_COINS` directly. `ACTIONS.DAILY_LOGIN` (a separate action, awards coins inline in its reducer case) plays `coin_earn` at its own dispatch site in `StateContext.jsx`'s init effect. Shop purchases (`BUY_ITEM`/`BUY_ROOM_ITEM` in `Collection.jsx`) play `coin_purchase` directly, not `coin_earn`.
- TTS: Web Speech API — Thai (`speakTh`), English (`speakEn`), math Thai number words
- Creature voice: `playCreatureSound(voiceProfile, moment)` — 5 families, pitch-shifted per DNA
- Static `.m4a` phonics files in `public/sounds/phonics/`

### Minigames (5, lazy-loaded)
`src/lib/minigameLives.js` (2026-07-02) is the single source of truth for per-game daily lives
and unlock gating — `MINIGAMES` config (world key, `livesKey`/`dateKey` state fields, `max`
lives/day, `unlockLevel` vs. companion `battleLevel`, deduct-life reducer action, title),
`livesRemaining(state, key)`, `unlockedGames(level)`, `heartsStr(remaining, max)`. Each game
has its own `ready` phase (title + hearts row + start/locked-out button) before play starts;
starting deducts one life via its `*_DEDUCT_LIFE` reducer case. Lives reset to `max` when the
stored date (via shared `todayStr()`) no longer matches today.

| Game | Unlock (companion battle level) | Lives/day | Description |
|------|-----|-----------|-------------|
| EggMemory | 0 (always) | 5 | Match pairs of element cards |
| EggCatch | 2 | 5 | Catch items, dodge rocks |
| EggRun | 6 | 3 | Endless runner |
| EggTower | 6 | 5 | Stack blocks |
| EggFishing | 10 | 3 | Timing-based fish for items, rarer fish = more coins |

**No dedicated picker screen** — Home's "มินิเกม" shortcut card (`launchRandomMinigame` in
`Home.jsx`) picks uniformly at random among unlocked games that still have lives today, shows
the pooled total as "มีหัวใจ N ดวง", and toasts "เล่นครบแล้ว...พรุ่งนี้" if the pool is empty.
`GameScreen.jsx` itself still has no unlock gating (renders whatever `currentWorld` is set to)
— this remains the only gate. Resolves the "Minigame picker screen" decision that was pending
Chatbot input (2026-07-01 Home redesign) with a lightweight MVP instead of a dedicated screen.

### Persistence & Auth
- localStorage key `kq_state` — always-on, written every state change
- Supabase `eggs` table: `user_id, child_name, state_json, updated_at`
- **Mandatory login** — app fully blocked behind email/password auth; no guest mode
- **Onboarding gate** — new accounts must set name + schoolGrade + gender before app is accessible; `state.name === ''` is the trigger
- `state.schoolGrade` — parent-entered label string (e.g. "ป.1"), informational only, does not affect game progression
- `state.gender` — `'male' | 'female' | 'unspecified'`
- `state.stateVersion` — schema version (currently 1); `migrateStateShape()` deep-merges new nested fields on load
- `state.lastSavedAt` — timestamp used for cloud conflict resolution (replaces `rounds` counter). **`defaultState()` now sets this to `0`, not `Date.now()`** (fixed 2026-07-03 — see below): `0` means "never actually saved," so a genuinely blank/new local state can never masquerade as a recent real save. Only `saveState()` stamps a real `Date.now()`.
- `resolveSync(local, remote)` — single source of truth for cloud conflict resolution in `state.js`. Whole-object last-write-wins by `lastSavedAt` (tie → remote), but **before** that fallback, two additional safety nets run (added 2026-07-03, alongside the pre-existing `hasRemoteCreatures && !hasLocalCreatures` check): (1) `local.lastSavedAt === 0 && remote.lastSavedAt > 0` → remote wins outright; (2) `hasRealProgress(remote) && !hasRealProgress(local)` → remote wins — `hasRealProgress()` (new export in `state.js`) checks `hatchedEggs`/`xpThai+xpEng+xpMath`/`rounds`/`ownedItems`/`ownedRoomItems`/`grade`/`badges`, deliberately EXCLUDING `coins`/`happiness`/login fields, because those are the fields the first-mount maintenance dispatches (`DECAY_HAPPINESS`/`CHECK_DAILY_RESET`/`DAILY_LOGIN`/`ER_SAVE_SCORE`) can touch before the async cloud fetch resolves — using a maintenance-immune signal is what actually closes the cross-device data-loss race for a *returning* player (not just a literally-blank account), since those dispatches would otherwise inflate `local.lastSavedAt` before `resolveSync` ever runs. **Any reducer that mutates persisted state MUST stamp `lastSavedAt: Date.now()`**, otherwise a stale remote snapshot can win a later resolveSync and silently revert the change on reload (bugs fixed this way: `c74e83d` daily-login coins; 2026-07-01 cosmetics/room purchases). Reducers currently stamping it: `DAILY_LOGIN`, `BUY_ITEM`, `EQUIP_ITEM`, `BUY_ROOM_ITEM`, `PLACE_ROOM_ITEM`, `REMOVE_ROOM_ITEM`, and (per the 2026-07-01 full-sweep) all mutating reducers including every minigame `*_DEDUCT_LIFE` case.
- **Initial-sync gate** (`state.js`, 2026-07-03): a module-level `_initialSyncComplete` flag (`markInitialSyncComplete()`/`isInitialSyncComplete()`) blocks `saveState()` entirely — no localStorage write, no Supabase push — until the mount-time `loadState()` → `resolveSync()` → `dispatch(INIT)` chain has resolved (or safely failed; the chain now has a `.catch()` + `.finally(markInitialSyncComplete)` in `StateContext.jsx` so a network failure never permanently disables saving). This closes the actual race: without it, the very first render's `useEffect(() => saveState(state), [state])` could push an empty `defaultState()` to Supabase before the real cloud row had been fetched, overwriting real cross-device progress.
- **Blank-wipe guard** (`state.js`, 2026-07-03): both `saveState()` and `syncToSupabase()` independently refuse to persist/push a state whose `lastSavedAt` is falsy AND that carries no `hasRealProgress()` signal — belt-and-suspenders on top of the initial-sync gate, and the only guard that protects `syncToSupabase()`'s direct callers that bypass `saveState()` (the migration re-push inside `loadState()`, the `SIGNED_IN` auth listener).
- `SaveStatusIndicator.jsx` — fixed bottom-right badge showing saving/saved/error/offline via pub/sub (`onSaveStatusChange`)
- Logout: `supabase.auth.signOut()` + `localStorage.removeItem(KEY)` + `dispatch(INIT, defaultState())` — fully clears local state
- `_migrateBattleStats()` backfills all new fields for legacy eggs on load
- One-time migration flags: `_subjectLevelCalibrated` (recalibrate subjectLevels from levelMastery), `_itemsMigrated` (additive items→homeItems/battleItems merge), `_evoRechecked` (recheck all creature evoStage on load)

### Auth UI
- `LoginBackdrop.jsx` — interactive animated gradient backdrop: 9 tappable creature sprites (squish or temporary evolve on tap), looping 8-note BGM via `startBGM()`/`stopBGM()`, central pixel-art sword "เริ่มเล่น!" start button that opens LoginModal via `onStartTap` prop
- `LoginModal.jsx` — email/password login + sign-up + forgot-password flow; `mandatory` prop disables dismiss + hides ✕ button; pixel-art styling
- `ResetPasswordModal.jsx` — catches `PASSWORD_RECOVERY` Supabase event; two-field password reset
- `OnboardingModal.jsx` — name + schoolGrade + gender picker; cannot be skipped; pixel-art styling
- `ProfileModal.jsx` — name/grade/gender edit + logout; pixel-art styling
- All three modals use `px-auth-sheet` / `px-auth-input` / `px-btn` from the pixel CSS system

### Config Architecture (2026-06-16 refactor)
`gameConfig.js` is a barrel re-exporting from focused split files. All existing imports unchanged.

| File | Contents |
|------|----------|
| `creatureConfig.js` | `HATCH_CREATURES`, `GRADE_LABELS`, `CREATURE_LEVELS`, `TIERS`, `calcCreatureStats()` |
| `battleConfig.js` | `BOSS_XP_THRESHOLD`, `AI_OPPONENTS` |
| `mapConfig.js` | `MAP_THEMES` |
| `gameConfig.js` | All learning content (ITEMS, TH_ALPHA, LEVELS, TEACH_CONTENT, etc.) + barrel re-exports |

### Visual System
- Pixel font: Press Start 2P (EN/numbers), Sarabun (Thai), Mitr/Fredoka One (headings)
- 16-color pixel palette + CSS variable library (`--px-*`) in `styles.css`
- Pixel class library: `px-box`, `px-btn`, `px-hp-bar`, `px-answer-card`, `px-dialogue`, `px-auth-sheet`, `px-auth-input`, etc.
- `image-rendering: pixelated` on all `img,canvas`; square corners everywhere

---

## Removed Systems
- **ChallengerOverlay** — deleted 2026-06-16, confirmed dead code
- **Collection vault/hatched/current tabs** — deleted 2026-06-16; replaced by ItemBag
- **Manual creature naming UI** — replaced by auto-generated names via `generateCreatureName(dna)`
- **GPT workflow** — Claude Chatbot handles all design/research

---

## Not Implemented
- **Minigame picker screen** — no "pick a minigame from a list" screen exists. `GameScreen` renders a minigame from `state.currentWorld`, but nothing dispatched `SET_CURRENT_WORLD` and nothing did `navigate('game')`, so GameScreen + all 5 minigames were unreachable until the Home redesign (2026-07-01) wired the minigame shortcut card to launch Egg Memory directly. Phase 6 (map-tile minigame triggers) still unbuilt. A real picker is a **Chatbot design decision**.
- NPC dialogue system (Phase 4 — next major feature)
- Multi-child profiles / parent account management
- Payment / subscription (target: 199 THB/month)
- Landing / marketing page
- PWA / offline service worker
- Per-session Supabase logging (currently one state blob per user)

---

## Known Issues
None currently.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, plain CSS |
| State | useReducer + Context + localStorage |
| Backend | Supabase (PostgreSQL + email/password Auth) |
| Hosting | Vercel (auto-deploy from `main`) |
| Canvas | HTML Canvas 2D — procedural egg (LOCKED) + pixel art creatures |
| Audio | Web Speech API (TTS), Web Audio API (SFX), static `.m4a` phonics |
