/**
 * sprite-animator.js - Sprite Animation System
 * Handles sprite sheet frame extraction and animation
 */

export class SpriteAnimator {
    constructor(spriteSheet, frameCount, frameWidth, frameHeight) {
        this.spriteSheet = spriteSheet;
        this.frameCount = frameCount;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameRate = 0.1; // seconds per frame
        this.loop = true;
        this.playing = true;
    }

    update(dt) {
        if (!this.playing) return;

        this.frameTimer += dt;
        if (this.frameTimer >= this.frameRate) {
            this.frameTimer = 0;
            this.currentFrame++;

            if (this.currentFrame >= this.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frameCount - 1;
                    this.playing = false;
                }
            }
        }
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    getFrameRect() {
        return {
            x: this.currentFrame * this.frameWidth,
            y: 0,
            width: this.frameWidth,
            height: this.frameHeight
        };
    }

    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.playing = true;
    }

    setFrameRate(rate) {
        this.frameRate = rate;
    }
}

/**
 * Helper function to draw a frame from a sprite sheet
 */
export function drawSpriteFrame(ctx, spriteSheet, frameIndex, frameWidth, frameHeight, x, y, width, height) {
    if (!spriteSheet) return false;

    const sourceX = frameIndex * frameWidth;
    const sourceY = 0;

    ctx.drawImage(
        spriteSheet,
        sourceX, sourceY, frameWidth, frameHeight,  // source rectangle
        x, y, width, height                          // destination rectangle
    );

    return true;
}

/**
 * Create animator config for common sprite types
 */
export const SPRITE_CONFIGS = {
    PLAYER_WALK: { frames: 6, width: 32, height: 32, frameRate: 0.08 },
    PLAYER_IDLE: { frames: 4, width: 32, height: 32, frameRate: 0.15 },
    PLAYER_RUN: { frames: 6, width: 32, height: 32, frameRate: 0.06 },
    PLAYER_HURT: { frames: 4, width: 32, height: 32, frameRate: 0.1 },
    PLAYER_DEATH: { frames: 8, width: 32, height: 32, frameRate: 0.12 },
    PLAYER_ATTACK: { frames: 6, width: 32, height: 32, frameRate: 0.08 },

    CASTLE: { frames: 5, width: 64, height: 64, frameRate: 0.2 },

    // Enemy sprites (most are animated sprite sheets)
    ENEMY_SD: { frames: 6, width: 64, height: 64, frameRate: 0.1 },

    // Soldier sprites
    // Craftpix Soldier 1 sheets: 128px tall, frames derived from sheet widths
    SOLDIER_IDLE: { frames: 7, width: 128, height: 128, frameRate: 0.14 },
    SOLDIER_WALK: { frames: 7, width: 128, height: 128, frameRate: 0.1 },
    SOLDIER_RUN: { frames: 8, width: 128, height: 128, frameRate: 0.08 },
    SOLDIER_ATTACK: { frames: 4, width: 128, height: 128, frameRate: 0.1 },
    SOLDIER_HURT: { frames: 3, width: 128, height: 128, frameRate: 0.1 },
    SOLDIER_DEAD: { frames: 4, width: 128, height: 128, frameRate: 0.14 },

    ENEMY_SLIME: { frames: 4, width: 32, height: 32, frameRate: 0.12 },
    ENEMY_BAT: { frames: 4, width: 32, height: 32, frameRate: 0.08 },
    ENEMY_SKELETON: { frames: 4, width: 32, height: 32, frameRate: 0.1 },
    ENEMY_ZOMBIE: { frames: 4, width: 32, height: 32, frameRate: 0.12 },
    ENEMY_GOBLIN: { frames: 4, width: 32, height: 32, frameRate: 0.1 },
    ENEMY_GHOST: { frames: 4, width: 32, height: 32, frameRate: 0.15 },
    ENEMY_DEMON: { frames: 4, width: 32, height: 32, frameRate: 0.1 },
    ENEMY_BIG_SLIME: { frames: 4, width: 32, height: 32, frameRate: 0.14 },
    ENEMY_KING_SLIME: { frames: 4, width: 48, height: 48, frameRate: 0.15 },
};

/**
 * Get sprite config based on sprite name
 */
export function getSpriteConfig(spriteName) {
    const mapping = {
        // Player
        'player_walk': 'PLAYER_WALK',
        'player_idle': 'PLAYER_IDLE',
        'player_run': 'PLAYER_RUN',
        'player_hurt': 'PLAYER_HURT',
        'player_death': 'PLAYER_DEATH',

        // Castles
        'castle_green': 'CASTLE',
        'castle_red': 'CASTLE',

        // Enemies
        'sd': 'ENEMY_SD',
        'soldier_1': 'SOLDIER_WALK',
        'soldier_2': 'SOLDIER_WALK',
        'soldier_3': 'SOLDIER_WALK',
        'slime': 'ENEMY_SLIME',
        'bat': 'ENEMY_BAT',
        'skeleton': 'ENEMY_SKELETON',
        'zombie': 'ENEMY_ZOMBIE',
        'goblin': 'ENEMY_GOBLIN',
        'ghost': 'ENEMY_GHOST',
        'demon': 'ENEMY_DEMON',
        'big_slime': 'ENEMY_BIG_SLIME',
        'king_slime': 'ENEMY_KING_SLIME',
    };

    const configKey = mapping[spriteName];
    return configKey ? SPRITE_CONFIGS[configKey] : null;
}
