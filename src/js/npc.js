/**
 * npc.js - NPC Guard Class dengan FSM
 * Finite State Machine: GUARD → CHASE → RETURN
 */

import { distance, normalize, angleTo } from './utils.js';

// FSM States
const STATES = {
    GUARD: 'GUARD',
    CHASE: 'CHASE',
    RETURN: 'RETURN'
};

export class NPC {
    constructor(x, y, team, baseHome, level = 1) {
        this.x = x;
        this.y = y;
        this.radius = 16; // Increased from 12 to 16 for better visibility
        this.team = team;

        // Base home (the base this NPC guards)
        this.baseHome = baseHome;

        // Anchor point (guard position)
        this.anchorX = x;
        this.anchorY = y;

        // FSM State
        this.state = STATES.GUARD;
        this.target = null; // Current chase target

        // Movement
        const baseSpeed = 96 + Math.min(40, (level - 1) * 4);
        this.speed = baseSpeed;

        // Health (scales with level)
        const baseHp = 100 + (level - 1) * 16;
        this.hp = baseHp;
        this.maxHp = baseHp;

        // Combat
        const baseDamage = 8;
        this.damage = baseDamage;
        this.range = 200; // Attack range
        this.fireRate = 0.95; // seconds between shots (slightly faster)
        this.fireCooldown = 0;

        // FSM Parameters
        this.senseRadius = 170; // Detection radius for player
        this.leashRadius = 230; // Max distance from base before returning
        this.stopDistance = 150; // Stop this far from target to shoot

        // Visual - Random sprite based on level
        this.sprite = this.chooseSprite(level);
        this.facing = 0;

        // State
        this.alive = true;
        this.animationTime = 0;
        this.hitFlashTimer = 0;
    }

    chooseSprite(level) {
        // Different enemies appear at different levels
        const enemyTypes = [
            'slime',       // Level 1-2
            'bat',         // Level 2-3
            'skeleton',    // Level 3-4
            'zombie',      // Level 4-5
            'goblin',      // Level 5-6
            'ghost',       // Level 6+
            'demon'        // Level 7+
        ];

        const index = Math.min(Math.floor((level - 1) / 2), enemyTypes.length - 1);
        return enemyTypes[index];
    }

    update(dt, player, nexus) {
        if (!this.alive) return;

        // Advance animation timer
        this.animationTime += dt;
        this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

        // Update cooldowns
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);

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

        // Update facing direction
        if (this.target) {
            this.facing = angleTo(this.x, this.y, this.target.x, this.target.y);
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

export { STATES };
