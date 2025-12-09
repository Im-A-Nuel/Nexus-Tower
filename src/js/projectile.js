/**
 * projectile.js - Projectile Class
 * Represents bullets fired by player and NPCs
 */

export class Projectile {
    constructor(x, y, targetX, targetY, damage, owner, speed = 560, lifetime = 1.5) {
        this.x = x;
        this.y = y;
        this.radius = 6; // Increased from 4 to 6 for better visibility

        // Calculate velocity towards target
        const angle = Math.atan2(targetY - y, targetX - x);
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.angle = angle;

        // Properties
        this.damage = damage;
        this.owner = owner; // 'player', 'red', 'blue', 'green'
        this.speed = speed;

        // Lifetime
        this.lifetime = lifetime; // seconds
        this.maxLifetime = lifetime;
        this.alive = true;

        // Visual
        this.sprite = null;
    }

    update(dt, canvasWidth, canvasHeight) {
        if (!this.alive) return;

        // Move
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        // Update lifetime
        this.lifetime -= dt;

        // Check if out of bounds or expired
        if (
            this.lifetime <= 0 ||
            this.x < 0 ||
            this.x > canvasWidth ||
            this.y < 0 ||
            this.y > canvasHeight
        ) {
            this.alive = false;
        }
    }

    /**
     * Mark projectile as destroyed
     */
    destroy() {
        this.alive = false;
    }

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
}
