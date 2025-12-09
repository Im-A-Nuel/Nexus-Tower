/**
 * collision.js - Collision Handler
 * Handles collision detection and resolution untuk semua entities
 */

import { circleCollision, circleRectCollision } from './utils.js';

export class CollisionHandler {
    constructor() {
        this.particleCallbacks = []; // Callbacks untuk spawn particles
    }

    /**
     * Register callback untuk spawn particles saat collision
     */
    onParticleSpawn(callback) {
        this.particleCallbacks.push(callback);
    }

    /**
     * Spawn particles
     */
    spawnParticles(x, y, color, count = 6) {
        this.particleCallbacks.forEach(cb => cb(x, y, color, count));
    }

    /**
     * Check dan handle semua collisions
     */
    checkAllCollisions(player, nexus, bases, npcs, projectiles) {
        this.checkProjectileCollisions(player, nexus, bases, npcs, projectiles);
    }

    /**
     * Check projectile collisions
     */
    checkProjectileCollisions(player, nexus, bases, npcs, projectiles) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            if (!proj.alive) continue;

            if (proj.owner === 'player') {
                // Player projectiles hit enemies

                // Check NPC collisions
                let hitNPC = false;
                for (const npc of npcs) {
                    if (!npc.alive) continue;
                    if (npc.team === 'player') continue;

                    if (circleCollision(
                        proj.x, proj.y, proj.radius,
                        npc.x, npc.y, npc.radius
                    )) {
                        npc.takeDamage(proj.damage);
                        npc.hitFlashTimer = 0.18;
                        this.spawnParticles(npc.x, npc.y, '#fbbf24');
                        proj.destroy();
                        hitNPC = true;
                        break;
                    }
                }

                if (hitNPC) continue;

                // Check enemy base collisions
                for (const base of bases) {
                    if (base.destroyed) continue;
                    if (base.team === 'player') continue;

                    if (circleRectCollision(
                        proj.x, proj.y, proj.radius,
                        base.x, base.y, base.width, base.height
                    )) {
                        base.takeDamage(proj.damage);
                        base.hitFlashTimer = 0.2;
                        this.spawnParticles(proj.x, proj.y, '#5eead4');
                        proj.destroy();
                        break;
                    }
                }

            } else {
                // Enemy projectiles hit player or nexus

                // Check player collision
                if (circleCollision(
                    proj.x, proj.y, proj.radius,
                    player.x, player.y, player.radius
                )) {
                    player.takeDamage(proj.damage);
                    this.spawnParticles(player.x, player.y, '#f87171');
                    proj.destroy();
                    continue;
                }

                // Check nexus collision
                if (circleRectCollision(
                    proj.x, proj.y, proj.radius,
                    nexus.x, nexus.y, nexus.width, nexus.height
                )) {
                    nexus.takeDamage(proj.damage);
                    this.spawnParticles(proj.x, proj.y, '#f87171');
                    proj.destroy();
                    continue;
                }
            }
        }
    }

    /**
     * Check if player is in aggro range of any base
     */
    checkAggroRanges(player, bases) {
        const triggered = [];

        for (const base of bases) {
            if (base.destroyed) continue;
            if (base.team === 'player') continue;

            if (base.isInAggroRange(player.x, player.y)) {
                triggered.push(base);
            }
        }

        return triggered;
    }
}
