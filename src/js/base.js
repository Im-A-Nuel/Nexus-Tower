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

        // Random Combat Tower sprite untuk Nexus (player base)
        const nexusTowerSprites = [
            'tower_archer',
            'tower_cannon',
            'tower_crossbow',
            'tower_ice_wizard',
            'tower_lightning',
            'tower_poison_wizard'
        ];
        this.sprite = nexusTowerSprites[Math.floor(Math.random() * nexusTowerSprites.length)];

        // Turret stats (player base can attack)
        this.damage = 32; // Higher base damage for early impact
        this.attackRange = 260;
        this.fireRate = 0.9; // Faster baseline fire rate
        this.fireCooldown = 0;
        this.projectileSpeed = 520;
        this.splashRadius = 80; // Area attack radius for Nexus shots
    }

    /**
     * Level up (increase stats)
     */
    levelUp() {
        // Increase max HP
        this.maxHp += 45;

        // Restore some HP
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.maxHp * 0.5));

        // Scale offensive power to keep up with level
        this.damage += 6; // more punch each level
        this.attackRange = Math.min(360, this.attackRange + 6); // modest range bump, capped
        this.projectileSpeed += 12; // faster shots feel snappier
        this.fireRate = Math.max(0.6, this.fireRate - 0.05); // faster firing, capped
        this.splashRadius = Math.min(140, this.splashRadius + 8); // larger blast over time
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

        // Random tower sprite dari Combat Towers
        const towerSprites = [
            'tower_archer',
            'tower_cannon',
            'tower_crossbow',
            'tower_ice_wizard',
            'tower_lightning',
            'tower_poison_wizard'
        ];
        this.sprite = towerSprites[Math.floor(Math.random() * towerSprites.length)];

        // Raider spawn - scales with level for progressive difficulty
        this.level = level;

        // Initial raiders ready to spawn (1 at start, more at higher levels)
        this.raidersToSpawn = 1 + Math.floor((level - 1) / 3);

        // Time before first spawn (spawn quickly at start)
        this.raiderSpawnTimer = 0.5;

        // Interval between spawns (longer at low levels, shorter at high)
        // Level 1: 6s, Level 5: 4s, Level 10: 2.5s
        this.raiderSpawnInterval = Math.max(2.5, 6.0 - (level - 1) * 0.4);

        this.raiderAggroActive = true;    // Active from the beginning

        // Auto-queue interval (longer at low levels, shorter at high)
        // Level 1: 10s, Level 5: 7s, Level 10: 4s
        this.raiderAutoInterval = Math.max(4.0, 10.0 - (level - 1) * 0.7);

        // First auto-queue timer (give player time to prepare)
        // Level 1: 12s, Level 5: 8s, Level 10: 5s
        this.raiderAutoTimer = Math.max(5.0, 12.0 - (level - 1) * 0.8);

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
