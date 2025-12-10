# Nexus Tower Defender - Detail Gameplay

## Kontrol
- Gerak: `WASD`
- Tembak: `Spasi` atau tahan klik kiri
- Dash: `F`
- Toggle overlay jarak tembak: `R`
- Toggle aggro debug: `A`
- Toggle grid: `G`
- Pause: `Esc`

## Player
- HP dasar: 140 (max HP naik +12 tiap level up; heal ~45% dari max baru saat naik level).
+- Bonus damage: +2 tiap level up (teraplikasi ke semua senjata).
- Radius tabrakan: 20 px.
- Kecepatan gerak: 220.
- Dash: durasi 0.15s, kecepatan 800, cooldown 1.0s; memunculkan debu dash (tanpa invuln).
- Reset level-up: posisi di-reset, tetap hidup; Nexus level-up terpisah.

### Senjata
| Senjata | Damage | Fire Rate (detik) | Range | Kecepatan Peluru | Pellets | Spread |
| --- | --- | --- | --- | --- | --- | --- |
| Rifle (default) | 24 | 0.22 | 220 | 560 | 1 | 0 |
| Sniper | 80 | 1.0 | 420 | 620 | 1 | 0 |
| Shotgun | 14 | 0.55 | 160 | 520 | 6 | 0.2 rad/pellet |
| SMG | 10 | 0.11 | 190 | 560 | 1 | 0.04 |
- Damage sniper skala jarak (faktor 0.6–1.6).
- Lifetime peluru disesuaikan range/speed; spread diterapkan per pellet.

## Nexus (Base Pemain)
- HP: 200 dasar; +45 max HP tiap nexus level-up (heal ~50% dari max baru).
- Serangan: damage 20, range 260, fire rate 1.2s, kecepatan peluru 480.
- Sprite tower tempur dipilih acak tiap sesi.

## Base Musuh
- Ukuran: 80x80; range serang 280; fire rate 1.1s; kecepatan peluru 380.
- Damage: 10 + 1.2*(level-1).
- HP: 220 + 55*(level-1).
- Raider awal: 1 + floor((level-1)/3).
- Interval spawn raider: max(2.5s, 6 - 0.4*(level-1)).
- Auto-queue raider: timer awal max(5s, 12 - 0.8*(level-1)), interval max(4s, 10 - 0.7*(level-1)).
- Aggro radius mengikuti mode difficulty.

## NPC Guard (per base)
- Stat dasar (sebelum multiplier difficulty):
  - HP: 100 + 16*(level-1)
  - Damage: 8
  - Kecepatan: 96 + min(40, 4*(level-1))
  - Range: 200; fire rate: 0.95s
  - Sense radius: dari difficulty; leash 230; stop distance 150
- FSM: GUARD → CHASE → RETURN.
- Raider hasil spawn base: CHASE ke Nexus (sense 1200, leash 9999, stop 90).
- Penghapusan setelah animasi mati + timer (3s).

## Difficulty Multiplier (NPC HP/Damage & aggro)
| Mode | Base min-maks | Guard/base (awal) | HP mult | DMG mult | Aggro radius |
| --- | --- | --- | --- | --- | --- |
| Easy | 1-2 | 1 | 0.65 | 0.65 | 150 |
| Normal | 2-3 | 1 | 0.8 | 0.8 | 170 |
| Hard | 2-3 | 2 | 0.95 | 0.95 | 190 |
| Insane | 3-4 | 3 | 1.15 | 1.1 | 210 |
- Guard per base bertambah +floor((level-1)/3), max 4.
- Jumlah base per level: clamp(difficulty.min + floor((level-1)/2), min, max).

## Proyektil & Tabrakan
- Peluru diuji lingkaran; base diuji kotak.
- Urutan hit: peluru pemain -> NPC dulu -> base; peluru musuh -> player dulu -> Nexus.
- Efek partikel pada hit; angka damage merah mengapung pada setiap hit.

## Range & UI
- Overlay jarak: senjata player dan serangan Nexus (toggle `R`).
- Aggro debug base musuh: toggle `A`.
- Crosshair selalu tampil.
- Tulisan damage: merah, ada outline, muncul di atas target.

## Alur Level
- Mulai level 1; base dan guard digenerate sesuai difficulty.
- Menang level: semua base hancur → layar Level Up; stat scale seperti di atas.
- Kalah: HP player <=0 atau Nexus <=0.
- Progress (difficulty, senjata, level) disimpan via localStorage.
