# Claude Code prompt — Egg renderer integration + one-time Companion Creation

Paste everything below the line into Claude Code (use **Opus** — this touches rendering, React state, and Supabase). Before running, place the provided **`egg/` folder at `src/egg/`** (it contains all 8 finalized layer files + a barrel `index.js`; see its `PLACEMENT.md`). Build `EggCanvas.jsx` inside that same `src/egg/` folder.

Do **not** modify `eggAlgorithm.js` (locked). Keep `ENEMY_DATA.subject` dormant.

---

## TASK

Two things: (1) build/replace `EggCanvas.jsx` so it renders the egg using the finalized layers, and (2) add a **one-time, permanent Companion Creation** step where the child picks **eye + gender + element**, shown at game start for new players and force-popped for existing players (e.g. Chopin) who never chose. Once confirmed it is locked and can never be edited.

### PART 1 — `EggCanvas.jsx` render pipeline

Build a React component `EggCanvas` that draws an animated egg to a `<canvas>` via `requestAnimationFrame`. Props: `{ element, eye, gender, mood='normal', anim='idle', stage=1, aura=0, size=... }`.

Import the layer modules from the folder barrel (do not re-implement them): `import { drawAuraLayer, drawRegalia, drawBodyMass, isBodyReplacedBy, drawStageLayer, drawEyeLayer, drawExpression, getEggPose, applyEggPose, flashEgg, drawGroundShadow, isEyesClosed, EGG_SHAPES, stageSizeMul, stageSaturation, stageToTier, EGG_TINTS, EGG_GRAYSCALE } from "./index.js";`. Compositing order **per frame** (mirror `egg_compositor_all.html`'s `renderEgg`):

1. **Device pixel ratio**: back the canvas at `logicalW*DPR × logicalH*DPR`, CSS size = logical; `ctx.setTransform(DPR,0,0,DPR,0,0)` each frame, then `clearRect(0,0,logicalW,logicalH)`. (This keeps the light halo / water gradients smooth and the pixel body crisp.)
2. **Round body for all stages**: `shape = EGG_SHAPES.baby` always (the tall `grown` sprite is deprecated for visuals). `px = basePx * stageSizeMul(stage)` (grows then caps ~stage 5). `tier = stageToTier(stage)`.
3. `drawAuraLayer(ctx,{level:aura,element,cx,cy:eggCenterY,eggR,t})` — behind, NOT pose-transformed.
4. `pose = getEggPose(anim,t)`; draw ground shadow; `applyEggPose(ctx,pose,cx,groundY)`.
5. `ox=-w*px/2; oy=-h*px;`
6. **Regalia behind**: `drawRegalia(ctx,{element,stage,px,ox,oy,faceX:shape.crownX,t,pass:"behind"})`.
7. **Body**:
   - if `isBodyReplacedBy(element)` → `drawBodyMass(ctx,{element,px,ox,oy,t,tier,sprite})` (fire/water/shadow/light).
   - else → `drawTintedBody` equivalent with `sat:stageSaturation(stage)` applied to the palette, then `drawStageLayer(ctx,{element,px,ox,oy,t,tier,sprite})`. **Do not** draw the old element-crown motif (regalia replaces it).
8. **Regalia front**: `drawRegalia(ctx,{...,pass:"front"})` (fire/shadow horns, light halo, thunder Pikachu-tail horns).
9. **Eyes**: `drawEyeLayer(ctx,{style:eye,element,px,ox,oy,faceX:shape.crownX,eyeY:shape.eyeY,blink,gender})` — pass `gender` so female gets eyelashes + blush.
10. **Expression**: `drawExpression(ctx,{mood,eyeStyle:eye,element,faceX:shape.crownX,eyeY:shape.eyeY,mouthY:shape.mouthY,px,ox,oy,t})`.
11. `if(pose.flash) flashEgg(...)`; `ctx.restore()`.

Replace any current egg-rendering component usage in the app with `EggCanvas`, reading `element/eye/gender` from the companion record (Part 2), and `stage/aura` from existing progress.

### PART 2 — One-time Companion Creation (eye / gender / element), permanent

**Supabase schema + lock (new migration):**

```sql
create table if not exists companions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  eye        text not null,
  gender     text not null check (gender in ('male','female')),
  element    text not null check (element in ('fire','water','thunder','nature','shadow','light')),
  created_at timestamptz not null default now()
);

alter table companions enable row level security;

-- read your own; insert your own; NO update/delete policies => immutable from client
create policy "companion_select_own" on companions for select using (auth.uid() = user_id);
create policy "companion_insert_own" on companions for insert with check (auth.uid() = user_id);

-- create-once RPC (idempotent): inserts only if the user has none yet
create or replace function create_companion(p_eye text, p_gender text, p_element text)
returns companions language plpgsql security definer set search_path = public as $$
declare rec companions;
begin
  insert into companions(user_id, eye, gender, element)
  values (auth.uid(), p_eye, p_gender, p_element)
  on conflict (user_id) do nothing
  returning * into rec;
  if rec.user_id is null then
    select * into rec from companions where user_id = auth.uid();
  end if;
  return rec;
end; $$;
revoke all on function create_companion(text,text,text) from public;
grant execute on function create_companion(text,text,text) to authenticated;
```

Because there is no UPDATE/DELETE policy and the RPC uses `on conflict do nothing`, the choice is permanent at the DB level — the client can never change it even if the UI is bypassed.

**Client flow:**

- On app boot, after auth resolves, fetch the user's companion: `select * from companions where user_id = auth.uid()`.
- If a row exists → load `{eye,gender,element}` into app state; never show the creation modal.
- If **no row** (new player OR existing player like Chopin who never chose) → render a **blocking** `<CompanionCreation/>` overlay that cannot be dismissed (no close button, no backdrop-click close, swallow Esc). The rest of the game is unreachable until it completes.
- On confirm → `supabase.rpc('create_companion',{p_eye,p_gender,p_element})` → on success store the returned row in state and unmount the modal. Handle the (rare) race where a row already exists by just using the returned row.

**`<CompanionCreation/>` UI (child-friendly, Thai, big tap targets, game fonts — Press Start 2P for English bits, Sarabun for Thai):**

- Live **`<EggCanvas/>` preview** at the top (stage 1, animated) reflecting the current eye/gender/element so the child sees their companion update instantly.
- Three pickers:
  - **ธาตุ (element)** — 6 big buttons: 🔥 ไฟ / 💧 น้ำ / ⚡ สายฟ้า / 🌿 ไม้ / 🌑 เงา / ✨ แสง.
  - **ตา (eye)** — the eye-style options from `EGG_EYE_LAYER.KEYS` (show each as a mini preview if easy).
  - **เพศ (gender)** — ♂ ชาย / ♀ หญิง (female adds lashes+blush in the preview).
- A confirm button: **"ยืนยันคู่หู"** with a clear note **"เลือกแล้วเปลี่ยนไม่ได้นะ"**. Tapping it opens a small confirm dialog **"แน่ใจไหม? เลือกแล้วแก้ไขไม่ได้อีก"** → ตกลง / ย้อนกลับ. Only commit on ตกลง.
- Default selections so the preview is never empty (e.g. fire / first eye / male).

**Lock everywhere else:** there must be no settings/edit path that changes eye/gender/element after creation. If a name is part of your existing creation flow, keep collecting it, but eye/gender/element are the locked trio per this spec.

Make sure all downstream code reads element/eye/gender from the `companions` row (not from any legacy creature/random source).

### PART 3 — Docs + deploy

- Update `CURRENT_STATE.md`, `TASKS.md`, `CHANGELOG.md`, `CLAUDE.md` in the **same commit** as the code: note the new `eggRegaliaLayer.js`, the round/size-capped stage system + regalia, female eyelashes, the spinning-water body, the Pikachu-tail thunder horns, and the one-time locked Companion Creation (eye/gender/element) with the `companions` table + `create_companion` RPC.
- `git push origin main` (triggers Vercel deploy).
- Send an ntfy.sh notification on completion if that workflow is set up.

### Acceptance checks
- New user → forced creation modal → pick eye/gender/element → preview updates live → confirm → modal never returns; reload still shows the chosen companion.
- Existing user with no `companions` row (simulate Chopin) → same forced modal on next load.
- After creation, no UI can change eye/gender/element; a direct `update`/`rpc` attempt is rejected by RLS / no-ops.
- `EggCanvas` renders all 6 elements, stages 1–9 (body grows then caps, regalia appears at stage 4+), both genders, all moods/anims without errors; light halo and water are smooth (DPR), pixel body crisp.
