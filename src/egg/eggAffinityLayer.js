/**
 * KidQuest — Egg Affinity Layer  [SPEC GAME-A §A.2 Evolution x Education]
 * --------------------------------------------------------------------------
 * Purely additive, purely visual. Reflects which SUBJECT (thai/math/eng, or
 * balanced) the child has mastered the most curriculum nodes in — a completely
 * separate axis from the companion's fixed ELEMENT (fire/water/thunder/nature/
 * shadow/light, see eggStageLayer.js/eggAuraLayer.js), which this never
 * replaces or recolors.
 *
 * Two passes, same `pass: 'tint'|'motif'` convention as eggRegaliaLayer.js's
 * 'behind'/'front':
 *   'tint'  — a faint color wash over the already-painted body region (draw
 *             right after the body, step 5, BEFORE regalia-front/eyes so it
 *             never recolors a face or hat).
 *   'motif' — a small pixel badge pinned near the crown (draw LAST, after
 *             cosmetics, so it always reads as a pinned accessory).
 *
 * Not wired into eggAlgorithm.js in any way — this only ever reads a `line`
 * key computed by eggEvolution.js's computeAffinity()/AFFINITY_LINES.
 */

export const AFFINITY_LINES_ALL = ["sage", "architect", "explorer", "prism"];

// Tint/motif base color per affinity line. 'prism' (balanced) cycles hue
// instead of using a fixed color, same rainbow-shimmer idea as the aura
// layer's legendary level.
export const AFFINITY_COLOR = {
  sage: "#c9a227",       // thai -> warm gold-tan (sage/scholar)
  architect: "#4fc3d9",  // math -> cyan-blue (blueprint/structure)
  explorer: "#a374e0",   // eng -> violet (wanderlust)
};

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

function lineColor(line, t) {
  if (line === "prism") {
    const hue = (t * 50) % 360;
    return `hsl(${hue},80%,62%)`;
  }
  return AFFINITY_COLOR[line] || AFFINITY_COLOR.sage;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o
 *   o.line          'sage'|'architect'|'explorer'|'prism' (or falsy to skip)
 *   o.pass          'tint' | 'motif'
 *   o.px            current pixel scale
 *   o.ox,o.oy       body top-left offset (same convention as every other layer)
 *   o.eggW,o.eggH   body bounding box size
 *   o.t             animation clock (seconds)
 */
export function drawAffinityLayer(ctx, o) {
  const { line, pass, px, ox, oy, eggW, eggH, t = 0 } = o;
  if (!line) return;

  if (pass === "tint") {
    // Faint wash restricted to pixels already painted (the body) via
    // source-atop — never touches eyes/expression/cosmetics, which are
    // drawn afterward.
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = line === "prism" ? 0.14 : 0.16;
    ctx.fillStyle = lineColor(line, t);
    ctx.fillRect(ox, oy, eggW, eggH);
    ctx.restore();
    return;
  }

  if (pass === "motif") {
    // Small pixel badge pinned at the upper-right of the head, well clear of
    // the face/eyes (which sit around faceX ± a few px, well left of here).
    const bx = ox + eggW * 0.86;
    const by = oy + eggH * 0.06;
    const u = Math.max(1, px * 0.55); // badge pixel unit — smaller than the body's own px so it reads as a small pin, not a second head
    const col = lineColor(line, t);

    ctx.save();
    // Badge backing disc so the motif reads clearly against any body color.
    ctx.fillStyle = "rgba(20,14,8,0.55)";
    ctx.beginPath();
    ctx.arc(bx + u * 2, by + u * 2, u * 3.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col;
    if (line === "sage") {
      // Simple leaf: two triangles of pixels forming a leaf silhouette.
      ctx.fillRect(bx + u * 1.5, by, u, u * 4);
      ctx.fillRect(bx + u * 0.5, by + u, u, u * 2);
      ctx.fillRect(bx + u * 2.5, by + u, u, u * 2);
    } else if (line === "architect") {
      // Compass/gear notch: a ring of four pixel blocks around the center.
      ctx.fillRect(bx + u * 1.5, by, u, u);
      ctx.fillRect(bx + u * 1.5, by + u * 3, u, u);
      ctx.fillRect(bx, by + u * 1.5, u, u);
      ctx.fillRect(bx + u * 3, by + u * 1.5, u, u);
      ctx.fillRect(bx + u * 1.5, by + u * 1.5, u, u);
    } else if (line === "explorer") {
      // Compass needle: a vertical diamond.
      ctx.fillRect(bx + u * 1.5, by, u, u * 1.5);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(bx + u * 1.5, by + u * 1.5, u, u * 1.5);
      ctx.fillStyle = col;
      ctx.fillRect(bx + u * 1.5, by + u * 3, u, u);
    } else {
      // prism (balanced): four small rainbow pixels around the badge center.
      const hues = [0, 90, 180, 270];
      const offs = [[1.5, 0], [3, 1.5], [1.5, 3], [0, 1.5]];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `hsl(${(hues[i] + t * 60) % 360},85%,65%)`;
        ctx.fillRect(bx + u * offs[i][0], by + u * offs[i][1], u, u);
      }
    }
    ctx.restore();
    return;
  }
}

export const EGG_AFFINITY_LAYER = { COLOR: AFFINITY_COLOR, draw: drawAffinityLayer };
