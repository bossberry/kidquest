# Where to put these files

Drop the **whole `egg/` folder** into your source tree as:

```
src/egg/
```

(If your app root isn't `src/`, put it wherever your other UI/game code lives. It just needs to be inside the bundled source so Vite compiles it.)

### Final structure

```
src/
  egg/
    index.js                ← barrel (single import point)
    eggBaseLayer.js         ← round body for all stages + stageSizeMul / stageSaturation
    eggEyeLayer.js          ← eyes (+ female eyelashes/blush)
    eggExpressionLayer.js   ← mood mouth/brows
    eggElementLayer.js      ← legacy crown motif (kept, unused by EggCanvas)
    eggStageLayer.js        ← mass bodies (fire/water/shadow/light) + per-tier FX
    eggAuraLayer.js         ← aura glow
    eggRegaliaLayer.js      ← element regalia (horns/halo/wings, by stage)  ← NEW
    eggAnimations.js        ← poses, pose transform, ground shadow, flash
    EggCanvas.jsx           ← created by the integration prompt (Part 1)
    PLACEMENT.md            ← this file (you can delete after reading)
  ...
  eggAlgorithm.js           ← LEAVE WHERE IT IS. Locked. Not part of this folder.
```

### Important
- **Do not move `eggAlgorithm.js`.** It's locked and other code imports it from its current path. None of these layer files import it, so they don't care where it lives.
- All cross-file imports inside the folder are relative (`./eggEyeLayer.js`, etc.), so they just work as long as the 8 `.js` files sit together in `egg/`.
- These are plain ES modules (`.js`) — no build step needed beyond Vite.

### How code uses it
```js
// anywhere in the app
import EggCanvas from "@/egg/EggCanvas.jsx";       // after the prompt creates it
// or, for direct layer access:
import { drawRegalia, drawBodyMass, isBodyReplacedBy } from "@/egg";
```

If you don't have the `@/` alias set up, use a relative path instead
(e.g. `import EggCanvas from "../egg/EggCanvas.jsx"`), or add to `vite.config.js`:
```js
resolve: { alias: { "@": "/src" } }
```

### Quick sanity check after placing
```bash
node --input-type=module -e "import('./src/egg/index.js').then(()=>console.log('egg barrel OK')).catch(e=>{console.error(e);process.exit(1)})"
```
(Won't render — `canvas` isn't in Node — but it confirms all imports/paths resolve.)
