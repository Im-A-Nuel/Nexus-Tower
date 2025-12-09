/**
 * game.js - Game Class
 * Main game loop and state management
 */

import { Player } from './player.js';
import { Nexus } from './base.js';
import { Projectile } from './projectile.js';
import { LevelGenerator } from './level.js';
import { CollisionHandler } from './collision.js';
import { Renderer } from './render.js';
import { InputManager } from './input.js';
import { AssetLoader } from './assets.js';
import { NPC, STATES } from './npc.js';
import { GAME_STATES, getElement, showElement, distance } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;

        // Managers
        this.renderer = new Renderer(canvas);
        this.input = new InputManager(canvas);
        this.collision = new CollisionHandler();
        this.levelGenerator = new LevelGenerator(this.width, this.height);
        this.assetLoader = new AssetLoader();

        // Game state
        this.state = GAME_STATES.LOADING;
        this.level = 1;
        this.difficulty = 'normal';
        this.weaponChoice = 'rifle';
        this.savedProgress = null;
        this.highestLevels = {};

        // Entities
        this.player = null;
        this.nexus = null;
        this.bases = [];
        this.npcs = [];
        this.projectiles = [];
        this.particles = [];

        // DOM elements (screens)
        this.screens = {
            loading: getElement('loading-screen'),
            menu: getElement('menu-screen'),
            controls: getElement('controls-screen'),
            game: getElement('game-screen'),
            pause: getElement('pause-screen'),
            levelup: getElement('levelup-screen'),
            gameover: getElement('gameover-screen')
        };

        // Loading screen elements
        this.loadingElements = {
            barFill: getElement('loading-bar-fill'),
            percent: getElement('loading-percent')
        };

        // HUD elements
        this.hudElements = {
            level: getElement('hud-level'),
            bases: getElement('hud-bases'),
            playerHealthFill: getElement('player-health-fill'),
            playerHealthText: getElement('player-health-text'),
            nexusHealthFill: getElement('nexus-health-fill'),
            nexusHealthText: getElement('nexus-health-text')
        };

        // Game loop
        this.lastTime = 0;
        this.fps = 60;
        this.running = false;

        // Setup
        this.setupEventListeners();
        this.setupParticleCallback();
        this.loadPersistedData();
        this.startAssetLoading();
    }

    // ===== Setup =====

    setupEventListeners() {
        // Menu buttons
        getElement('btn-start').addEventListener('click', () => this.startGame());
        getElement('btn-controls').addEventListener('click', () => this.showControls());
        getElement('btn-back-controls').addEventListener('click', () => this.showMenu());

        // Difficulty selector
        getElement('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        // Weapon selector
        const weaponSelect = getElement('weapon');
        if (weaponSelect) {
            weaponSelect.addEventListener('change', (e) => {
                this.weaponChoice = e.target.value;
            });
        }

        // Pause buttons
        getElement('btn-resume').addEventListener('click', () => this.resumeGame());
        getElement('btn-restart').addEventListener('click', () => this.restartLevel());
        getElement('btn-main-menu').addEventListener('click', () => this.backToMenu());

        // Level up button
        getElement('btn-continue').addEventListener('click', () => this.nextLevel());

        // Game over buttons
        getElement('btn-retry').addEventListener('click', () => this.retryGame());
        getElement('btn-gameover-menu').addEventListener('click', () => this.backToMenu());
    }

    setupParticleCallback() {
        this.collision.onParticleSpawn((x, y, color, count) => {
            this.spawnParticles(x, y, color, count);
        });
    }

    async startAssetLoading() {
        // Setup progress callback
        this.assetLoader.onProgress((loaded, total) => {
            const percent = Math.round((loaded / total) * 100);
            if (this.loadingElements.barFill) {
                this.loadingElements.barFill.style.width = percent + '%';
            }
            if (this.loadingElements.percent) {
                this.loadingElements.percent.textContent = percent + '%';
            }
        });

        // Setup complete callback
        this.assetLoader.onComplete((assets) => {
            console.log('✅ All assets loaded!', assets);
            // Pass assets to renderer
            this.renderer.setAssets(assets);
            // Transition to menu
            this.setState(GAME_STATES.MENU);
        });

        try {
            console.log('📦 Loading assets...');
            await this.assetLoader.loadAll();
        } catch (error) {
            console.error('❌ Failed to load assets:', error);
            // Still allow game to run with fallback graphics
            this.setState(GAME_STATES.MENU);
        }
    }

    // ===== Game State Management =====

    startGame() {
        this.levelGenerator.setDifficulty(this.difficulty);
        // Resume saved progress if available
        if (this.savedProgress) {
            this.difficulty = this.savedProgress.difficulty || this.difficulty;
            this.levelGenerator.setDifficulty(this.difficulty);
            this.level = this.savedProgress.level || 1;
        } else {
            this.level = 1;
        }
        this.initializeEntities();
        this.loadLevel(this.level);
        this.setState(GAME_STATES.PLAYING);
        this.start();
        this.saveProgress();
        this.renderProgressInfo();
    }

    initializeEntities() {
        // Create player
        this.player = new Player(160, this.height / 2);
        this.player.applyWeaponStats(this.weaponChoice || 'rifle');

        // Create nexus
        this.nexus = new Nexus(100, this.height / 2);

        // Clear entities
        this.bases = [];
        this.npcs = [];
        this.projectiles = [];
        this.particles = [];
    }

    loadLevel(level) {
        this.level = level;

        // Generate level
        const levelData = this.levelGenerator.generateLevel(level);
        this.bases = levelData.bases;
        this.npcs = levelData.npcs;

        // Reset projectiles and particles
        this.projectiles = [];
        this.particles = [];

        // Reset player position
        this.player.x = 160;
        this.player.y = this.height / 2;
        this.player.hp = this.player.maxHp;
        this.player.alive = true;

        // Update HUD
        this.updateHUD();
    }

    nextLevel() {
        // Level up entities
        this.player.levelUp();
        this.nexus.levelUp();

        // Load next level
        this.level++;
        this.loadLevel(this.level);
        this.setState(GAME_STATES.PLAYING);
        this.saveProgress();
        this.updateHighestLevel();
    }

    restartLevel() {
        this.loadLevel(this.level);
        // Reset player HP and cooldowns
        this.player.reset(160, this.height / 2);
        // Reset nexus HP
        this.nexus.hp = this.nexus.maxHp;
        this.setState(GAME_STATES.PLAYING);
        this.saveProgress();
    }

    retryGame() {
        this.startGame();
    }

    backToMenu() {
        this.setState(GAME_STATES.MENU);
        this.stop();
        this.saveProgress();
    }

    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            this.setState(GAME_STATES.PAUSED);
        }
    }

    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            this.setState(GAME_STATES.PLAYING);
        }
    }

    showMenu() {
        this.setState(GAME_STATES.MENU);
    }

    showControls() {
        this.hideAllScreens();
        showElement(this.screens.controls, true);
    }

    setState(newState) {
        this.state = newState;

        // Hide all screens
        this.hideAllScreens();

        // Show appropriate screen
        switch (newState) {
            case GAME_STATES.LOADING:
                showElement(this.screens.loading, true);
                break;
            case GAME_STATES.MENU:
                showElement(this.screens.menu, true);
                break;
            case GAME_STATES.PLAYING:
                showElement(this.screens.game, true);
                break;
            case GAME_STATES.PAUSED:
                showElement(this.screens.game, true);
                showElement(this.screens.pause, true);
                break;
            case GAME_STATES.LEVEL_UP:
                showElement(this.screens.game, true);
                showElement(this.screens.levelup, true);
                getElement('completed-level').textContent = this.level;
                break;
            case GAME_STATES.GAME_OVER:
                showElement(this.screens.game, true);
                showElement(this.screens.gameover, true);
                getElement('final-level').textContent = this.level;
                break;
        }
    }

    hideAllScreens() {
        for (const screen of Object.values(this.screens)) {
            showElement(screen, false);
        }
    }

    // ===== Game Loop =====

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
    }

    loop(currentTime) {
        if (!this.running) return;

        // Calculate delta time
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.fps = 1 / dt;

        // Update and render based on state
        if (this.state === GAME_STATES.PLAYING) {
            this.update(dt);
        }

        this.render();

        // Continue loop
        requestAnimationFrame((t) => this.loop(t));
    }

    // ===== Update =====

    update(dt) {
        // Check for pause
        if (this.input.isKeyPressed('escape')) {
            this.pauseGame();
            return;
        }

        // Check for grid toggle
        if (this.input.isKeyPressed('g')) {
            this.renderer.toggleGrid();
        }

        // Check for aggro radius toggle
        if (this.input.isKeyPressed('a')) {
            this.renderer.toggleAggroRadius();
        }

        // Update player
        this.player.update(dt, this.input, this.canvas);

        // Handle player dash
        if (this.input.isKeyPressed('f')) {
            const mouse = this.input.getMousePosition();
            this.player.dash(mouse.x, mouse.y);
        }

        // Handle player shooting
        const mouse = this.input.getMousePosition();
        if (this.input.isShootPressed() && this.player.canShoot()) {
            if (this.player.shoot()) {
                const speed = this.player.projectileSpeed || 560;
                const pelletCount = this.player.pellets || 1;
                const spread = this.player.spread || 0;
                const baseAngle = Math.atan2(mouse.y - this.player.y, mouse.x - this.player.x);
                const mouseDistance = distance(this.player.x, this.player.y, mouse.x, mouse.y);
                const clampedDistance = Math.min(mouseDistance, this.player.range);
                const lifetime = Math.max(this.player.range / speed, 0.1);

                for (let i = 0; i < pelletCount; i++) {
                    const offset = spread === 0 ? 0 : (i - (pelletCount - 1) / 2) * spread;
                    const angle = baseAngle + offset;
                    const targetX = this.player.x + Math.cos(angle) * this.player.range;
                    const targetY = this.player.y + Math.sin(angle) * this.player.range;
                    const distanceFactor = this.player.weaponType === 'sniper'
                        ? 0.6 + Math.min(1, Math.max(0, clampedDistance / this.player.range)) * (1.6 - 0.6)
                        : 1;

                    this.projectiles.push(
                        new Projectile(
                            this.player.x,
                            this.player.y,
                            targetX,
                            targetY,
                            Math.round(this.player.damage * distanceFactor),
                            'player',
                            speed,
                            lifetime
                        )
                    );
                }
            }
        }

        // Update nexus
        this.nexus.update(dt);
        this.handleNexusTurret(dt);

        // Update enemy bases
        for (const base of this.bases) {
            const spawnReady = base.update(dt);

            // Trigger raider spawn once player enters aggro
            const distToPlayer = distance(base.x, base.y, this.player.x, this.player.y);
            if (!base.raiderAggroActive && distToPlayer <= base.aggroRadius) {
                base.raiderAggroActive = true;
                base.raiderAutoTimer = 1.5;
                base.queueRaiders(1);
            }

            if (spawnReady) {
                this.spawnRaider(base);
            }

            const target = this.getBaseTarget(base);
            if (target && base.canShootAt(target.x, target.y)) {
                base.resetFireCooldown();
                const speed = base.projectileSpeed || 440;
                const attackRange = base.attackRange || base.aggroRadius || 0;
                const lifetime = Math.max(attackRange / speed, 0.1);
                this.projectiles.push(
                    new Projectile(
                        base.x,
                        base.y,
                        target.x,
                        target.y,
                        base.damage,
                        base.team,
                        speed,
                        lifetime
                    )
                );
            }
        }

        // Update NPCs
        for (let i = this.npcs.length - 1; i >= 0; i--) {
            const npc = this.npcs[i];
            npc.update(dt, this.player, this.nexus);

            // SMG drawback: taking damage if enemies are too close
            if (this.player.weaponType === 'smg') {
                const closeRange = 40;
                const closeDps = 8; // damage per second when too close
                if (distance(npc.x, npc.y, this.player.x, this.player.y) <= closeRange) {
                    this.player.takeDamage(closeDps * dt);
                }
            }

            // NPC shooting
            if (npc.canShoot()) {
                const target = npc.getShootTarget();
                if (target && npc.shoot()) {
                    const npcProjectileSpeed = 420;
                    const lifetime = Math.max(npc.range / npcProjectileSpeed, 0.1);
                    this.projectiles.push(
                        new Projectile(
                            npc.x,
                            npc.y,
                            target.x,
                            target.y,
                            npc.damage,
                            npc.team,
                            npcProjectileSpeed,
                            lifetime
                        )
                    );
                }
            }

            // Remove dead NPCs
            if (!npc.alive) {
                this.npcs.splice(i, 1);
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, this.width, this.height);

            if (!proj.alive) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Check collisions
        this.collision.checkAllCollisions(
            this.player,
            this.nexus,
            this.bases,
            this.npcs,
            this.projectiles
        );

        // Check win/lose conditions
        this.checkWinLose();

        // Update HUD
        this.updateHUD();

        // Update input (for next frame)
        this.input.update();
    }

    // ===== Render =====

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawGrid();

        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
            // Draw nexus
            this.renderer.drawNexus(this.nexus);

            // Draw enemy bases
            for (const base of this.bases) {
                this.renderer.drawEnemyBase(base);
            }

            // Draw NPCs
            for (const npc of this.npcs) {
                this.renderer.drawNPC(npc);
            }

            // Draw projectiles
            for (const proj of this.projectiles) {
                this.renderer.drawProjectile(proj);
            }

            // Draw particles
            for (const particle of this.particles) {
                this.renderer.drawParticle(particle);
            }

            // Draw player
            const mouse = this.input.getMousePosition();
            this.renderer.drawPlayer(this.player, mouse.x, mouse.y);
            this.renderer.drawCrosshair(mouse.x, mouse.y, this.player);
        }
    }

    // ===== Helpers =====

    checkWinLose() {
        // Check lose conditions
        if (!this.player.alive) {
            getElement('death-reason').textContent = 'You were defeated!';
            this.setState(GAME_STATES.GAME_OVER);
            return;
        }

        if (this.nexus.destroyed) {
            getElement('death-reason').textContent = 'Your Nexus was destroyed!';
            this.setState(GAME_STATES.GAME_OVER);
            return;
        }

        // Check win condition
        const activeBases = this.bases.filter(b => !b.destroyed).length;
        if (activeBases === 0) {
            this.setState(GAME_STATES.LEVEL_UP);
            this.updateHighestLevel();
            this.saveProgress();
        }
    }

    updateHUD() {
        if (!this.hudElements.level) return;

        // Update level
        this.hudElements.level.textContent = this.level;

        // Update bases count
        const activeBases = this.bases.filter(b => !b.destroyed).length;
        this.hudElements.bases.textContent = activeBases;

        // Update player health
        const playerPercent = (this.player.hp / this.player.maxHp) * 100;
        this.hudElements.playerHealthFill.style.width = playerPercent + '%';
        this.hudElements.playerHealthText.textContent =
            `${Math.round(this.player.hp)} / ${this.player.maxHp}`;

        // Update nexus health
        const nexusPercent = (this.nexus.hp / this.nexus.maxHp) * 100;
        this.hudElements.nexusHealthFill.style.width = nexusPercent + '%';
        this.hudElements.nexusHealthText.textContent =
            `${Math.round(this.nexus.hp)} / ${this.nexus.maxHp}`;
    }

    spawnRaider(base) {
        if (!base || base.destroyed) return;

        const spawn = base.getSpawnPoint();
        const raider = new NPC(spawn.x, spawn.y, base.team, base, this.level);
        // Configure raider to push toward Nexus (user turret)
        raider.state = STATES.CHASE;
        raider.target = this.nexus;
        raider.senseRadius = 1200;
        raider.leashRadius = 9999;
        raider.stopDistance = 90;

        this.npcs.push(raider);
        base.guards.push(raider);
    }

    getBaseTarget(base) {
        if (!base || base.destroyed) return null;

        // Prioritize shooting the player if they are within range
        if (this.player?.alive && base.isTargetInRange(this.player.x, this.player.y)) {
            return this.player;
        }

        // Fallback: shoot the Nexus if it is close enough
        const attackRange = base.attackRange || base.aggroRadius || 0;
        const nexusRadius = Math.max(this.nexus.width, this.nexus.height) / 2;
        const nexusDistance = distance(base.x, base.y, this.nexus.x, this.nexus.y) - nexusRadius;
        if (nexusDistance <= attackRange) {
            return this.nexus;
        }

        return null;
    }

    spawnParticles(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                life: Math.random() * 0.3 + 0.2,
                maxLife: 0.5,
                color,
                size: 3
            });
        }
    }

    handleNexusTurret(dt) {
        if (!this.nexus || this.nexus.destroyed) return;

        const target = this.getNexusTarget();
        if (!target) return;

        if (this.nexus.fireCooldown <= 0) {
            this.nexus.fireCooldown = this.nexus.fireRate;
            const speed = this.nexus.projectileSpeed || 480;
            const lifetime = Math.max(this.nexus.attackRange / speed, 0.1);
            this.projectiles.push(
                new Projectile(
                    this.nexus.x,
                    this.nexus.y,
                    target.x,
                    target.y,
                    this.nexus.damage,
                    'player',
                    speed,
                    lifetime
                )
            );
        }
    }

    getNexusTarget() {
        // Prioritize closest NPC within range
        let closestNpc = null;
        let closestDist = Infinity;
        for (const npc of this.npcs) {
            if (!npc.alive) continue;
            const d = distance(this.nexus.x, this.nexus.y, npc.x, npc.y);
            if (d <= this.nexus.attackRange && d < closestDist) {
                closestDist = d;
                closestNpc = npc;
            }
        }
        if (closestNpc) return closestNpc;

        // Otherwise aim at closest enemy base
        let closestBase = null;
        closestDist = Infinity;
        for (const base of this.bases) {
            if (base.destroyed) continue;
            const d = distance(this.nexus.x, this.nexus.y, base.x, base.y);
            if (d <= this.nexus.attackRange && d < closestDist) {
                closestDist = d;
                closestBase = base;
            }
        }
        return closestBase;
    }

    getAllEntities() {
        return [
            this.player,
            this.nexus,
            ...this.bases,
            ...this.npcs,
            ...this.projectiles
        ];
    }

    // ===== Persistence =====

    loadPersistedData() {
        try {
            const saved = localStorage.getItem('nexus-progress');
            if (saved) {
                this.savedProgress = JSON.parse(saved);
                if (this.savedProgress.difficulty) {
                    this.difficulty = this.savedProgress.difficulty;
                    const diffSelect = getElement('difficulty');
                    if (diffSelect) {
                        diffSelect.value = this.difficulty;
                    }
                }
                if (this.savedProgress.weapon) {
                    this.weaponChoice = this.savedProgress.weapon;
                    const weaponSelect = getElement('weapon');
                    if (weaponSelect) {
                        weaponSelect.value = this.weaponChoice;
                    }
                }
            }

            const highest = localStorage.getItem('nexus-highest');
            if (highest) {
                this.highestLevels = JSON.parse(highest);
            }
        } catch (e) {
            console.warn('Failed to load progress', e);
        }
    }

    saveProgress() {
        try {
            const data = {
                level: this.level,
                difficulty: this.difficulty,
                weapon: this.weaponChoice
            };
            localStorage.setItem('nexus-progress', JSON.stringify(data));
            this.updateHighestLevel();
        } catch (e) {
            console.warn('Failed to save progress', e);
        }
    }

    updateHighestLevel() {
        const currentHigh = this.highestLevels[this.difficulty] || 0;
        if (this.level > currentHigh) {
            this.highestLevels[this.difficulty] = this.level;
            try {
                localStorage.setItem('nexus-highest', JSON.stringify(this.highestLevels));
            } catch (e) {
                console.warn('Failed to save highest level', e);
            }
        }
    }
}
