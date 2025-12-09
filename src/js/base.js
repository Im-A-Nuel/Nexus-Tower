/**
 * base.js - Base Classes
 * Represents player Nexus and enemy bases
 */

import { TEAMS } from './utils.js';

export class Base {
    constructor(x, y, width, height, team) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.team = team;

        // Health
        this.hp = 200;
        this.maxHp = 200;

        // Aggro
        this.aggroRadius = 200;

        // Visual
        this.sprite = null;
        this.flashTimer = 0;
        this.flashDuration = 0.16;

        // Guards (untuk enemy bases)
        this.guards = [];

        // State
        this.destroyed = false;
    }

    update(dt) {
        // Decay hit flash
        this.flashTimer = Math.max(0, this.flashTimer - dt);

        // Update destroyed state
        if (this.hp <= 0 && !this.destroyed) {
            this.destroyed = true;
        }
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.destroyed) return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.destroyed = true;
        }

        // Trigger brief flash for feedback
        this.flashTimer = this.flashDuration;
    }

    /**
     * Heal
     */
    heal(amount) {
        if (this.destroyed) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    /**
     * Check if point is in aggro range
     */
    isInAggroRange(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distSq = dx * dx + dy * dy;
        return distSq <= this.aggroRadius * this.aggroRadius;
    }

    /**
     * Get collision rectangle
     */
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get anchor point for guards (in front of base)
     */
    getGuardAnchor(index = 0) {
        return {
            x: this.x - this.width / 2 - 30,
            y: this.y + (index % 2 === 0 ? -20 : 20)
        };
    }
}

export class Nexus extends Base {
    constructor(x, y) {
        super(x, y, 80, 80, TEAMS.PLAYER); // Increased from 64 to 80 for better visibility

        this.hp = 200;
        this.maxHp = 200;
        this.sprite = 'castle_green';
    }

    /**
     * Level up (increase stats)
     */
    levelUp() {
        // Increase max HP
        this.maxHp += 45;

        // Restore some HP
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.maxHp * 0.5));
    }
}

export class EnemyBase extends Base {
    constructor(x, y, team, level = 1) {
        super(x, y, 80, 80, team); // Increased from 64 to 80 for better visibility

        // Scale HP based on level
        const baseHp = 220 + (level - 1) * 55;
        this.hp = baseHp;
        this.maxHp = baseHp;

        this.sprite = 'castle_red';

        // Raider spawn
        this.raidersToSpawn = 0;
        this.raiderSpawnTimer = 0;
        this.raiderSpawnInterval = 1.5;
    }

    update(dt) {
        super.update(dt);

        // Update raider spawn timer
        if (this.raidersToSpawn > 0) {
            this.raiderSpawnTimer -= dt;
            if (this.raiderSpawnTimer <= 0) {
                this.raiderSpawnTimer = this.raiderSpawnInterval;
                // Signal to spawn raider (handled by game logic)
            }
        }
    }

    /**
     * Queue raider spawns
     */
    queueRaiders(count) {
        this.raidersToSpawn = Math.max(this.raidersToSpawn, count);
    }

    /**
     * Consume one raider from queue
     */
    consumeRaider() {
        if (this.raidersToSpawn > 0) {
            this.raidersToSpawn--;
            return true;
        }
        return false;
    }
}
