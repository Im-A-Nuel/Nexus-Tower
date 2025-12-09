# Nexus Tower Defender - Action Plan

## Table of Contents
- [Analisis Konsep Game](#analisis-konsep-game)
- [Pemetaan Aset](#pemetaan-aset)
- [Action Plan Development](#action-plan-development)
- [Prioritas Development](#prioritas-development)
- [Summary & Rekomendasi](#summary--rekomendasi)

---

## ANALISIS KONSEP GAME

**Nexus Tower Defender** adalah top-down arcade shooter dengan elemen:
- Player melindungi Nexus sendiri (base hijau di kiri)
- Menyerang dan menghancurkan enemy bases (merah di kanan)
- NPC guards dengan AI FSM: Guard → Chase → Return
- Kontrol: WASD (gerak), Spasi (tembak), F (dash)
- Win: Hancurkan semua enemy base
- Lose: Player HP = 0 atau Nexus HP = 0

---

## PEMETAAN ASET

### 1. ENVIRONMENT/BACKGROUND
**Folder:** `free-fields-tileset-pixel-art-for-tower-defense`

**Aset Terpilih:**
- `1 Tiles/FieldsTileset.png` atau tiles individual - untuk ground/arena
- `2 Objects/4 Stone/*.png` - dekorasi batu
- `2 Objects/5 Grass/*.png` - rumput dekoratif
- `2 Objects/6 Flower/*.png` - dekorasi bunga

**Alternatif dari Simple Tower Defense:**
- `Environment/Tile Set/spr_tile_set_ground.png`
- `Environment/Grass/spr_grass_01.png, 02, 03`
- `Environment/Decoration/spr_rock_01/02/03.png`
- `Environment/Decoration/spr_tree_*.png`

---

### 2. PLAYER CHARACTER
**Folder:** `free-pixel-art-tiny-hero-sprites`

**Aset Terpilih (pilih salah satu):**
- **Option 1:** `1 Pink_Monster/` - karakter pink monster
- **Option 2:** `2 Owlet_Monster/` - karakter owl
- **Option 3:** `3 Dude_Monster/` - karakter dude

**Animasi yang Akan Digunakan:**
- `*_Idle_4.png` - animasi idle
- `*_Walk_6.png` atau `*_Run_6.png` - animasi bergerak (WASD)
- `*_Attack1_4.png` atau `*_Throw_4.png` - animasi menembak (Spasi)
- `*_Hurt_4.png` - animasi terkena damage
- `*_Death_8.png` - animasi mati
- `Walk_Run_Push_Dust_6.png` - efek debu saat bergerak/dash

---

### 3. PLAYER NEXUS (BASE)
**Folder:** `Simple Tower Defense/Towers/Castle`

**Aset Terpilih:**
- `spr_castle_green.png` - untuk Player Nexus (hijau)
- `spr_castle_blue.png` - alternatif jika ingin variasi warna

---

### 4. ENEMY BASES
**Folder:** `Simple Tower Defense/Towers`

**Aset Terpilih:**
- `Castle/spr_castle_red.png` - enemy base utama
- **Alternatif:** `Non-Combat Towers/spr_normal_tower_*_red.png` - bisa untuk variasi enemy base

---

### 5. ENEMY NPC GUARDS
**Folder:** `Simple Tower Defense/Enemies`

**Aset Terpilih (pilih sesuai difficulty/level):**

**Level Awal:**
- `spr_normal_slime.png` - guard lemah
- `spr_goblin.png` - guard basic

**Level Menengah:**
- `spr_skeleton.png`
- `spr_bat.png` (bisa flying enemy)
- `spr_zombie.png`

**Level Tinggi:**
- `spr_big_slime.png`
- `spr_demon.png`
- `spr_ghost.png`

**Boss/Insane:**
- `spr_king_slime.png`

---

### 6. PROJECTILES (PELURU)
**Folder:** `Simple Tower Defense/Towers/Combat Towers Projectiles`

**Aset Terpilih:**
- **Player bullets:** `spr_tower_archer_projectile.png` atau `spr_tower_crossbow_projectile.png`
- **Enemy bullets:** `spr_tower_poison_wizard_projectile.png` (warna berbeda dari player)
- **Efek khusus:**
  - `spr_tower_ice_wizard_projectile.png` - untuk slow effect (opsional)
  - `spr_tower_lightning_tower_projectile.png` - untuk fast bullet

---

### 7. UI/HUD ELEMENTS
**Folder:** `free-pixel-art-tiny-hero-sprites/Font`

**Aset Terpilih:**
- Font pixel untuk HUD text (Level, HP, Bases Left)

**CATATAN:** Untuk HP bar, aggro radius ring, dan UI elements lain bisa di-render dengan Canvas API.

---

### 8. EFEK VISUAL (OPSIONAL)
**Folder:** `free-pixel-art-tiny-hero-sprites`

**Aset Terpilih:**
- `*/Double_Jump_Dust_5.png` - efek partikel saat dash
- `*/Walk_Run_Push_Dust_6.png` - efek debu saat bergerak

**Folder:** `free-fields-tileset-pixel-art-for-tower-defense/3 Animated Objects`

**Aset Terpilih:**
- `2 Campfire/*.png` - efek animasi untuk Nexus atau base yang hancur
- `1 Flag/*.png` - dekorasi untuk base

---

## ACTION PLAN DEVELOPMENT

### FASE 1: SETUP & STRUKTUR PROJECT

#### 1.1 Struktur Folder & File
Buat struktur folder berikut:

```
/tower-game
  /assets
    /sprites
      /player
      /enemies
      /bases
      /projectiles
      /environment
      /effects
    /fonts
  /js
    - main.js (entry point)
    - game.js (game loop & state management)
    - player.js (player class)
    - npc.js (NPC guard class dengan FSM)
    - base.js (Nexus & Enemy Base class)
    - projectile.js (peluru class)
    - collision.js (collision detection)
    - input.js (keyboard & mouse input)
    - render.js (canvas rendering)
    - level.js (level generation & progression)
    - utils.js (helper functions)
  /css
    - style.css
  index.html
```

#### 1.2 Organize Assets
- Salin aset terpilih ke folder `/assets/sprites/` dengan struktur yang rapi
- Buat atlas/mapping untuk sprite animations
- Optimize ukuran gambar jika diperlukan

---

### FASE 2: CORE RENDERING (HTML5 CANVAS)

#### 2.1 Setup Canvas
- Buat HTML5 Canvas dengan ukuran fixed (misal: 1280x720)
- Setup rendering context 2D
- Implement grid system untuk positioning

#### 2.2 Basic Rendering
- Render background/tileset
- Render dev-look grid (bisa di-toggle on/off)
- Setup camera/viewport (single screen, no scrolling)
- Implement sprite loading system
- Create sprite animation system (frame-based)

#### 2.3 UI/HUD Rendering
- Level counter
- Player HP bar
- Nexus HP bar
- Bases remaining counter
- Mini-map (opsional)

---

### FASE 3: PLAYER MECHANICS

#### 3.1 Player Movement
- WASD movement dengan smooth motion
- Batas arena (collision dengan edge)
- Player sprite rendering dengan orientasi ke mouse cursor
- Animasi: Idle, Walk/Run

#### 3.2 Player Combat
- Spasi untuk tembak ke arah kursor
- Projectile spawning dengan travel time
- Fire rate cooldown
- Animasi: Attack/Shoot
- Visual feedback (muzzle flash, recoil)

#### 3.3 Player Dash
- F key untuk dash (short distance, fast speed)
- Dash cooldown
- Invincibility frames (opsional)
- Visual effect (dust particles)

#### 3.4 Player Health System
- HP tracking
- Damage handling
- Hurt animation
- Death animation & game over state

---

### FASE 4: GAME ENTITIES

#### 4.1 Nexus (Player Base)
- Posisi fixed di kiri-tengah arena
- HP system
- Visual HP bar
- Aggro radius visualization (transparan ring)
- Destruction state

#### 4.2 Enemy Bases
- Procedural placement di kanan arena (1-4 bases)
- HP system per base
- Visual HP bar
- Spawn anchor point untuk NPC guard
- Destruction animation/effect

#### 4.3 Projectile System
- Linear movement dengan velocity
- Lifetime/max distance
- Collision detection dengan entities
- Visual trails (opsional)
- Damage application

---

### FASE 5: AI NPC GUARD (FSM)

#### 5.1 NPC Base Class
- Position, velocity, HP
- Sprite rendering dengan orientation
- Animation system
- Combat system (shooting)

#### 5.2 Finite State Machine
**GUARD State:**
- Berdiri di anchor point
- Idle animation
- Sense radius detection → transition ke CHASE

**CHASE State:**
- Pathfinding menuju player
- Stop at stopDist untuk menembak
- Leash radius check → transition ke RETURN
- Run/Walk animation
- Shooting behavior

**RETURN State:**
- Pathfinding kembali ke anchor
- Check player proximity → bisa kembali CHASE
- Arrival check → transition ke GUARD

#### 5.3 NPC Combat
- Shooting mechanics (aim, fire rate, accuracy)
- Projectile spawning
- Damage to player & Nexus

#### 5.4 Visual Feedback
- Aggro radius ring (transparan, bisa di-toggle)
- State indicator (dev mode)
- Health bar
- Hit/hurt animation

---

### FASE 6: COLLISION & DAMAGE SYSTEM

#### 6.1 Collision Detection
- Circle-circle collision (player, NPC, projectiles)
- Circle-rectangle collision (entities vs bases)
- AABB collision (fallback)

#### 6.2 Damage Priority Logic
```javascript
if (projectile.owner === "player") {
  // Check NPC collision first
  if (hits NPC) {
    NPC.takeDamage();
    projectile.destroy();
  }
  // Then check base collision
  else if (hits EnemyBase) {
    EnemyBase.takeDamage();
    projectile.destroy();
  }
}
else if (projectile.owner === "enemy") {
  // Check player collision
  if (hits Player) {
    Player.takeDamage();
    projectile.destroy();
  }
  // Then check Nexus
  else if (hits Nexus) {
    Nexus.takeDamage();
    projectile.destroy();
  }
}
```

#### 6.3 Hit Effects
- Particle effects saat hit
- Screen shake (subtle)
- Sound effects (opsional)

---

### FASE 7: LEVEL SYSTEM & PROGRESSION

#### 7.1 Level Generation
- Randomize enemy base positions (1-4 bases)
- Ensure minimum distance antar bases
- Spawn NPC guards per base
- Setup difficulty parameters

#### 7.2 Win/Lose Conditions
```javascript
// WIN
if (allEnemyBasesDestroyed && playerHP > 0 && nexusHP > 0) {
  levelUp();
}

// LOSE
if (playerHP <= 0 || nexusHP <= 0) {
  gameOver();
}
```

#### 7.3 Level Up System
- Reset arena dengan layout baru
- Partial HP recovery (player & Nexus)
- Increase max HP capacity
- Increase difficulty:
  - More bases
  - Tougher NPCs (more HP, more damage)
  - Larger aggro radius
  - More NPCs per base (opsional)

#### 7.4 Difficulty Modes
- **Easy:** 1-2 bases, weak NPCs
- **Normal:** 2-3 bases, moderate NPCs
- **Hard:** 3-4 bases, strong NPCs
- **Insane:** 4 bases, very strong NPCs, multiple guards per base

---

### FASE 8: GAME LOOP & STATE MANAGEMENT

#### 8.1 Game States
- MENU (main menu, difficulty selection)
- PLAYING (active gameplay)
- PAUSED
- LEVEL_UP (transition screen)
- GAME_OVER (lose screen)
- VICTORY (win screen)

#### 8.2 Game Loop
```javascript
function gameLoop(deltaTime) {
  // Update
  processInput();
  updatePlayer(deltaTime);
  updateNPCs(deltaTime);
  updateProjectiles(deltaTime);
  checkCollisions();
  checkWinLose();

  // Render
  clearCanvas();
  renderBackground();
  renderBases();
  renderNPCs();
  renderPlayer();
  renderProjectiles();
  renderEffects();
  renderUI();
}
```

#### 8.3 Performance Optimization
- Limit active projectiles
- Object pooling untuk projectiles & particles
- Culling for off-screen entities (minimal karena single screen)
- RequestAnimationFrame dengan deltaTime

---

### FASE 9: VISUAL EFFECTS & POLISH

#### 9.1 Particle System
- Hit sparks
- Explosion effects (base destroyed)
- Dust trails (dash, movement)
- Muzzle flash

#### 9.2 Screen Effects
- Screen shake saat hit/explosion
- Flash effects
- Fade in/out untuk transitions

#### 9.3 Visual Polish
- Smooth camera (meski single screen, bisa ada subtle shake)
- HP bar animations
- Aggro radius pulse effect
- Death animations untuk semua entities

---

### FASE 10: AUDIO (OPSIONAL)

#### 10.1 Sound Effects
- Shoot sound (player & enemy, berbeda)
- Hit/impact sound
- Explosion sound (base destroyed)
- Dash sound
- UI click sounds

#### 10.2 Music
- Background music (loop)
- Tension music saat low HP
- Victory fanfare
- Game over sound

---

### FASE 11: EXTRA FEATURES (OPSIONAL)

#### 11.1 Hand Tracking Integration
- Setup MediaPipe atau TensorFlow.js Hand Tracking
- Gesture mapping:
  - Open palm = Fire
  - Swipe = Dash
  - Hand position = Mouse cursor position

#### 11.2 Power-ups (Future Enhancement)
- Health pack drops
- Damage boost
- Speed boost
- Shield

#### 11.3 Leaderboard
- Track highest level reached
- Best time
- Local storage persistence

---

### FASE 12: TESTING & DEBUGGING

#### 12.1 Functional Testing
- Test semua state transitions (FSM)
- Test win/lose conditions
- Test collision accuracy
- Test level progression

#### 12.2 Balance Testing
- Difficulty curve
- HP values
- Damage values
- Fire rates
- Movement speeds

#### 12.3 Performance Testing
- FPS monitoring
- Memory leaks check
- Stress test (max entities)

#### 12.4 Cross-browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile responsiveness (opsional)

---

### FASE 13: DOCUMENTATION & DEPLOYMENT

#### 13.1 Code Documentation
- JSDoc comments
- README.md dengan instruksi
- Architecture diagram

#### 13.2 Deployment
- Optimize assets (compress images)
- Minify JS/CSS
- Deploy ke hosting (GitHub Pages, Netlify, dll)

---

## PRIORITAS DEVELOPMENT

### CRITICAL PATH (Minimum Viable Product)
1. ✅ Setup Project & Canvas Rendering
2. ✅ Player Movement & Shooting
3. ✅ Enemy Base & Nexus Rendering
4. ✅ NPC Guard dengan FSM Basic (GUARD → CHASE)
5. ✅ Collision & Damage System
6. ✅ Win/Lose Conditions
7. ✅ Level System Basic

### POLISH & ENHANCEMENT
8. ⏳ Complete FSM (tambah RETURN state)
9. ⏳ Visual Effects & Particles
10. ⏳ UI/HUD Polish
11. ⏳ Difficulty Modes
12. ⏳ Audio (opsional)
13. ⏳ Hand Tracking (opsional)

---

## SUMMARY & REKOMENDASI

### ASET YANG PALING COCOK

1. **Environment:** `free-fields-tileset-pixel-art-for-tower-defense` - sempurna untuk background arena
2. **Player:** `free-pixel-art-tiny-hero-sprites` - cocok untuk karakter player dengan animasi lengkap
3. **Bases & Enemies:** `Simple Tower Defense` - sangat sesuai untuk Nexus, enemy bases, NPC guards, dan projectiles

### KOMBINASI RECOMMENDED

**Untuk Visual Consistency:**
- **Player:** Pink Monster atau Owlet Monster dari `free-pixel-art-tiny-hero-sprites`
- **Nexus:** Castle Green dari `Simple Tower Defense`
- **Enemy Bases:** Castle Red dari `Simple Tower Defense`
- **NPC Guards:** Gunakan progression dari Slime → Skeleton → Demon berdasarkan level
- **Background:** Fields Tileset untuk arena yang clean dan readable

### ESTIMASI DEVELOPMENT TIME

Berdasarkan scope MVP (Minimum Viable Product):
- **Solo Developer (part-time):** 2-3 minggu
- **Solo Developer (full-time):** 1 minggu
- **Team 2-3 orang:** 3-5 hari

Dengan polish dan extra features: tambahkan 50-100% dari estimasi di atas.

---

## NEXT STEPS

1. **Organize Assets** - Salin dan atur aset terpilih ke struktur folder yang proper
2. **Generate Boilerplate** - Buat HTML/CSS/JS skeleton
3. **Start Implementation** - Mulai dari Fase 1 (Setup & Rendering)

---

**Created:** 2025-01-27
**Last Updated:** 2025-01-27
**Version:** 1.0
