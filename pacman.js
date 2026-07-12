// ============================================================
// COOKIE LAND — Pac-Man (Cookie Chomper)
// Dots = little cookies. Bonus fruit = Easter eggs.
// Fully playable. Launched from the neural-net "Continue" button.
// ============================================================
(function () {
  'use strict';

  // Verified fully-connected, horizontally-symmetric maze.
  // # wall | . cookie | o power cookie | - ghost-house door | ' ' empty | P pac start
  const MAZE = [
    "#####################",
    "#o.................o#",
    "#.###.#########.###.#",
    "#.###.#########.###.#",
    "#.#################.#",
    "#.######..#..######.#",
    "#.#######.#.#######.#",
    "#.#.#####.#.#####.#.#",
    "#.#.#####.#.#####.#.#",
    "#...###.......###...#",
    "#.#####.##-##.#####.#",
    "#.......#   #.......#",
    "#.###.#.#####.#.###.#",
    "#.###.#.......#.###.#",
    "#.#######.#.#######.#",
    "#.######..#..######.#",
    "#.#################.#",
    "#.#...#..###..#...#.#",
    "#.#.###.#####.###.#.#",
    "#...###..###..###...#",
    "#.#####.#####.#####.#",
    "#o........P........o#",
    "#####################",
  ];

  const ROWS = MAZE.length;      // 23
  const COLS = MAZE[0].length;   // 21
  const TILE = 22;               // px per tile
  const W = COLS * TILE;
  const H = ROWS * TILE;

  // Ghost-house / spawn coordinates (row, col)
  const PAC_START = { r: 21, c: 10 };
  const DOOR = { r: 10, c: 10 };
  const GHOST_SPAWNS = [
    { r: 9, c: 10 },   // Blinky (starts just above the door)
    { r: 11, c: 9 },
    { r: 11, c: 10 },
    { r: 11, c: 11 },
  ];
  const EGG_TILE = { r: 13, c: 10 };   // where the Easter egg bonus appears

  // Ghost AI names are kept for behavior; each is skinned as a Sesame Street character.
  const GHOST_DEFS = [
    { name: 'blinky', char: 'elmo',   color: '#f5352b', scatter: { r: 1, c: COLS - 2 } },
    { name: 'pinky',  char: 'cookie', color: '#3f8ede', scatter: { r: 1, c: 1 } },
    { name: 'inky',   char: 'oscar',  color: '#6fae3d', scatter: { r: ROWS - 2, c: COLS - 2 } },
    { name: 'clyde',  char: 'bigbird', color: '#ffcf1a', scatter: { r: ROWS - 2, c: 1 } },
  ];

  // ---- runtime state ----
  let canvas, ctx, hud;
  let grid;                 // 2D array of chars (mutable: cookies removed as eaten)
  let pac, ghosts;
  let score, lives, pelletsLeft, totalPellets;
  let state;                // 'ready' | 'playing' | 'dying' | 'won' | 'over'
  let frightenedTimer = 0;
  let modeTimer = 0, modePhase = 0; // scatter/chase alternation
  let egg = { active: false, r: EGG_TILE.r, c: EGG_TILE.c, timer: 0, spawnAt: 0 };
  let readyTimer = 0;
  let dyingTimer = 0;
  let animTick = 0;
  let rafId = null;
  let started = false;
  const keys = {};

  const SPEED = 2;              // pac px/frame (divides TILE=22? uses center snapping)
  const GHOST_SPEED = 1.8;
  const FRIGHT_SPEED = 1.2;
  const FRIGHT_FRAMES = 7 * 60; // ~7s at 60fps
  const EGG_SCORE = 300;

  function tileAt(r, c) {
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return '#';
    return grid[r][c];
  }
  function isWall(r, c) { return tileAt(r, c) === '#'; }
  // Door is passable for ghosts only.
  function passable(r, c, isGhost) {
    const t = tileAt(r, c);
    if (t === '#') return false;
    if (t === '-') return !!isGhost;
    return true;
  }

  function centerOf(r, c) { return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; }
  function tileOfPx(x, y) { return { r: Math.floor(y / TILE), c: Math.floor(x / TILE) }; }

  const DIRS = {
    left:  { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up:    { x: 0, y: -1 },
    down:  { x: 0, y: 1 },
    none:  { x: 0, y: 0 },
  };

  function reset(full) {
    // rebuild grid from MAZE
    grid = MAZE.map(row => row.split(''));
    if (full) {
      totalPellets = 0;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (grid[r][c] === '.' || grid[r][c] === 'o') totalPellets++;
      pelletsLeft = totalPellets;
      score = 0;
      lives = 3;
      egg = { active: false, r: EGG_TILE.r, c: EGG_TILE.c, timer: 0, spawnAt: 0 };
    } else {
      // preserve eaten cookies on life-loss: re-remove eaten ones
      // (we track by not restoring — simplest: keep eatenSet)
      restoreEaten();
    }
    placeActors();
    frightenedTimer = 0;
    modeTimer = 0; modePhase = 0;
    readyTimer = 90;
    state = 'ready';
  }

  // Track eaten cookies so respawn after death keeps progress.
  let eaten = new Set();
  function restoreEaten() {
    for (const key of eaten) {
      const [r, c] = key.split(',').map(Number);
      grid[r][c] = ' ';
    }
    // recount
    pelletsLeft = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (grid[r][c] === '.' || grid[r][c] === 'o') pelletsLeft++;
  }

  function placeActors() {
    const p = centerOf(PAC_START.r, PAC_START.c);
    pac = { x: p.x, y: p.y, dir: 'left', next: 'left', mouth: 0 };
    ghosts = GHOST_DEFS.map((def, i) => {
      const s = GHOST_SPAWNS[i];
      const pos = centerOf(s.r, s.c);
      return {
        ...def,
        x: pos.x, y: pos.y,
        dir: i === 0 ? 'left' : 'up',
        mode: 'scatter',      // scatter | chase | frightened | eaten
        home: centerOf(s.r, s.c),
        inHouse: i !== 0,
        releaseAt: i * 90,    // stagger release
        elapsed: 0,
      };
    });
  }

  // ---------- movement helpers ----------
  function atCenter(actor) {
    const cx = (Math.round((actor.x - TILE / 2) / TILE)) * TILE + TILE / 2;
    const cy = (Math.round((actor.y - TILE / 2) / TILE)) * TILE + TILE / 2;
    return Math.abs(actor.x - cx) < 1.5 && Math.abs(actor.y - cy) < 1.5;
  }
  function snapCenter(actor) {
    actor.x = Math.round((actor.x - TILE / 2) / TILE) * TILE + TILE / 2;
    actor.y = Math.round((actor.y - TILE / 2) / TILE) * TILE + TILE / 2;
  }
  function currentTile(actor) { return tileOfPx(actor.x, actor.y); }

  function canGo(actor, dirName, isGhost) {
    const t = currentTile(actor);
    const d = DIRS[dirName];
    return passable(t.r + d.y, t.c + d.x, isGhost);
  }

  // ---------- pac update ----------
  function updatePac() {
    // turning: allow queued direction at tile center
    if (atCenter(pac)) {
      snapCenter(pac);
      if (pac.next !== pac.dir && canGo(pac, pac.next, false)) pac.dir = pac.next;
      if (!canGo(pac, pac.dir, false)) { /* blocked: stop moving */ }
    }
    if (canGo(pac, pac.dir, false) || !atCenter(pac)) {
      const d = DIRS[pac.dir];
      pac.x += d.x * SPEED;
      pac.y += d.y * SPEED;
    }
    // wrap horizontally (side tunnels) — none here, but keep bounds safe
    pac.mouth = (pac.mouth + 0.15) % (Math.PI);

    // eat cookie
    const t = currentTile(pac);
    const ch = grid[t.r][t.c];
    if (ch === '.') {
      grid[t.r][t.c] = ' ';
      eaten.add(t.r + ',' + t.c);
      score += 10; pelletsLeft--;
      maybeSpawnEgg();
    } else if (ch === 'o') {
      grid[t.r][t.c] = ' ';
      eaten.add(t.r + ',' + t.c);
      score += 50; pelletsLeft--;
      frightenedTimer = FRIGHT_FRAMES;
      ghosts.forEach(g => { if (g.mode !== 'eaten') { g.mode = 'frightened'; g.dir = reverse(g.dir); } });
      maybeSpawnEgg();
    }

    // eat egg
    if (egg.active && t.r === egg.r && t.c === egg.c) {
      egg.active = false;
      egg.timer = 0;
      score += EGG_SCORE;
      egg.lastScorePop = 45;
    }

    if (pelletsLeft <= 0) { state = 'won'; }
  }

  function maybeSpawnEgg() {
    const eatenCount = totalPellets - pelletsLeft;
    // spawn at two thresholds, like classic fruit
    if (!egg.active && egg.spawnAt < 1 && eatenCount >= Math.floor(totalPellets * 0.3)) {
      activateEgg(); egg.spawnAt = 1;
    } else if (!egg.active && egg.spawnAt < 2 && eatenCount >= Math.floor(totalPellets * 0.65)) {
      activateEgg(); egg.spawnAt = 2;
    }
  }
  function activateEgg() {
    egg.active = true; egg.r = EGG_TILE.r; egg.c = EGG_TILE.c; egg.timer = 9 * 60;
  }

  function reverse(dir) {
    return dir === 'left' ? 'right' : dir === 'right' ? 'left' : dir === 'up' ? 'down' : dir === 'down' ? 'up' : 'none';
  }

  // ---------- ghost update ----------
  function ghostTarget(g) {
    const pt = currentTile(pac);
    if (g.mode === 'frightened') return null; // random
    if (g.mode === 'eaten') return { r: GHOST_SPAWNS[0].r + 2, c: 10 }; // return into house
    if (g.mode === 'scatter') return g.scatter;
    // chase
    switch (g.name) {
      case 'blinky': return pt;
      case 'pinky': {
        const d = DIRS[pac.dir];
        return { r: pt.r + d.y * 4, c: pt.c + d.x * 4 };
      }
      case 'inky': {
        const d = DIRS[pac.dir];
        const bt = currentTile(ghosts[0]);
        return { r: pt.r + d.y * 2 + (pt.r - bt.r), c: pt.c + d.x * 2 + (pt.c - bt.c) };
      }
      case 'clyde': {
        const dist = Math.hypot(pt.r - currentTile(g).r, pt.c - currentTile(g).c);
        return dist > 6 ? pt : g.scatter;
      }
    }
    return pt;
  }

  function updateGhost(g) {
    g.elapsed++;
    // release from house
    if (g.inHouse) {
      if (g.elapsed >= g.releaseAt) {
        // move up to the door then out
        const t = currentTile(g);
        const doorPos = centerOf(DOOR.r, DOOR.c);
        // steer toward door column then up
        if (Math.abs(g.x - doorPos.x) > 1) g.x += Math.sign(doorPos.x - g.x) * FRIGHT_SPEED;
        else { g.x = doorPos.x; g.y -= GHOST_SPEED; }
        if (g.y <= centerOf(DOOR.r - 1, DOOR.c).y) { g.inHouse = false; snapCenter(g); g.dir = 'left'; }
      }
      return;
    }

    const speed = g.mode === 'frightened' ? FRIGHT_SPEED : (g.mode === 'eaten' ? GHOST_SPEED + 1 : GHOST_SPEED);

    if (atCenter(g)) {
      snapCenter(g);
      // eaten ghost reached house -> revive
      if (g.mode === 'eaten') {
        const t = currentTile(g);
        if (t.r >= DOOR.r && Math.abs(t.c - DOOR.c) <= 1) {
          g.mode = frightenedTimer > 0 ? 'frightened' : phaseMode();
          g.inHouse = false;
        }
      }
      // choose direction
      const options = ['up', 'left', 'down', 'right'].filter(dn => {
        if (dn === reverse(g.dir)) return false;      // no reversing
        return canGo(g, dn, true);
      });
      let choices = options.length ? options : [reverse(g.dir)].filter(dn => canGo(g, dn, true));
      if (!choices.length) choices = ['up', 'left', 'down', 'right'].filter(dn => canGo(g, dn, true));

      if (g.mode === 'frightened') {
        g.dir = choices[Math.floor(Math.random() * choices.length)] || g.dir;
      } else {
        const target = ghostTarget(g);
        let best = choices[0], bestD = Infinity;
        for (const dn of choices) {
          const d = DIRS[dn];
          const t = currentTile(g);
          const nr = t.r + d.y, nc = t.c + d.x;
          const dist = (nr - target.r) ** 2 + (nc - target.c) ** 2;
          if (dist < bestD) { bestD = dist; best = dn; }
        }
        g.dir = best;
      }
    }
    const d = DIRS[g.dir];
    g.x += d.x * speed;
    g.y += d.y * speed;
  }

  function phaseMode() {
    // scatter for first stretch, then chase (repeating)
    return (modePhase % 2 === 0) ? 'scatter' : 'chase';
  }

  // ---------- collisions ----------
  function checkCollisions() {
    for (const g of ghosts) {
      if (g.inHouse) continue;
      const dist = Math.hypot(g.x - pac.x, g.y - pac.y);
      if (dist < TILE * 0.7) {
        if (g.mode === 'frightened') {
          g.mode = 'eaten';
          score += 200;
        } else if (g.mode !== 'eaten') {
          loseLife();
          return;
        }
      }
    }
  }

  function loseLife() {
    lives--;
    state = 'dying';
    dyingTimer = 70;
  }

  // ---------- main loop ----------
  function step() {
    animTick++;
    if (state === 'ready') {
      if (--readyTimer <= 0) state = 'playing';
    } else if (state === 'playing') {
      // mode timing (scatter/chase)
      modeTimer++;
      if (modeTimer > 60 * 7) { modeTimer = 0; modePhase++; }
      const baseMode = phaseMode();

      if (frightenedTimer > 0) {
        frightenedTimer--;
        if (frightenedTimer === 0)
          ghosts.forEach(g => { if (g.mode === 'frightened') g.mode = baseMode; });
      } else {
        ghosts.forEach(g => { if (g.mode === 'scatter' || g.mode === 'chase') g.mode = baseMode; });
      }

      updatePac();
      ghosts.forEach(updateGhost);
      checkCollisions();

      if (egg.active && --egg.timer <= 0) egg.active = false;
      if (egg.lastScorePop > 0) egg.lastScorePop--;
    } else if (state === 'dying') {
      if (--dyingTimer <= 0) {
        if (lives <= 0) { state = 'over'; }
        else { reset(false); }
      }
    }
    draw();
    if (state !== 'over' && state !== 'won') rafId = requestAnimationFrame(step);
    else { draw(); }
  }

  // ---------- rendering ----------
  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    drawMaze();
    drawEgg();
    drawGhosts();
    drawPac();
    drawHUD();
    drawOverlays();
  }

  function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = grid[r][c];
        const cx = c * TILE, cy = r * TILE;
        if (ch === '#') {
          // rounded-ish wall block, classic blue/purple
          ctx.fillStyle = '#2121de';
          roundRect(cx + 2, cy + 2, TILE - 4, TILE - 4, 5);
          ctx.fill();
          ctx.fillStyle = '#3a3aff';
          roundRect(cx + 4, cy + 4, TILE - 8, TILE - 8, 4);
          ctx.fill();
        } else if (ch === '-') {
          ctx.fillStyle = '#ff9ce0';
          ctx.fillRect(cx + 2, cy + TILE / 2 - 2, TILE - 4, 4);
        } else if (ch === '.') {
          drawCookie(cx + TILE / 2, cy + TILE / 2, 3.2);
        } else if (ch === 'o') {
          const pulse = 1 + 0.18 * Math.sin(animTick * 0.15);
          drawCookie(cx + TILE / 2, cy + TILE / 2, 7 * pulse);
        }
      }
    }
  }

  function drawCookie(x, y, rad) {
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = '#d9a066';
    ctx.fill();
    ctx.strokeStyle = '#a86e3c';
    ctx.lineWidth = Math.max(1, rad * 0.18);
    ctx.stroke();
    // chocolate chips
    if (rad > 4) {
      ctx.fillStyle = '#5a3210';
      const chips = [[-0.35, -0.3], [0.35, -0.1], [0, 0.35], [0.25, 0.3]];
      for (const [dx, dy] of chips) {
        ctx.beginPath();
        ctx.arc(x + dx * rad, y + dy * rad, Math.max(0.8, rad * 0.16), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#5a3210';
      ctx.beginPath(); ctx.arc(x - rad * 0.3, y, rad * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + rad * 0.35, y + rad * 0.2, rad * 0.24, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawEgg() {
    if (!egg.active) return;
    const { x, y } = centerOf(egg.r, egg.c);
    ctx.save();
    // egg body
    ctx.beginPath();
    ctx.ellipse(x, y, TILE * 0.32, TILE * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ff5eda';
    ctx.fill();
    // zigzag decoration
    ctx.strokeStyle = '#00e0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      const yy = y + i * 6;
      ctx.moveTo(x - 7, yy - 2);
      ctx.lineTo(x - 2, yy + 2);
      ctx.lineTo(x + 3, yy - 2);
      ctx.lineTo(x + 8, yy + 2);
    }
    ctx.stroke();
    ctx.strokeStyle = '#ffe600';
    ctx.beginPath();
    ctx.ellipse(x, y, TILE * 0.32, TILE * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPac() {
    if (state === 'dying') {
      // shrink/close animation
      const t = 1 - dyingTimer / 70;
      const open = Math.PI * t;
      drawPacShape(pac.x, pac.y, pac.dir, open, Math.max(0.1, 1 - t) );
      return;
    }
    const open = Math.abs(Math.sin(pac.mouth)) * 0.35 * Math.PI + 0.05;
    drawPacShape(pac.x, pac.y, pac.dir, open, 1);
  }

  function drawPacShape(x, y, dir, open, scale) {
    const r = (TILE / 2 - 1) * scale;
    let a0 = open, a1 = Math.PI * 2 - open;
    let rot = 0;
    if (dir === 'right') rot = 0;
    else if (dir === 'down') rot = Math.PI / 2;
    else if (dir === 'left') rot = Math.PI;
    else if (dir === 'up') rot = -Math.PI / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = '#ffe600';
    ctx.fill();
    ctx.restore();
  }

  function drawGhosts() {
    for (const g of ghosts) {
      if (g.mode === 'eaten') { drawEyes(g.x, g.y, g.dir); continue; }
      const frightened = g.mode === 'frightened';
      const color = frightened
        ? ((frightenedTimer < 120 && Math.floor(animTick / 12) % 2 === 0) ? '#fff' : '#2233ff')
        : g.color;
      drawGhostBody(g.x, g.y, color);
      if (frightened) drawScaredFace(g.x, g.y);
      else drawCharacterFace(g.x, g.y, g.char, g.dir);
    }
  }

  // Classic ghost silhouette (dome + wavy skirt), used as each character's "body".
  function drawGhostBody(x, y, color) {
    const r = TILE / 2 - 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, -1, r, Math.PI, 0);
    ctx.lineTo(r, r);
    const feet = 4, step = (2 * r) / feet;
    for (let i = 0; i < feet; i++) {
      const px = r - step * i;
      const py = i % 2 === 0 ? r - 4 : r;
      ctx.lineTo(px - step / 2, py);
      ctx.lineTo(px - step, r);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawScaredFace(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-7, 5); ctx.lineTo(-3, 5); ctx.lineTo(-1, 7);
    ctx.lineTo(2, 5); ctx.lineTo(5, 5); ctx.lineTo(7, 7);
    ctx.stroke();
    ctx.restore();
  }

  // Character-specific faces on top of the ghost body.
  function drawCharacterFace(x, y, char, dir) {
    const d = DIRS[dir] || DIRS.none;
    ctx.save();
    ctx.translate(x, y);

    function eye(ex, ey, rad, pupilR) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, ey, rad, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(ex + d.x * 1.4, ey + d.y * 1.4, pupilR, 0, Math.PI * 2); ctx.fill();
    }

    if (char === 'elmo') {
      // big touching white eyes + orange nose
      eye(-3.2, -3, 3.4, 1.6);
      eye(3.2, -3, 3.4, 1.6);
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath(); ctx.ellipse(0, 2, 2.6, 2, 0, 0, Math.PI * 2); ctx.fill();
    } else if (char === 'cookie') {
      // Cookie Monster: googly wandering eyes on top, wide dark mouth
      const wob = Math.sin(animTick * 0.2) * 1.2;
      eye(-3.5, -5, 3.6, 1.5 + 0); // upper googly eyes poke above dome
      eye(3.5, -5, 3.6, 1.5);
      ctx.fillStyle = '#1a1a2a';
      ctx.beginPath(); ctx.arc(0, 3, 3.4, 0, Math.PI); ctx.fill();
    } else if (char === 'oscar') {
      // Oscar the Grouch: grumpy angled brows + small eyes + frown
      eye(-3, -2, 2.6, 1.3);
      eye(3, -2, 2.6, 1.3);
      ctx.strokeStyle = '#2f4a12'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-6.5, -6); ctx.lineTo(-1, -3.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6.5, -6); ctx.lineTo(1, -3.5); ctx.stroke();
      ctx.strokeStyle = '#123'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 8, 3.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (char === 'bigbird') {
      // Big Bird: white eyes with blue lids + orange beak
      eye(-3.2, -3, 3.2, 1.5);
      eye(3.2, -3, 3.2, 1.5);
      ctx.fillStyle = '#3a6fd6';
      ctx.beginPath(); ctx.arc(-3.2, -4.6, 3.3, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(3.2, -4.6, 3.3, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ff9500';
      ctx.beginPath();
      ctx.moveTo(-3, 2); ctx.lineTo(3, 2); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
    } else {
      eye(-4, -2, 3, 1.6);
      eye(4, -2, 3, 1.6);
    }
    ctx.restore();
  }

  function drawEyes(x, y, dir) {
    const d = DIRS[dir] || DIRS.none;
    ctx.save();
    ctx.translate(x, y);
    for (const ex of [-5, 5]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(ex, -2, 3, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2020ff';
      ctx.beginPath(); ctx.arc(ex + d.x * 1.6, -2 + d.y * 1.8, 1.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawHUD() {
    // handled in DOM hud element
    if (!hud) return;
    hud.innerHTML =
      `Score: <b>${score}</b> &nbsp;|&nbsp; Cookies left: <b>${pelletsLeft}</b> &nbsp;|&nbsp; Lives: <b>${'●'.repeat(Math.max(0, lives))}</b>`;
  }

  function drawOverlays() {
    ctx.textAlign = 'center';
    if (state === 'ready') {
      banner('READY!', '#ffe600');
      ctx.fillStyle = '#fff';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText('Arrow keys or WASD to move', W / 2, H / 2 + 26);
    } else if (state === 'won') {
      dim();
      banner('COOKIE LAND CLEARED!', '#7CFC00');
      ctx.fillStyle = '#fff';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('Final score: ' + score, W / 2, H / 2 + 24);
      ctx.fillText('Press R to play again', W / 2, H / 2 + 44);
    } else if (state === 'over') {
      dim();
      banner('GAME OVER', '#ff4d4d');
      ctx.fillStyle = '#fff';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 24);
      ctx.fillText('Press R to try again', W / 2, H / 2 + 44);
    }
    ctx.textAlign = 'start';
  }
  function dim() { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); }
  function banner(text, color) {
    ctx.fillStyle = color;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(text, W / 2, H / 2);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- input ----------
  function onKey(e) {
    if (!started) return;              // ignore keys until the player hits Start
    if (!isPacTabActive()) return;     // only steer while on the Cookie Chomper tab
    const k = e.key.toLowerCase();
    let dir = null;
    // Arrow keys and WASD are identical.
    if (k === 'arrowleft' || k === 'a') dir = 'left';
    else if (k === 'arrowright' || k === 'd') dir = 'right';
    else if (k === 'arrowup' || k === 'w') dir = 'up';
    else if (k === 'arrowdown' || k === 's') dir = 'down';
    else if (k === 'r') { if (state === 'won' || state === 'over') { eaten = new Set(); reset(true); } e.preventDefault(); return; }
    if (dir && pac) {
      pac.next = dir;
      e.preventDefault();   // stop the page/tabs from reacting to the arrow keys
    }
  }

  function isPacTabActive() {
    const sec = document.getElementById('pacman');
    return !!(sec && sec.classList.contains('active'));
  }
  function refreshActiveFlag() {
    window.__pacmanActive = started && isPacTabActive();
  }

  // ---------- start / setup ----------
  function startGame() {
    const intro = document.getElementById('pacman-intro');
    const gamePanel = document.getElementById('pacman-game');
    canvas = document.getElementById('pacman-canvas');
    hud = document.getElementById('pacman-hud');
    if (!canvas || !gamePanel) return;
    if (intro) intro.style.display = 'none';
    gamePanel.style.display = 'block';
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');

    eaten = new Set();
    reset(true);

    if (!started) {
      started = true;
      window.addEventListener('keydown', onKey);
      rafId = requestAnimationFrame(step);
    }
    refreshActiveFlag();
    canvas.focus();
  }

  function wire() {
    const startBtn = document.getElementById('pacman-start');
    if (startBtn) startBtn.addEventListener('click', startGame);
    const restart = document.getElementById('pacman-restart');
    if (restart) restart.addEventListener('click', () => { eaten = new Set(); reset(true); refreshActiveFlag(); });
    // Keep the "arrow keys steer the game" flag in sync with tab changes.
    document.querySelectorAll('.nav-link').forEach(l =>
      l.addEventListener('click', () => setTimeout(refreshActiveFlag, 0)));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  // Kept for backwards-compat; navigation now happens via the tab.
  window.startPacman = startGame;
})();
