# Tasks — KidQuest
_Last updated: 2026-07-02_

---

## Now

### Phase 4 Refactor — MoveSelectBattleMode.jsx split
`MoveSelectBattleMode.jsx` was ~1190 lines. Goal: extract logical modules without changing behavior.

- [x] Round 1 — Extract GBHPBar, EnemyCanvas, MoveCard, HintBar into `src/components/battle/` ✅
- [x] Round 2 — Extract particle/effect canvas system into `src/hooks/useBattleEffects.js` ✅
- [x] Round 3 — Extract fireHit/fireMiss/showVictory/useBattleItem into `src/hooks/useBattleCombat.js` ✅ — MoveSelectBattleMode refactor complete (1190→711 lines)

### Phase 2 Refactor — WorldScreen.jsx split
`WorldScreen.jsx` was 1700 lines; now 1346. Goal: extract logical modules without changing behavior.

- [x] Round 1 — Extract `WorldHUD` into `src/components/world/WorldHUD.jsx` ✅
- [x] Round 1 — Extract `MissionPanel` into `src/components/world/MissionPanel.jsx` ✅
- [x] Round 2 — Extract pure drawing helpers into `src/lib/worldDrawHelpers.js` ✅
- [x] Round 3 — Extract battle-trigger logic into `src/hooks/useBattleTrigger.js` ✅
- [x] Round 4 — Extract RAF game loop (enemy AI, rendering, camera) into `src/hooks/useWorldGameLoop.js` ✅

### Phase 3 Refactor — Home.jsx split
`Home.jsx` was 952 lines; now 848. Goal: extract logical modules without changing behavior.

- [x] Round 1 — Extract ambient/idle effects into `src/hooks/useHomeAmbience.js` ✅
- [x] Round 2 — Extract interaction state machine into `src/hooks/useCreatureInteraction.js` ✅
- [x] Round 3 — Extract item/tap/swipe handlers into `src/hooks/useHomeInteractions.js` ✅ — Home.jsx refactor complete
- [x] Build verify + zero behavior change after each extraction ✅

---

## Next (no Chatbot decision needed)

- [x] **Sequencing input mode** — 3–4 consecutive alphabet letters to reorder; Thai L1–4 (15%) + English phonics/cvc (15%); Zone 2 shows 🔤; SequenceInput.jsx ✅
- [x] **Word-building (tap-to-spell) input mode for Thai battles** — 50/50 random alternation for levels 2–4; WordBuildInput.jsx in battle/; levels 1 and 5 unchanged ✅
- [x] **Numpad input mode for math battles** — 50/50 random alternation; NumpadInput.jsx in battle/; TEACH_INTRO unchanged (safe — isFirstLevel=false always in world battle) ✅

- [x] **Pixel-art modal restyling** — LoginModal, ProfileModal, OnboardingModal now use `px-auth-sheet`/`px-auth-input`/`px-btn` instead of mismatched rounded Mitr/Fredoka-One styles ✅
- [x] **Interactive pre-login backdrop** — tappable creatures (squish/evolve), pixel-art start button, BGM loop + tap SFX, collapsible LoginModal ✅

- [x] **Coin economy (earn-only)** — `state.coins`; earn on round complete, battle win, minigame, level unlock, daily login; anti-farm mastery decay; Home HUD badge; no spending yet ✅ (2026-06-27)

- [x] **Coin spending system — cosmetic shop (head + face items)** — 18 pixel-art items, shop UI, wardrobe auto-wired to all EggCanvas usages ✅ (2026-06-30)
- [x] **Room / Den decoration system** — 12 furniture items, shop furniture tab, room screen with 4×3 grid placement, 5-tab BottomNav ✅ (2026-06-30)
- [x] **Walker cosmetics** — threaded `state.equipped` into `renderEggSprite.js` (drawCosmetics step) + `DecoratedRoom.jsx` companion ref, so the Home-background room walker shows hats/glasses ✅ (2026-07-01)
- [x] **Shop live try-on preview** — Collection.jsx cosmetics tab: big preview egg + tap-any-card instant try-on; unowned = local-only preview (no coins/persist) with "ลองใส่" tag + "ซื้อ" buy; owned = real equip toggle ✅ (2026-07-01)
- [x] **Furniture shop tab genuinely unreachable — CSS flexbox collapse fix** — the 👗/🏠 tab-switcher (and the หัว/หน้า sub-tab bar) collapsed to 2px because `overflow:hidden` on a shrinkable flex item gets min-height 0 inside the flex-column; both tabs were invisible/unclickable to a real pointer. Added `flexShrink:0, flexGrow:0`. Not a data/import bug — corrects the misattributed 2026-06-30 entry. Live-verified in Chrome ✅ (2026-07-01)
- [x] **World-map walker cosmetics** — `WorldScreen.jsx` now includes `equipped: state.equipped` in `window.__kq_companionEgg`; `tileEngine.renderPlayer` already spread the whole companion object into `renderEggSprite`, so the map walker picks up the existing `drawCosmetics` step automatically — same pattern as the Home room-walker fix above ✅ (2026-07-01)
- [x] **Delete dead HomeBackground.jsx** — confirmed zero remaining imports (Home.jsx uses `DecoratedRoom`); deleted the file and a stale comment reference in Home.jsx ✅ (2026-07-01)
- [x] **Stamp lastSavedAt on every mutating reducer** — full sweep of `StateContext.jsx` (~70 `case ACTIONS.*` reducers) so ANY state mutation stamps `lastSavedAt: Date.now()`, closing the whole resolveSync-revert bug class (not just the two instances already caught: coins in `c74e83d`, cosmetics/room items in `036070f`). `ADD_COINS` specifically included. Live-verified a coin bump survives reload ✅ (2026-07-01)
- [x] **Home screen redesign (approved layout)** — Home.jsx rewritten to: simplified header (avatar/name/stage · 🔥streak · 🪙coins · 🔊), new thin status bar (❤️HP · ⭐XP · 💕Bond — Bond shown on Home for the first time), DecoratedRoom promoted to the central hero zone (walking egg visible) with a floating Lv·stage pill, party bar removed, compact evolution bar removed, pre/post-hatch branch split collapsed (new-player hatch CTA preserved), minigame shortcut card added, item tray restyled (logic unchanged), full-width explore button. Live-verified in Chrome. Build clean ✅ (2026-07-01)
- [x] **Companion egg enlarged on Home** — the redesign left the companion as only a 48px room-walker sprite, too small to be the screen's main character. `DecoratedRoom` gained a `showWalker` prop (default true, `Room.jsx` unaffected); Home now renders `showWalker={false}` (room art only) plus a large centered 200×236 interactive `EggCanvas` on top, with cosmetics/tap-to-pet/bounce/glow/particles all working exactly as pre-redesign. Live-verified ✅ (2026-07-01)
- [x] **Friends room visit + cosmetics display** — mystery-adventurer cards now show a mini room preview (72×80 `RoomScene`: room + companion egg + cosmetics) + stats + inline cosmetic icons; tapping a card opens a full-screen `RoomVisit` overlay (slide-in from right, their room + large egg + stats + cosmetic chips, back button). Shared `drawRoomScene` helper extracted from `DecoratedRoom.jsx` (Home/Room verified unaffected). RPC `get_mystery_adventurers` extended with `equipped_head`/`equipped_face`/`room_layout` — **new migration `20260701_mystery_adventurers_room_visit.sql` MUST be run manually in the Supabase SQL Editor; until then the UI degrades gracefully (empty rooms / no cosmetics)**. `ดูสเตตัส`/`ท้าเล่น` modal flow preserved. Live-verified in Chrome ✅ (2026-07-01)

- [x] **Minigame daily-lives + unlock-gating system** — `src/lib/minigameLives.js` single source of truth (`MINIGAMES` config, `livesRemaining`, `unlockedGames`, `heartsStr`); all 5 minigames (Memory/Catch/Tower/Fishing/Run) now have a `ready` phase showing hearts + start/locked-out button, gated by companion battle level (0/2/6/6/10) and daily lives (5/5/5/3/3, reset via shared `todayStr()`). Fixed a real pre-existing bug found while wiring this up: `EggRun.jsx`'s own inline lives-reset check compared `state.lastRunDate` (stamped by the reducer using `todayStr()`, e.g. `"2026-7-2"`) against `new Date().toLocaleDateString()` — the two formats never match, so EggRun's own ready screen was permanently stuck showing 3/3 hearts regardless of actual remaining plays. Migrated EggRun to the shared module, closing the gap. Resolves the "Minigame picker screen" decision below with a lightweight MVP (no dedicated screen — Home's shortcut card picks randomly among unlocked games with lives left). Coin-reward formulas also rebalanced (higher variance, generally moved from flat 3-tier to reward skill more). Live-verified in Chrome: all 5 ready screens show correct/matching hearts, Home total agrees with each game, EggRun date-format fix confirmed with a direct before/after check, zero console errors. Build clean ✅ (2026-07-02)

- [x] **World map — Pandora-style pseudo-3D rewrite** — full replacement of the flat 16px GB-palette tile renderer with a painted-texture, Y-sorted pseudo-3D renderer (32px tiles, tall trees/rocks with real height, drop shadows on every standing/moving object, player-follow camera). Built and shipped in 6 stages (ground tiles → trees/rocks/Y-sort → player+camera → enemies redrawn → chests/signs/NPCs → polish + delete old renderers), each stage independently verified live in Chrome before the next was authorized. An earlier isometric-diamond approach was also built (3 stages) before a design pivot replaced it with this Y-sort technique — that iso work was left dormant then fully deleted in the final stage once Pandora was confirmed solid; recoverable from git history if ever needed (commits `bcd8e06`/`e702ce8`/`d0ad20f`). Enemy art: `drawEnemy.js` now holds two independent sprite sets — the original flat pixel-art set stays untouched and is used only by the battle screen (`EnemyCanvas.jsx`), a new rounded/volumetric set is used only by the world map; verified live that a real battle (Egg Pawn) still renders correctly post-rewrite. Maze fog-of-war/torch-ring/portals and the saiyan-boost rainbow glow — all previously flat-renderer-only features — were ported into the Pandora renderer so no functionality regressed when the flat renderer was deleted. Full spec: `docs/HANDOFF_pandora_worldmap.md`. Build clean, zero console errors across every verification pass ✅ (2026-07-02)
- [x] **World map visual polish rounds 1-3** — full-screen ground (no letterbox void at map edges), richer grass/path/tree texture (irregular patches, per-tile-seeded tree size/color, undergrowth), tactile circular D-pad + purple-gradient action pill, translucent/blurred HUD, vignette/sunlight overlay (round 1); exit-edge pulsing arrows, animated water foam/wave drift, shoreline fringe, bigger trees + auto-selected palm variant near water, ambient grass decoration (round 2); off-map filler trees so the world reads as endless forest instead of a rectangle on a void, bigger/lumpier organic tree canopies, fixed a `tileHash()` negative-index bug that was muddying far-corner canopy colors (round 3). Gameplay logic untouched. Build clean each round ✅ (2026-07-02)
- [x] **Battle screen enemies given the Pandora art style** — `EnemyCanvas.jsx` (used by `MoveSelectBattleMode.jsx` at size 120 and 80) now calls `drawEnemyPandora()` instead of the original flat pixel-art `drawEnemy()`/`drawEnemyHurt()`, so battle enemies match the rounded/volumetric look already shipped on the world map. Wrapped in a fixed 70×70 virtual coordinate space (ground-anchored, same convention as the world map) scaled to the canvas's `size` prop, tuned so every enemy type's tallest reach (bunny ears) and widest low-alpha spread (ghost wisp's ambient halo) clear the canvas edge without clipping — verified for all 10 types at both battle sizes via a live in-browser dynamic-import test harness (screenshots, zero console errors). `frame` passed as static `0` (no slime wobble/ghost bob in battle — scope kept to art parity, not adding new animation). No Pandora equivalent exists for the old hurt-eyes swap (`drawEnemyHurt`); hit feedback is unchanged (`hitFlash` CSS filter + defeat animation). The original flat sprite set (`drawEnemy()`/`DRAW_FNS`/`drawEnemyHurt()`) is now unused dead code, left in place rather than deleted. `npm run build` clean. Could not exercise a live battle end-to-end (Supabase login gate, no test credentials this session) — verified via direct module import instead ✅ (2026-07-03)
- [x] **Icon-first UI pass — every text-only button now has an icon** — a prior audit found ~41 tappable elements across the app showing only Thai/English text, unreadable to a child who can't read yet. Fixed all of them: `BottomNav.jsx` (5 tabs get real icons 🏠🛒🏡📊👥 replacing plain color swatches, active tab glows gold + scales up), `Collection.jsx` (wearable sub-tabs 🎩/😎, equip toggle is now icon-only ✅/❌ with a gold glow when equipped, furniture place button gets 🏠), `Room.jsx` (zone switcher 🟫/⬅️/➡️, remove/swap action-sheet buttons now icon-only 🗑️/🔄 — **note: the zone switcher itself was removed entirely by the very next Room redesign task below**), `MoveSelectBattleMode.jsx` (TTS replay 🔊 enlarged to icon-only, victory-return button gets 🏃💨, teach-intro dismiss gets an ⚔️ prefix; item use/cancel buttons deliberately KEPT a tiny text label alongside their icon — full icon-only risked use-vs-cancel ambiguity mid-battle), `WorldScreen.jsx` (NPC talk 💬 and sign read 📋 now icon-only, boss-flee/maze-entry dialogs get icon+tiny-label, item-bag "CLOSE" replaced with ✖️), `FriendsScreen.jsx` (view-stats button gets 📊), `Home.jsx` (new-player hatch CTA shrunk from a full sentence to 👆 + "แตะ!" since the real egg sprite is already on-screen above it), `TreasureSlot.jsx` (collect button gets 🎁). Every touched button got a 44×44px minimum touch target and an `aria-label` where it went icon-only. Buttons that already had an icon (🪙 buy buttons, 🗺️ explore, minigame starts, ✓/✕ accept/decline, D-pad) were left untouched — not in scope. No game logic/state/reducers/content changed. Implemented by a fresh Opus subagent (coordinator reviewed every diff file-by-file before accepting), build clean. Only `BottomNav` was visually confirmed live (standalone dynamic-import mount, screenshot-verified) — the other 7 files sit behind the same Supabase login gate noted in the entry above and were verified by code review only ✅ (2026-07-03)
- [x] **Room UX redesign — full-screen canvas, tap-anywhere, unified bottom sheet** — screenshot review of the iso room found two problems: the room was small and floated in empty dark space, and the child had to pick a zone tab before tapping a slot. Fixed both plus added decorating polish. `roomScene.js`: `hitTestZone`'s `zone` param is now optional (omit it to auto-test floor→left_wall→right_wall and return the first hit — powers tap-anywhere); new `drawTapHints()` (all-zone pulsing gold "+" on empty slots, soft glow on occupied ones, gated behind a `showTapHints` param only `Room.jsx` sets); `drawFloorFurniture`/`drawWallFurniture` gained optional `bounceKey`/`bounceScale` for the placement pop animation; added a floor vignette, wall wallpaper-texture + ceiling-shadow strip, ambient light glow, and a wall-item hanging shadow (all `!small`-only, so the FriendsScreen thumbnail is unaffected). `Room.jsx` near-fully rewritten: canvas is now `flex:1` (fills the screen above the bottom nav, `ResizeObserver`-driven instead of a fixed 380px height), header shrunk to a translucent top-left pill overlay, zone-tab switcher deleted entirely, the old two separate picker/action modals merged into one unified bottom-sheet (`40vh`, shows the auto-detected zone header, occupied-item+remove-button when applicable, and a 3-column grid of the FULL zone catalog with owned/elsewhere/locked card states — locked items now visible with a 🔒+price nudge instead of being hidden), and a single self-stopping rAF loop drives the tap-hint fade, the placement bounce, and a sparkle burst (reusing `mkSparks`/`tickEffects` from `particles.js`, the same system battle effects use — no new particle code). `roomLayout` schema, `ownedRoomItems`, and the `PLACE_ROOM_ITEM`/`REMOVE_ROOM_ITEM` payload shapes are all unchanged. Deliberately skipped: real swipe-to-dismiss on the sheet (tap-outside-scrim only) and a dedicated swap button (tapping any other owned item while a slot is occupied already swaps it, since placement overwrites unconditionally). Implemented by an Opus subagent that hit the same session-quota wall as the earlier Pandora world-map work partway through (only the `hitTestZone` change had landed), resumed once the quota reset ~1hr later and completed the rest. Coordinator verified: `DecoratedRoom.jsx`/`RoomScene.jsx` (RoomVisit + FriendsScreen thumbnail) call sites confirmed via grep to pass none of the new params, so they're unaffected; full line-by-line diff review of both files. `npm run build` clean. Live verification attempted via a standalone `<StateProvider><Room/></StateProvider>` mount (bypassing the login gate entirely, since Room.jsx only needs app state, not auth) but hit a Vite HMR module-identity mismatch (`useAppState` resolved against a different `StateContext` module instance than `Room.jsx`'s own import, since the two dynamic `import()` calls picked up different HMR-versioned URLs) — a testing-harness artifact, not an app bug; cleaned up the test DOM/localStorage and fell back to code-review-only verification, same limitation as the last two sessions ✅ (2026-07-03)
- [x] **Fix critical cross-device sync data-loss bug** — bug report: a device with real progress synced to Supabase gets its data silently wiped/overwritten when the account is opened fresh on another device. Root cause (found by an earlier report-only audit this session): `defaultState()` stamped a live `lastSavedAt: Date.now()` even for blank state, so a brand-new device's empty state looked exactly as "fresh" as a real recent save; the mount-time `useEffect(() => saveState(state), [state])` could push that blank state to Supabase before the async cloud fetch resolved and corrected it; and `resolveSync()`'s only safety net checked `hatchedEggs`, leaving coins/items/xp/level completely unprotected. Fixed in `state.js`/`StateContext.jsx`: (1) `defaultState().lastSavedAt` is now `0` ("never saved"), not `Date.now()`; (2) a new `_initialSyncComplete` module flag blocks `saveState()` entirely (no localStorage write, no Supabase push) until the mount-time `loadState()`→`resolveSync()`→`INIT` chain resolves — the chain now has a `.catch()` + `.finally(markInitialSyncComplete)` so a network failure never permanently disables saving; (3) `resolveSync()` gained two new early-return safety nets before its existing timestamp fallback — `local.lastSavedAt===0 && remote.lastSavedAt>0` → remote wins, and a new `hasRealProgress()` field-based check (`hatchedEggs`/xp/`rounds`/`ownedItems`/`ownedRoomItems`/`grade`/`badges`) → remote wins if it has real progress and local doesn't; (4) both `saveState()` and `syncToSupabase()` independently refuse to persist/push a state that's both unstamped and has no real progress (belt-and-suspenders, and the only guard protecting `syncToSupabase()`'s direct callers that bypass `saveState()`). **The critical subtlety** (caught by the coordinator before delegating, then independently traced and confirmed by the implementing agent): the first-mount maintenance dispatches (`DECAY_HAPPINESS`/`CHECK_DAILY_RESET`/`DAILY_LOGIN`/`ER_SAVE_SCORE`) all stamp `lastSavedAt: Date.now()` in-memory *before* `loadState()`'s network fetch resolves — so a naive fix would still have let an inflated-but-empty local state beat real remote progress for a *returning* player (not just a truly-blank account). `hasRealProgress()` is deliberately built only from fields those dispatches never touch (excluding `coins`/`happiness`/login fields), which is what actually closes the gap without regressing the intentional same-device daily-login-coins-win-the-tiebreak behavior. Implemented by an Opus subagent with a very detailed brief (coordinator traced the timing gap independently first and fed it into the prompt as a required fix, not just the user's literal 4-step spec). Coordinator verified by reading the full diff and independently re-tracing the reducer cases (grepped the actual `DAILY_LOGIN`/`DECAY_HAPPINESS`/etc. cases to confirm none touch `hasRealProgress()`'s tracked fields) rather than trusting the agent's report. **Live-tested end-to-end for the first time this session** (using the new test account — see `CLAUDE.md`'s Live Browser Testing section): cleared `localStorage` to simulate a fresh device, logged into the real test account, confirmed the real cloud data (9999 coins, 8 cosmetics, 12 room items) loaded correctly instead of being wiped — console log confirmed the new `resolveSync` branch fired (`"local never saved (lastSavedAt 0), remote has a real save"`); reloaded again on the "same device" and confirmed no regression (data stayed intact, `"local wins"` via the normal timestamp path). `npm run build` clean ✅ (2026-07-03)
- [x] **Shop redesigned as a full-screen "dressing room"; furniture tab removed** — the Shop/Collection screen had a furniture tab that's now redundant (furniture buys directly from Room's own item picker) and a cramped tabbed-list layout. `Collection.jsx` rewritten: furniture tab/section/`FurniturePreview`/`ZONE_LABEL`/`handleBuyFurniture`/`isOwnedRoom`/`ROOM_ITEMS` import all deleted (grep confirms zero references left; `roomItems.js`/`ownedRoomItems`/`BUY_ROOM_ITEM` untouched). New layout: a canvas-drawn "dressing room" scene (gold-framed mirror, wardrobe, glowing vanity bulbs, animated sparkles, wooden floor, potted plant — all vector, no images) behind a large 190px companion egg with a Lv/stage pill, a 🎩หัว/😎หน้า slot switcher, a scrollable 3-column item grid (owned/equipped/locked-with-price states), and a single floating CTA button (✅ใส่ / ❌ถอด / 🛒ซื้อ+ใส่ / 🔒) that's now the ONLY way to equip or buy — tapping a card just selects/previews it (unified interaction model, replacing the old inconsistent tap-to-toggle-if-owned behavior). Confirmed `BUY_ITEM` auto-equips (checked the reducer directly) so buy+equip is a single dispatch. `App.jsx` threads a `navigate` prop into `Collection` for the first time (needed for the new ✕ close button). Implemented by an Opus subagent from a brief grounded in the actual current code (coordinator read `Collection.jsx`/`EggCanvas.jsx`/`eggCosmeticLayer.js` first and corrected two spec assumptions before delegating: item names run past a 4-character truncation limit the spec suggested — several like มงกุฎอัญมณี are 8-11 chars, so real CSS ellipsis is used instead of a character slice — and the close button had nowhere to navigate to since Collection received no props at all). **First Shop-area feature live-tested end-to-end with the new test account** (not just code review): logged in fresh, opened the shop, confirmed the dressing-room scene renders correctly, tapped an unowned item and confirmed live preview on the egg, tapped the CTA and confirmed a real purchase (coins 10010→9965, exactly -45, item got a ✓ equipped badge, egg now genuinely wearing it), switched slots, and confirmed the close button returns to Home with the equipped item visible on the Home room walker too. **Found and fixed one real bug during live testing that code review didn't catch**: on a shorter viewport, the floating CTA button hard-overlapped a row of item cards on initial (unscrolled) load — content was still fully reachable via scroll, but the hard edge looked like a rendering glitch; fixed with a small fade-gradient overlay above the CTA so scrolled content fades out instead of cutting off. Also corrected two now-stale pieces of `CURRENT_STATE.md` found while updating docs: a furniture-tab reference in the Room section, and an entire "Collection Screen" doc block that had been describing a pre-companion-migration version of the screen (party tabs/ItemBag/CreatureDetailPopup) for a long time. `npm run build` clean ✅ (2026-07-03)

- [ ] **Phase 4: NPC System** — 5 NPCs (Prof Owl already wired; add Grandma Turtle, Clover Kid, Crystal Fairy, Sleepy Mole). Per-NPC: dialogue lines, gift on first talk, repeat-visit dialogue. Use `SCREEN_NPCS` config in `tileMaps.js`.
- [ ] **Thai content expansion** — Levels 6–8: fruits/everyday objects, short phrases, simple sentences (อนุบาล → early ป.1 content)
- [ ] **Math content expansion** — Levels 9–10: place value, counting to 100 (early ป.1 stretch)
- [ ] **English content expansion** — Levels 5–6: longer sentences, basic comprehension

---

## Later (needs Chatbot design first)

- [x] **Minigame picker screen** — resolved 2026-07-02 without a dedicated screen: see "Minigame daily-lives + unlock-gating system" in Done below. Still open if wanted later: a real picker screen showing all 5 with per-game lives (vs. the current random-pick shortcut), or routing via map tiles (Phase 6) instead.
- [ ] **Cooking Mission MVP** — after Shop play-validation with Chopin; needs readiness data from real play
- [ ] **Phase 5: Treasure refinement** — fixed treasure spots + hidden clovers per screen
- [ ] **Phase 6: Minigame world triggers** — fullscreen minigame launched from map tile
- [ ] **Phase 8: King Clover Bear boss** — boss arena + full boss flow; needs Chopin playtest gate first
- [ ] **ECA-5: Shop egg presence** — small egg canvas corner of GameShop.jsx (low priority)
- [ ] **First-run onboarding** — before ProfileModal opens; needs UX design
- [ ] **Parent dashboard** — protected route, separate from Report tab

---

## Infrastructure (later)

- [ ] Per-session logging to Supabase `sessions` table
- [ ] Multi-child profiles (state shape refactor + `children` table)
- [ ] Payment integration (Omise or Stripe, 199 THB/month)
- [ ] PWA manifest + service worker
- [ ] Landing / marketing page

---

## Done (major systems)

- [x] **Isometric Room decoration system** (2026-07-02) — converted Room/Den from a flat
  top-down 12-slot CSS grid to a true 2:1 iso interior (`roomScene.js`: 6×4 diamond floor +
  two back walls, zone-prefixed slot keys `{zone}_{a}_{b}`). Added `allowedZones` + iso
  contact-shadow/side-face draw treatment to all 12 `roomItems`; rewrote `Room.jsx` as a
  single canvas that draws + hit-tests with a 3-tab zone switcher (พื้น/ผนังซ้าย/ผนังขวา);
  renamed `PLACE/REMOVE_ROOM_ITEM` payloads `slotIndex`→`slotKey`; added `migrateStateShape`
  logic that resets stale numeric-key layouts to `{}` (bumping `lastSavedAt`) while never
  touching `ownedRoomItems`; added zone badges to Collection furniture cards. Build clean,
  render + hit-test + migration verified functionally (Room screen itself is behind the
  Supabase login gate).

- [x] **Audio expansion: new SFX/BGM, sound toggle removed** — 9 new SFX (coin_earn,
  coin_purchase, item_equip, furniture_place/remove, room_visit_enter, minigame_start,
  lives_empty, unlock_new) wired to their real dispatch/mount sites; 3 new BGM tracks
  (room/shop/minigame); `victory` BGM given a real call site (previously defined but never
  played); coin awards routed through a new `dispatchAddCoins()` helper in `StateContext.jsx`
  so every one of the ~17 `ADD_COINS` call sites plays `coin_earn` automatically; sound
  on/off toggle UI + `kq_sound` localStorage key removed — sound is always on. Live-verified
  in Chrome (shop purchase, equip/unequip, furniture place/remove, room visit overlay,
  minigame launch + full Egg Memory playthrough triggering a real coin award, zero console
  errors); battle-victory BGM verified by code review only (couldn't get world-map movement
  input working in the automated browser session to trigger a live battle win). Build clean ✅ (2026-07-02)

- [x] **fix: bought cosmetics/room items reverting on reload** — `BUY_ITEM`/`EQUIP_ITEM`/`BUY_ROOM_ITEM`/`PLACE_ROOM_ITEM`/`REMOVE_ROOM_ITEM` now stamp `lastSavedAt` so `resolveSync` doesn't pick a stale remote and revert the purchase (same class as `c74e83d`) (2026-07-01)

- [x] **Living Egg renderer + Companion Creation** — `src/egg/` 8-layer system; `CompanionContext`; blocking `CompanionCreation` modal; `companions` Supabase table + RPC (2026-06-26)
- [x] **Companion egg on all screens** — Home/Collection/PartySelect/Battle/Map all show companion egg; name = `state.name`; `drawCreature` retired from player-side rendering (2026-06-26)
- [x] **Home walker + Collection placeholder** — HomeBackground uses companion egg (drawEggBody+drawEyeLayer to 48×48 offscreen) instead of drawCreature; Collection replaced with "เร็วๆ นี้!" placeholder (EggCanvas + coming-soon text); CreatureDetailPopup.jsx deleted (2026-06-27)
- [x] **Full-pipeline animated walkers + Mystery Adventurers eggs** — `renderEggSprite.js` shared helper; Home/World walkers redrawn per-frame (element animations live); FriendsScreen MysteryTab uses EggCanvasCore; `get_mystery_adventurers` RPC migration written (20260627_mystery_adventurers_egg.sql — apply manually) (2026-06-27)
- [x] **Legacy creature art removal STEP 2+2.5+§3+§4** — BattleScreen/HatchOverlay/CreatureCanvas/drawCreature.js/creatureAlgorithm.js/creatureHelpers.js deleted; LoginBackdrop→egg sprites; EggMemory→emoji; WorldHUD dead globals removed. 165 modules. STEP 3 (DB column drops) pending backup+OK. (2026-06-27)

- [x] **Phase 1.1 Friend Code System** — FriendsScreen.jsx: 2-tab layout (เพื่อน unified scroll + ผู้คนอื่นๆ mystery tab); get_mystery_adventurers RPC; mock challenge toast (2026-06-20)
- [x] **Phase 1 Friend Code System** — FriendsScreen.jsx (4 tabs: My Code / Add / Requests / List); BottomNav 4th tab; Supabase RPCs wired (ensure_friend_code, send_friend_request, respond_friend_request, my_friends view) (2026-06-20)
- [x] Adaptive difficulty system: auto level-up (3 streak ≥80%) + silent level-down (<50%) + LevelUpCutscene + map sky tint by level (2026-06-16)
- [x] Unified progression via PROGRESSION_MAP: tier advance → grade/readyToHatch; calcEvoStage reads thresholds; CreatureJourney roadmap in Collection (2026-06-16)

- [x] React 18 + Vite migration from single-file HTML prototype
- [x] Supabase auth + cloud sync; guest mode; localStorage always-on
- [x] Procedural egg algorithm (LOCKED) — 9 stages, adaptive XP pacing
- [x] Creature system: DNA (creatureGenerator.js) + pixel art (creatureAlgorithm.js), 6 elements × 3 stages, bond meter, evo, auto-names
- [x] Unified creature drawing: `drawCreature` from `creatureAlgorithm.js` used by all screens
- [x] Battle system: MoveSelectBattleMode, real HP, party (4 slots), elements × 4 tiers, battle items
- [x] Map system: canvas tile engine, 3 world tiers, 4 maps per tier + boss + maze, 9 enemy types, HUD
- [x] Learning: Thai 5L, Math 9L, English 4L — mastery unlock, teach overlay, hints, adaptive battle subject
- [x] Home screen: canvas background with walking creatures, egg FSM, creature zone, party bar
- [x] Collection: party/vault/all/current-egg tabs, creature detail popup
- [x] Report: subject readiness, response time analytics, session history
- [x] Minigames: EggRun, EggCatch, EggMemory, EggTower, EggFishing
- [x] Item system: home items (food/ribbon/star/potion) + battle items (scroll/thunder/gem/mirror/clover)
- [x] BGM + SFX (Web Audio API), creature voice (playCreatureSound), Thai/English TTS
- [x] Phase 1 refactor: split gameConfig.js into focused barrel files
- [x] Response time analytics (rolling 50-entry log, Report display)
- [x] ECA relationship fields (adventuresWith, questionsAnswered)
- [x] Hatch biography phase, evolution animation toast
- [x] Visual system: pixel fonts, 16-color palette, CSS class library, emoji-free UI
- [x] ChallengerOverlay deleted (confirmed dead code, 2026-06-16)
- [x] Home creature interaction: tap/swipe bond, bounce animation, emoji reaction

---

## Development Workflow

```
1. npm run build          → confirm zero errors before committing
2. git add <specific files>
3. git commit             → meaningful message
4. git push origin main   → Vercel auto-deploys
5. Update docs            → CURRENT_STATE, TASKS, CHANGELOG, CHATBOT_NOTES (same commit)
6. curl ntfy.sh notification
```
