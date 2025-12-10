/**
 * assets.js - Asset Loader
 * Handles loading and managing game assets (sprites, images, etc.)
 */

export class AssetLoader {
    constructor() {
        this.assets = {};
        this.loaded = 0;
        this.total = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
    }

    /**
     * Define all assets to load
     */
    getAssetManifest() {
        return {
            // Player sprites - Pink Monster
            player_pink: {
                idle: 'assets/sprites/player/Pink_Monster_Idle_4.png',
                walk: 'assets/sprites/player/Pink_Monster_Walk_6.png',
                run: 'assets/sprites/player/Pink_Monster_Run_6.png',
                push: 'assets/sprites/player/Pink_Monster_Push_6.png',
                walk_attack: 'assets/sprites/player/Pink_Monster_Walk+Attack_6.png',
                dust: 'assets/sprites/player/Walk_Run_Push_Dust_6.png',
                hurt: 'assets/sprites/player/Pink_Monster_Hurt_4.png',
                death: 'assets/sprites/player/Pink_Monster_Death_8.png'
            },

            // Player sprites - Owlet Monster
            player_owlet: {
                idle: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Idle_4.png',
                walk: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Walk_6.png',
                run: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Run_6.png',
                push: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Push_6.png',
                walk_attack: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Walk+Attack_6.png',
                dust: 'assets/sprites/player/2 Owlet_Monster/Walk_Run_Push_Dust_6.png',
                hurt: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Hurt_4.png',
                death: 'assets/sprites/player/2 Owlet_Monster/Owlet_Monster_Death_8.png'
            },

            // Player sprites - Dude Monster
            player_dude: {
                idle: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Idle_4.png',
                walk: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Walk_6.png',
                run: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Run_6.png',
                push: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Push_6.png',
                walk_attack: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Walk+Attack_6.png',
                dust: 'assets/sprites/player/3 Dude_Monster/Walk_Run_Push_Dust_6.png',
                hurt: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Hurt_4.png',
                death: 'assets/sprites/player/3 Dude_Monster/Dude_Monster_Death_8.png'
            },

            // Base sprites
            bases: {
                castle_green: 'assets/sprites/bases/spr_castle_green.png',
                castle_red: 'assets/sprites/bases/spr_castle_red.png',
                // Combat Towers
                tower_archer: 'assets/sprites/bases/Combat Towers/spr_tower_archer.png',
                tower_cannon: 'assets/sprites/bases/Combat Towers/spr_tower_cannon.png',
                tower_crossbow: 'assets/sprites/bases/Combat Towers/spr_tower_crossbow.png',
                tower_ice_wizard: 'assets/sprites/bases/Combat Towers/spr_tower_ice_wizard.png',
                tower_lightning: 'assets/sprites/bases/Combat Towers/spr_tower_lightning_tower.png',
                tower_poison_wizard: 'assets/sprites/bases/Combat Towers/spr_tower_poison_wizard.png'
            },

            // Enemy/NPC sprites - Monster sprites (same style as player)
            enemies: {
                // Enemy Pink Monster
                enemy_pink: {
                    idle: 'assets/sprites/enemies/1 Pink_Monster/Pink_Monster_Idle_4.png',
                    walk: 'assets/sprites/enemies/1 Pink_Monster/Pink_Monster_Walk_6.png',
                    run: 'assets/sprites/enemies/1 Pink_Monster/Pink_Monster_Run_6.png',
                    attack: 'assets/sprites/enemies/1 Pink_Monster/Pink_Monster_Attack1_4.png',
                    hurt: 'assets/sprites/enemies/1 Pink_Monster/Pink_Monster_Hurt_4.png',
                    death: 'assets/sprites/enemies/1 Pink_Monster/Pink_Monster_Death_8.png'
                },
                // Enemy Owlet Monster
                enemy_owlet: {
                    idle: 'assets/sprites/enemies/2 Owlet_Monster/Owlet_Monster_Idle_4.png',
                    walk: 'assets/sprites/enemies/2 Owlet_Monster/Owlet_Monster_Walk_6.png',
                    run: 'assets/sprites/enemies/2 Owlet_Monster/Owlet_Monster_Run_6.png',
                    attack: 'assets/sprites/enemies/2 Owlet_Monster/Owlet_Monster_Attack1_4.png',
                    hurt: 'assets/sprites/enemies/2 Owlet_Monster/Owlet_Monster_Hurt_4.png',
                    death: 'assets/sprites/enemies/2 Owlet_Monster/Owlet_Monster_Death_8.png'
                },
                // Enemy Dude Monster
                enemy_dude: {
                    idle: 'assets/sprites/enemies/3 Dude_Monster/Dude_Monster_Idle_4.png',
                    walk: 'assets/sprites/enemies/3 Dude_Monster/Dude_Monster_Walk_6.png',
                    run: 'assets/sprites/enemies/3 Dude_Monster/Dude_Monster_Run_6.png',
                    attack: 'assets/sprites/enemies/3 Dude_Monster/Dude_Monster_Attack1_4.png',
                    hurt: 'assets/sprites/enemies/3 Dude_Monster/Dude_Monster_Hurt_4.png',
                    death: 'assets/sprites/enemies/3 Dude_Monster/Dude_Monster_Death_8.png'
                },

                // Soldier enemy set (default enemy visuals) from Craftpix pack
                soldier_1: {
                    idle: 'assets/sprites/enemies/Soldier_1/Idle.png',
                    walk: 'assets/sprites/enemies/Soldier_1/Walk.png',
                    run: 'assets/sprites/enemies/Soldier_1/Run.png',
                    attack: 'assets/sprites/enemies/Soldier_1/Shot_2.png',
                    hurt: 'assets/sprites/enemies/Soldier_1/Hurt.png',
                    death: 'assets/sprites/enemies/Soldier_1/Dead.png'
                }
            },

            // Projectile sprites
            projectiles: {
                arrow: 'assets/sprites/projectiles/spr_tower_archer_projectile.png',
                cannon: 'assets/sprites/projectiles/spr_tower_cannon_projectile.png',
                crossbow: 'assets/sprites/projectiles/spr_tower_crossbow_projectile.png',
                ice: 'assets/sprites/projectiles/spr_tower_ice_wizard_projectile.png',
                lightning: 'assets/sprites/projectiles/spr_tower_lightning_tower_projectile.png',
                poison: 'assets/sprites/projectiles/spr_tower_poison_wizard_projectile.png'
            },

            // Environment
            environment: {
                tileset: 'assets/sprites/environment/FieldsTileset.png',
                ground: 'assets/sprites/environment/spr_tile_set_ground.png',
                stone: 'assets/sprites/environment/spr_tile_set_stone.png',
                background: 'assets/background1.png' // new desert path backdrop
            }
        };
    }

    /**
     * Load all assets
     */
    async loadAll() {
        return new Promise((resolve, reject) => {
            const manifest = this.getAssetManifest();
            const assetList = this.flattenManifest(manifest);

            this.total = assetList.length;
            this.loaded = 0;

            if (this.total === 0) {
                resolve(this.assets);
                return;
            }

            let loadedCount = 0;
            let hasError = false;

            assetList.forEach(({ key, path }) => {
                const img = new Image();

                img.onload = () => {
                    loadedCount++;
                    this.loaded = loadedCount;

                    // Store the loaded image
                    this.setNestedAsset(key, img);

                    // Update progress
                    if (this.onProgressCallback) {
                        this.onProgressCallback(this.loaded, this.total);
                    }

                    // Check if all loaded
                    if (loadedCount === this.total && !hasError) {
                        if (this.onCompleteCallback) {
                            this.onCompleteCallback(this.assets);
                        }
                        resolve(this.assets);
                    }
                };

                img.onerror = () => {
                    console.error(`Failed to load asset: ${path}`);
                    loadedCount++;
                    this.loaded = loadedCount;
                    hasError = true;

                    // Continue even with errors, but log them
                    if (loadedCount === this.total) {
                        console.warn('Some assets failed to load');
                        if (this.onCompleteCallback) {
                            this.onCompleteCallback(this.assets);
                        }
                        resolve(this.assets);
                    }
                };

                img.src = path;
            });
        });
    }

    /**
     * Flatten nested manifest into array of {key, path}
     */
    flattenManifest(manifest, prefix = '') {
        const result = [];

        for (const [key, value] of Object.entries(manifest)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'string') {
                // It's a path
                result.push({ key: fullKey, path: value });
            } else if (typeof value === 'object') {
                // It's a nested object
                result.push(...this.flattenManifest(value, fullKey));
            }
        }

        return result;
    }

    /**
     * Set nested asset using dot notation (e.g., "player.idle")
     */
    setNestedAsset(key, value) {
        const keys = key.split('.');
        let current = this.assets;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Get asset by key (e.g., "player.idle" or assets.player.idle)
     */
    get(key) {
        const keys = key.split('.');
        let current = this.assets;

        for (const k of keys) {
            if (!current[k]) {
                console.warn(`Asset not found: ${key}`);
                return null;
            }
            current = current[k];
        }

        return current;
    }

    /**
     * Get all assets
     */
    getAll() {
        return this.assets;
    }

    /**
     * Set progress callback
     */
    onProgress(callback) {
        this.onProgressCallback = callback;
    }

    /**
     * Set complete callback
     */
    onComplete(callback) {
        this.onCompleteCallback = callback;
    }

    /**
     * Get loading progress (0 to 1)
     */
    getProgress() {
        return this.total > 0 ? this.loaded / this.total : 0;
    }

    /**
     * Check if loading is complete
     */
    isComplete() {
        return this.loaded === this.total && this.total > 0;
    }

    /**
     * Create sprite sheet dari individual frames
     * @param {Array<Image>} frames - Array of frame images
     * @param {Number} frameWidth - Width per frame
     * @param {Number} frameHeight - Height per frame
     * @returns {HTMLCanvasElement} Canvas berisi sprite sheet
     */
    createSpriteSheet(frames, frameWidth, frameHeight) {
        if (!frames || frames.length === 0) return null;

        // Create canvas untuk sprite sheet
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth * frames.length;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');

        // Disable smoothing untuk pixel art
        ctx.imageSmoothingEnabled = false;

        // Draw semua frames secara horizontal
        frames.forEach((frame, index) => {
            if (frame) {
                ctx.drawImage(
                    frame,
                    index * frameWidth, 0,
                    frameWidth, frameHeight
                );
            }
        });

        return canvas;
    }

    /**
     * Create SD enemy sprite sheet dari individual frames
     */
    createSDSpriteSheet() {
        const frames = this.assets.enemies?.sd_frames;

        if (!frames) {
            console.error('❌ SD frames not found in assets!');
            return null;
        }

        const frameArray = [
            frames.frame1,
            frames.frame2,
            frames.frame3,
            frames.frame4,
            frames.frame5,
            frames.frame6
        ];

        // Check jika ada frames yang null
        const nullFrames = frameArray.filter(f => !f);
        if (nullFrames.length > 0) {
            console.error(`❌ ${nullFrames.length} SD frames failed to load!`);
            console.log('Loaded frames:', frameArray.map((f, i) => ({ index: i+1, loaded: !!f })));
        }

        // Tentukan ukuran frame (dari frame pertama yang loaded)
        const firstLoadedFrame = frameArray.find(f => f);
        if (firstLoadedFrame) {
            const frameWidth = firstLoadedFrame.width;
            const frameHeight = firstLoadedFrame.height;
            console.log('📐 Frame dimensions:', { frameWidth, frameHeight });
            return this.createSpriteSheet(frameArray, frameWidth, frameHeight);
        }

        console.error('❌ No SD frames were loaded!');
        return null;
    }
}
