/**
 * base.js - Base Classes
 * Represents player Nexus and enemy bases
 */

import { TEAMS, distance } from './utils.js';

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

        // Guards (untuk enemy bases)
        this.guards = [];

        // State
        this.destroyed = false;
        this.hitFlashTimer = 0;

        // Animation timer (used by renderer to advance sprite frames)
        this.animationTime = 0;
    }

    update(dt) {
        if (typeof dt === 'number') {
            this.animationTime += dt;
            this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
        }

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
        this.hitFlashTimer = 0.2;
        if (this.hp <= 0) {
            this.hp = 0;
            this.destroyed = true;
        }
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

        // Turret stats (player base can attack)
        this.damage = 20;
        this.attackRange = 260;
        this.fireRate = 1.2;
        this.fireCooldown = 0;
        this.projectileSpeed = 480;
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

    update(dt) {
        super.update(dt);
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);
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
        this.raidersToSpawn = 1;          // One raider ready at game start
        this.raiderSpawnTimer = 0.5;      // Spawn very soon after level start
        this.raiderSpawnInterval = 2.5;
        this.raiderAggroActive = true;    // Active from the beginning
        this.raiderAutoInterval = 6.5;    // Continuous raid cycle (slower)
        this.raiderAutoTimer = 5.0;

        // Turret combat (lets towers shoot back)
        const baseDamage = 10 + Math.floor((level - 1) * 1.2);
        this.damage = baseDamage;
        this.attackRange = 280;
        this.fireRate = 1.1; // Slightly faster turret fire
        this.fireCooldown = 0;
        this.projectileSpeed = 380;
    }

    /**
     * Update base timers; returns true if a raider is ready to spawn
     */
    update(dt) {
        super.update(dt);

        this.fireCooldown = Math.max(0, this.fireCooldown - dt);

        if (this.raiderAggroActive) {
            this.raiderAutoTimer -= dt;
            if (this.raiderAutoTimer <= 0) {
                this.raiderAutoTimer = this.raiderAutoInterval;
                this.queueRaiders(1);
            }
        }

        let spawnReady = false;
        if (this.raidersToSpawn > 0) {
            this.raiderSpawnTimer -= dt;
            if (this.raiderSpawnTimer <= 0) {
                this.raiderSpawnTimer = this.raiderSpawnInterval;
                if (this.raidersToSpawn > 0) {
                    this.raidersToSpawn--;
                    spawnReady = true;
                }
            }
        }

        return spawnReady;
    }

    /**
     * Queue raider spawns
     */
    queueRaiders(count) {
        this.raidersToSpawn += count;
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

    /**
     * Get spawn point in front of base
     */
    getSpawnPoint() {
        return {
            x: this.x - this.width / 2 - 10,
            y: this.y
        };
    }

    /**
     * Check if a target position is within turret range
     */
    isTargetInRange(targetX, targetY) {
        return distance(this.x, this.y, targetX, targetY) <= this.attackRange;
    }

    /**
     * Check if the base can fire this frame
     */
    canShootAt(targetX, targetY) {
        return !this.destroyed && this.fireCooldown <= 0 && this.isTargetInRange(targetX, targetY);
    }

    /**
     * Reset turret cooldown after shooting
     */
    resetFireCooldown() {
        this.fireCooldown = this.fireRate;
    }
}
