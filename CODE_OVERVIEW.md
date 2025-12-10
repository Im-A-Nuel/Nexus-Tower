# Nexus Tower Defender

## Arsitektur Utama
- `src/js/main.js`: entry point, inisialisasi `Game` dengan canvas.
- `src/js/game.js`: inti loop game (update/render), state machine game (LOADING, MENU, PLAYING, PAUSED, LEVEL_UP, GAME_OVER), manajemen level, spawn NPC/base, HUD, input, penyimpanan progress, dan koordinasi render/collision.
- `src/js/render.js`: semua gambar canvas (background, grid, player, nexus, base musuh, NPC, proyektil, partikel, teks damage, crosshair, overlay range).
- `src/js/input.js`: baca keyboard/mouse (WASD, spasi, F, A, G, R, Esc, klik), simpan state dan event key-pressed.
- `src/js/collision.js`: deteksi tabrakan peluru dengan NPC/base/player/nexus, panggil `takeDamage`, spawn partikel, dan spawn teks damage.
- `src/js/player.js`: kelas Player (stat, senjata, movement, dash, animasi idle/walk, facing ke mouse, cooldown tembak).
- `src/js/base.js`: kelas `Nexus` (base pemain) dan `EnemyBase` (base musuh) termasuk stats, spawn raider, turret attack.
- `src/js/npc.js`: kelas NPC guard/raider dengan FSM GUARD → CHASE → RETURN, animasi, menembak, dan death handling.
- `src/js/level.js`: generator level (jumlah base, posisi base, jumlah guard/raider) berbasis level & difficulty.
- `src/js/projectile.js`, `src/js/utils.js`, `src/js/sprite-animator.js`, `src/js/assets.js`: utilitas peluru, helper matematika/UI, animasi sprite sheet, dan loader aset.

## Alur Game & State
- `Game.startAssetLoading()` → setelah aset selesai, state pindah ke MENU.
- Menu/karakter/controls dikendalikan tombol UI via `setupEventListeners()` (game.js).
- Start game: `startGame()` set difficulty, inisialisasi entitas, load level, state → PLAYING.
- Loop: `loop()` panggil `update(dt)` lalu `render()` selama `running`.
- Level selesai: semua base musuh hancur → state LEVEL_UP, simpan progress.
- Kalah: HP player 0 atau Nexus 0 → state GAME_OVER.

## Input & Tembakan ke Mouse
- `InputManager.getMousePosition()` memberi koordinat mouse relatif canvas.
- Di `game.update(dt)`: jika `input.isShootPressed()` & `player.canShoot()` → hitung sudut ke mouse, clamp jarak ke `player.range`, lalu buat `Projectile` dengan target koordinat mouse. Spread/pellet mengikuti senjata (rifle/sniper/shotgun/smg).
- Dash: `F` memicu `player.dash(mouseX, mouseY)` ke arah mouse.

## FSM Musuh (NPC)
- Lokasi: `src/js/npc.js`.
- State GUARD: diam di anchor, cek player dalam sense radius → CHASE.
- State CHASE: bergerak ke target (player), berhenti di stop distance, keluar ke RETURN jika terlalu jauh (leash) atau player kabur.
- State RETURN: balik ke anchor; jika dekat player lagi → CHASE; jika sampai anchor → GUARD.
- Raider yang dispawn base langsung CHASE Nexus (sense 1200, leash besar).
- Penembakan NPC: di `game.update`, NPC yang `canShoot()` membuat proyektil ke target (player/Nexus).

## Base Musuh & Nexus
- `EnemyBase`: HP skala level, turret (damage, range, fire rate), spawn raider antrean + auto-queue, aggro radius berdasar difficulty.
- `Nexus`: base pemain, turret otomatis (damage 20, range 260, fire rate 1.2s), level-up menambah max HP.
- Tabrakan peluru ke base/Nexus ditangani di `collision.js`.

## Damage & Efek
- `collision.js` panggil `takeDamage` pada entitas yang kena; spawn partikel warna; panggil `spawnDamage` untuk teks damage.
- `Game.spawnDamageText` menaruh teks (merah) dengan lifetime dan velocity ke atas.
- `Renderer.drawDamageTexts` menggambar angka damage dengan outline hitam, posisi di atas target.
- Range overlay: di `render.drawPlayer` & `drawNexus`, toggle dengan `R`; aggro debug toggle `A`.

## HUD & UI
- HUD elemen diambil via `getElement` (utils) dan di-update di `game.updateHUD()`.
- Minimap/position indicator di `updatePositionIndicator()` (player, NPC, base dots).
- Crosshair selalu tampil di `render.drawCrosshair`.

## Level & Difficulty
- `LevelGenerator` menentukan jumlah base dan guard berdasarkan level & difficulty (easy/normal/hard/insane).
- Guard per base bertambah setiap 3 level; base count naik tiap ~2 level, dibatasi min/max difficulty.
- Difficulty juga memberi multiplier HP/damage NPC dan aggro radius.

## Aset & Animasi
- `AssetLoader` memuat sprite (player 3 karakter, soldier musuh, base, proyektil, environment) dan menyalurkan ke `Renderer`.
- `SpriteAnimator` membaca sprite sheet frame-based; `SPRITE_CONFIGS` memetakan ukuran/frame.
- Player anim pakai idle/walk (attack dinonaktifkan sesuai permintaan terakhir); dash debu pakai sheet dust.
- Musuh memakai set Soldier_1 (Idle/Walk/Run/Shot_2/Hurt/Dead).

## Posisi Tombol & Fitur Debug
- Range overlay toggle: `R`.
- Aggro toggle: `A`.
- Grid toggle: `G`.
- Semua senjata: crosshair aktif.

## Persistence
- localStorage: simpan level terakhir, difficulty, senjata, dan highest level per difficulty (`nexus-progress`, `nexus-highest`).

## File Penting untuk Presentasi Demo
- Game loop & input tembak: `src/js/game.js` (fungsi `update`, bagian shooting ke mouse).
- FSM NPC: `src/js/npc.js`.
- Collision & damage text: `src/js/collision.js`.
- Render UI (range, crosshair, damage text, HUD): `src/js/render.js`.
- Loader aset: `src/js/assets.js`.
