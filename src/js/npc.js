/**
 * npc.js - NPC Guard Class dengan FSM
 * Finite State Machine: GUARD → CHASE → RETURN
 * Animation States: idle, walk, shot, dead
 */

import { distance, normalize, angleTo } from './utils.js';
import { SpriteAnimator, SPRITE_CONFIGS } from './sprite-animator.js';

// FSM States
const STATES = {
    GUARD: 'GUARD',
    CHASE: 'CHASE',
    RETURN: 'RETURN'
};

// Animation States
const ANIM_STATES = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    HURT: 'hurt',
    DEATH: 'death'
};

export class NPC {
    constructor(x, y, team, baseHome, level = 1) {
        this.x = x;
        this.y = y;
        this.radius = 24;
        this.team = team;

        // Base home (the base this NPC guards)
        this.baseHome = baseHome;

        // Anchor point (guard position)
        this.anchorX = x;
        this.anchorY = y;

        // FSM State
        this.state = STATES.GUARD;
        this.target = null;

        // Movement
        const baseSpeed = 96 + Math.min(40, (level - 1) * 4);
        this.speed = baseSpeed;
        this.velocityX = 0;
        this.velocityY = 0;

        // Health (scales with level)
        const baseHp = 100 + (level - 1) * 16;
        this.hp = baseHp;
        this.maxHp = baseHp;

        // Combat
        const baseDamage = 8;
        this.damage = baseDamage;
        this.range = 200;
        this.fireRate = 0.95;
        this.fireCooldown = 0;

        // FSM Parameters
        this.senseRadius = 170;
        this.leashRadius = 230;
        this.stopDistance = 150;

        // Visual & Animation
        this.sprite = this.chooseSprite(level);
        this.facing = 0;
        this.facingLeft = false;

        // Animation State System
        this.animState = ANIM_STATES.IDLE;
        this.animationTime = 0;
        this.hitFlashTimer = 0;

        // Multiple animators for different states
        this.animators = {};
        this.currentAnimator = null;

        // Death animation
        this.deathTimer = 0;
        this.deathDuration = 3.0; // 3 seconds before disappear
        this.isPlayingDeath = false;

        // Attack animation
        this.isAttacking = false;
        this.attackAnimTimer = 0;
        this.attackAnimDuration = 0.4; // Duration of attack animation

        // State
        this.alive = true;
        this.fullyDead = false; // True when death animation complete and timer done
    }

    chooseSprite(level) {
        // Use Soldier 1 sprites for all enemies
        return 'soldier_1';
    }

    /**
     * Initialize animators untuk semua animation states
     */
    initAnimator(sprites) {
        const isMonster = this.sprite && this.sprite.startsWith('enemy_');
        const isSoldier = this.sprite && this.sprite.startsWith('soldier_');

        if (isMonster) {
            const monsterSprites = sprites[this.sprite];
            if (!monsterSprites) {
                console.warn('⚠️ NPC: Monster sprites not found!', this.sprite);
                return;
            }

            // Frame counts for each animation (same as player)
            const animConfigs = {
                idle: { sheet: monsterSprites.idle, frames: 4, frameRate: 0.15 },
                walk: { sheet: monsterSprites.walk, frames: 6, frameRate: 0.1 },
                run: { sheet: monsterSprites.run, frames: 6, frameRate: 0.08 },
                attack: { sheet: monsterSprites.attack, frames: 4, frameRate: 0.1 },
                hurt: { sheet: monsterSprites.hurt, frames: 4, frameRate: 0.1 },
                death: { sheet: monsterSprites.death, frames: 8, frameRate: 0.12, loop: false }
            };

            // Create animator for each state
            for (const [state, config] of Object.entries(animConfigs)) {
                if (config.sheet && config.sheet.width) {
                    const frameWidth = config.sheet.width / config.frames;
                    const frameHeight = config.sheet.height;

                    const animator = new SpriteAnimator(
                        config.sheet,
                        config.frames,
                        frameWidth,
                        frameHeight
                    );
                    animator.setFrameRate(config.frameRate);
                    animator.loop = config.loop !== false;

                    this.animators[state] = animator;
                }
            }

            // Set initial animator
            this.currentAnimator = this.animators.idle || this.animators.walk;
            this.animState = ANIM_STATES.IDLE;
            return;
        }

        if (isSoldier) {
            const soldierSprites = sprites[this.sprite];
            if (!soldierSprites) {
                console.warn('NPC: Soldier sprites not found!', this.sprite);
                return;
            }

            const cfg = {
                idle: SPRITE_CONFIGS.SOLDIER_IDLE,
                walk: SPRITE_CONFIGS.SOLDIER_WALK,
                run: SPRITE_CONFIGS.SOLDIER_RUN,
                attack: SPRITE_CONFIGS.SOLDIER_ATTACK,
                hurt: SPRITE_CONFIGS.SOLDIER_HURT,
                death: SPRITE_CONFIGS.SOLDIER_DEAD
            };

            const animConfigs = {
                idle: { sheet: soldierSprites.idle, config: cfg.idle },
                walk: { sheet: soldierSprites.walk, config: cfg.walk },
                run: { sheet: soldierSprites.run, config: cfg.run },
                attack: { sheet: soldierSprites.attack, config: cfg.attack },
                hurt: { sheet: soldierSprites.hurt, config: cfg.hurt },
                death: { sheet: soldierSprites.death, config: cfg.death, loop: false }
            };

            for (const [state, data] of Object.entries(animConfigs)) {
                const { sheet, config, loop = true } = data;
                if (sheet && sheet.width && config) {
                    const animator = new SpriteAnimator(
                        sheet,
                        config.frames,
                        config.width,
                        config.height
                    );
                    animator.setFrameRate(config.frameRate);
                    animator.loop = loop !== false;
                    this.animators[state] = animator;
                }
            }

            this.currentAnimator = this.animators.idle || this.animators.walk;
            this.animState = ANIM_STATES.IDLE;
        }
    }

    /**
     * Change animation state
     */
    setAnimState(newState) {
        if (this.animState === newState) return;
        if (this.isPlayingDeath) return; // Don't change during death

        this.animState = newState;

        if (this.animators[newState]) {
            this.currentAnimator = this.animators[newState];
            this.currentAnimator.reset();
        }
    }

    /**
     * Get current frame index untuk animasi
     */
    getCurrentFrame() {
        if (this.currentAnimator) {
            return this.currentAnimator.getCurrentFrame();
        }
        return 0;
    }

    /**
     * Get current animation sprite sheet
     */
    getCurrentSpriteSheet() {
        if (this.currentAnimator) {
            return this.currentAnimator.spriteSheet;
        }
        return null;
    }

    /**
     * Get frame dimensions
     */
    getFrameDimensions() {
        if (this.currentAnimator) {
            return {
                width: this.currentAnimator.frameWidth,
                height: this.currentAnimator.frameHeight
            };
        }
        return { width: 64, height: 64 };
    }

    update(dt, player, nexus) {
        // Handle death animation and timer
        if (!this.alive) {
            if (!this.isPlayingDeath) {
                // Start death animation
                this.isPlayingDeath = true;
                this.setAnimState(ANIM_STATES.DEATH);
                if (this.animators.death) {
                    this.animators.death.reset();
                }
            }

            // Update death animator
            if (this.currentAnimator) {
                this.currentAnimator.update(dt);
            }

            // Count down death timer
            this.deathTimer += dt;
            if (this.deathTimer >= this.deathDuration) {
                this.fullyDead = true;
            }
            return;
        }

        // Store previous position
        const prevX = this.x;
        const prevY = this.y;

        // Advance timers
        this.animationTime += dt;
        this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);

        // Handle attack animation timer
        if (this.isAttacking) {
            this.attackAnimTimer += dt;
            if (this.attackAnimTimer >= this.attackAnimDuration) {
                this.isAttacking = false;
                this.attackAnimTimer = 0;
            }
        }

        // FSM Logic
        switch (this.state) {
            case STATES.GUARD:
                this.updateGuardState(dt, player);
                break;
            case STATES.CHASE:
                this.updateChaseState(dt, player);
                break;
            case STATES.RETURN:
                this.updateReturnState(dt, player);
                break;
        }

        // Calculate velocity
        this.velocityX = (this.x - prevX) / dt;
        this.velocityY = (this.y - prevY) / dt;

        // Update facing direction
        if (Math.abs(this.velocityX) > 10) {
            this.facingLeft = this.velocityX < 0;
        }

        // Update facing for attacking
        if (this.target) {
            this.facing = angleTo(this.x, this.y, this.target.x, this.target.y);
            // Face target when attacking
            this.facingLeft = this.target.x < this.x;
        }

        // Determine animation state based on behavior
        if (this.isAttacking) {
            this.setAnimState(ANIM_STATES.ATTACK);
        } else if (Math.abs(this.velocityX) > 10 || Math.abs(this.velocityY) > 10) {
            this.setAnimState(ANIM_STATES.WALK);
        } else {
            this.setAnimState(ANIM_STATES.IDLE);
        }

        // Update current animator
        if (this.currentAnimator) {
            this.currentAnimator.update(dt);
        }
    }

    // ===== FSM State Updates =====

    updateGuardState(dt, player) {
        // Return to anchor point if not there
        const distToAnchor = distance(this.x, this.y, this.anchorX, this.anchorY);

        if (distToAnchor > 4) {
            // Move towards anchor
            const dir = normalize(
                this.anchorX - this.x,
                this.anchorY - this.y
            );
            this.x += dir.x * this.speed * 0.6 * dt;
            this.y += dir.y * this.speed * 0.6 * dt;
        }

        // Check if player enters sense radius
        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        if (distToPlayer <= this.senseRadius) {
            // Transition to CHASE
            this.state = STATES.CHASE;
            this.target = player;
        }
    }

    updateChaseState(dt, player) {
        if (!this.target) {
            this.state = STATES.RETURN;
            return;
        }

        const distToTarget = distance(this.x, this.y, this.target.x, this.target.y);
        const distToBase = distance(this.x, this.y, this.baseHome.x, this.baseHome.y);

        // Check leash radius - too far from base
        if (distToBase > this.leashRadius) {
            this.state = STATES.RETURN;
            this.target = null;
            return;
        }

        // Check if player escaped (too far)
        if (distToTarget > this.senseRadius * 1.4) {
            this.state = STATES.RETURN;
            this.target = null;
            return;
        }

        // Move towards target if not in stop distance
        if (distToTarget > this.stopDistance) {
            const dir = normalize(
                this.target.x - this.x,
                this.target.y - this.y
            );
            this.x += dir.x * this.speed * dt;
            this.y += dir.y * this.speed * dt;
        }

        // Shoot if in range
        // (Shooting handled by game logic, just signal ready to shoot)
    }

    updateReturnState(dt, player) {
        // Move back to anchor
        const distToAnchor = distance(this.x, this.y, this.anchorX, this.anchorY);

        if (distToAnchor < 6) {
            // Arrived at anchor
            this.state = STATES.GUARD;
            this.target = null;
            return;
        }

        // Move towards anchor
        const dir = normalize(
            this.anchorX - this.x,
            this.anchorY - this.y
        );
        this.x += dir.x * this.speed * dt;
        this.y += dir.y * this.speed * dt;

        // Check if player is very close (re-engage)
        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        if (distToPlayer <= this.senseRadius * 0.9) {
            this.state = STATES.CHASE;
            this.target = player;
        }
    }

    // ===== Combat =====

    /**
     * Check if NPC can shoot
     */
    canShoot() {
        return this.fireCooldown <= 0 && this.target !== null;
    }

    /**
     * Attempt to shoot (returns true if shot)
     */
    shoot() {
        if (!this.canShoot()) {
            return false;
        }

        if (!this.target) {
            return false;
        }

        // Check if target is in range
        const distToTarget = distance(this.x, this.y, this.target.x, this.target.y);
        if (distToTarget > this.range) {
            return false;
        }

        // Trigger attack animation
        this.isAttacking = true;
        this.attackAnimTimer = 0;
        if (this.animators.attack) {
            this.animators.attack.reset();
        }

        this.fireCooldown = this.fireRate;
        return true;
    }

    /**
     * Get shoot target position
     */
    getShootTarget() {
        if (!this.target) return null;
        return {
            x: this.target.x,
            y: this.target.y
        };
    }

    // ===== Health =====

    /**
     * Take damage
     */
    takeDamage(amount) {
        if (!this.alive) return;

        this.hp -= amount;
        this.hitFlashTimer = 0.18;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    // ===== Helpers =====

    /**
     * Get collision circle
     */
    getCollisionCircle() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius
        };
    }

    /**
     * Get current state (for debugging)
     */
    getState() {
        return this.state;
    }
}

export { STATES, ANIM_STATES };
