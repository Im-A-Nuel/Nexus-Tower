# Nexus Tower Defender - Gameplay Detail

## Controls
- Movement: `WASD`
- Shoot: `Space` or mouse hold
- Dash: `F`
- Toggle range overlay: `R`
- Toggle aggro debug: `A`
- Toggle grid: `G`
- Pause: `Esc`

## Player
- Base HP: 140 (max HP increases by +12 per level up; heals ~45% of new max when leveling).
- Damage bonus: +2 per level up (applied to weapons).
- Collision radius: 20 px.
- Move speed: 220.
- Dash: 0.15s, speed 800, cooldown 1.0s; spawns dash dust and grants fast movement (no invuln coded).
- Level-up reset: restores position, keeps alive; nexus also levels separately.

### Weapons
| Weapon | Damage | Fire Rate (s) | Range | Projectile Speed | Pellets | Spread |
| --- | --- | --- | --- | --- | --- | --- |
| Rifle (default) | 24 | 0.22 | 220 | 560 | 1 | 0 |
| Sniper | 80 | 1.0 | 420 | 620 | 1 | 0 |
| Shotgun | 14 | 0.55 | 160 | 520 | 6 | 0.2 rad per pellet |
| SMG | 10 | 0.11 | 190 | 560 | 1 | 0.04 |
- Damage scales with distance for sniper (factor 0.6–1.6).
- Projectile lifetime clamps to range/speed; spread applied per pellet.

## Nexus (Player Base)
- HP: 200 base; +45 max HP per nexus level-up (heals ~50% of new max).
- Attack: damage 20, range 260, fire rate 1.2s, projectile speed 480.
- Random combat tower sprite each session.

## Enemy Bases
- Size: 80x80; attack range 280; fire rate 1.1s; projectile speed 380.
- Damage: 10 + 1.2*(level-1).
- HP: 220 + 55*(level-1).
- Initial raiders queued: 1 + floor((level-1)/3).
- Raider spawn interval: max(2.5s, 6 - 0.4*(level-1)).
- Raider auto-queue: start timer max(5s, 12 - 0.8*(level-1)), interval max(4s, 10 - 0.7*(level-1)).
- Aggro radius set by difficulty (see below).

## NPC Guards (per base)
- Base stats (before difficulty multipliers):
  - HP: 100 + 16*(level-1)
  - Damage: 8
  - Speed: 96 + min(40, 4*(level-1))
  - Range: 200; fire rate: 0.95s
  - Sense radius (difficulty-based); leash 230; stop distance 150
- States: GUARD → CHASE → RETURN (FSM).
- Raider spawned from base uses CHASE with: sense radius 1200, leash 9999, stop distance 90, target = Nexus.
- Death removal after animation and timer (3s).

## Difficulty Multipliers (applied to NPC HP/Damage & aggro radius)
| Mode | Bases min-max | Guards/base (start) | HP mult | DMG mult | Aggro radius |
| --- | --- | --- | --- | --- | --- |
| Easy | 1-2 | 1 | 0.65 | 0.65 | 150 |
| Normal | 2-3 | 1 | 0.8 | 0.8 | 170 |
| Hard | 2-3 | 2 | 0.95 | 0.95 | 190 |
| Insane | 3-4 | 3 | 1.15 | 1.1 | 210 |
- Guards per base increase by +floor((level-1)/3), capped at 4.
- Bases per level: clamp(difficulty.min + floor((level-1)/2), min, max).

## Projectiles & Collisions
- Player/enemy projectiles are circle-tested; bases use rect tests.
- Projectile hits resolve in order: player shots -> NPC first -> base; enemy shots -> player first -> nexus.
- Particle effects spawn on hits; damage numbers (red) float upward on every hit (player or enemy).

## Range & UI
- Range overlays: player weapon and nexus attack range (toggle `R`).
- Aggro debug (enemy base) toggle: `A`.
- Crosshair always visible.
- Damage text: red, outlined; floats above target.

## Level Flow
- Start at level 1; bases and guards generated per difficulty.
- Win level when all bases destroyed → Level Up screen; stats scale as above.
- Lose when player HP <=0 or Nexus HP <=0.
- Progress persisted (difficulty, weapon, level) via localStorage.
