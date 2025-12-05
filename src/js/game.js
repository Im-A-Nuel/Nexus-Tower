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
import { GAME_STATES, getElement, showElement } from './utils.js';

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
        this.level = 1;
        this.initializeEntities();
        this.loadLevel(this.level);
        this.setState(GAME_STATES.PLAYING);
        this.start();
    }

    initializeEntities() {
        // Create player
        this.player = new Player(160, this.height / 2);

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
    }

    restartLevel() {
        this.loadLevel(this.level);
        this.setState(GAME_STATES.PLAYING);
    }

    retryGame() {
        this.startGame();
    }

    backToMenu() {
        this.setState(GAME_STATES.MENU);
        this.stop();
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
        if (this.input.isShootPressed() && this.player.canShoot()) {
            const mouse = this.input.getMousePosition();
            if (this.player.shoot()) {
                this.projectiles.push(
                    new Projectile(
                        this.player.x,
                        this.player.y,
                        mouse.x,
                        mouse.y,
                        this.player.damage,
                        'player',
                        560
                    )
                );
            }
        }

        // Update nexus
        this.nexus.update(dt);

        // Update enemy bases
        for (const base of this.bases) {
            base.update(dt);
        }

        // Update NPCs
        for (let i = this.npcs.length - 1; i >= 0; i--) {
            const npc = this.npcs[i];
            npc.update(dt, this.player, this.nexus);

            // NPC shooting
            if (npc.canShoot()) {
                const target = npc.getShootTarget();
                if (target && npc.shoot()) {
                    this.projectiles.push(
                        new Projectile(
                            npc.x,
                            npc.y,
                            target.x,
                            target.y,
                            npc.damage,
                            npc.team,
                            420
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

    getAllEntities() {
        return [
            this.player,
            this.nexus,
            ...this.bases,
            ...this.npcs,
            ...this.projectiles
        ];
    }
}
