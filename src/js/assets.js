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
            // Player sprites
            player: {
                idle: 'assets/sprites/player/Pink_Monster_Idle_4.png',
                walk: 'assets/sprites/player/Pink_Monster_Walk_6.png',
                run: 'assets/sprites/player/Pink_Monster_Run_6.png',
                hurt: 'assets/sprites/player/Pink_Monster_Hurt_4.png',
                death: 'assets/sprites/player/Pink_Monster_Death_8.png'
            },

            // Base sprites
            bases: {
                castle_green: 'assets/sprites/bases/spr_castle_green.png',
                castle_red: 'assets/sprites/bases/spr_castle_red.png'
            },

            // Enemy/NPC sprites
            enemies: {
                bat: 'assets/sprites/enemies/spr_bat.png',
                slime: 'assets/sprites/enemies/spr_normal_slime.png',
                big_slime: 'assets/sprites/enemies/spr_big_slime.png',
                king_slime: 'assets/sprites/enemies/spr_king_slime.png',
                skeleton: 'assets/sprites/enemies/spr_skeleton.png',
                zombie: 'assets/sprites/enemies/spr_zombie.png',
                ghost: 'assets/sprites/enemies/spr_ghost.png',
                demon: 'assets/sprites/enemies/spr_demon.png',
                goblin: 'assets/sprites/enemies/spr_goblin.png'
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
}
