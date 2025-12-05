/**
 * player.js - Player Class
 * Represents the player character
 */

import { clamp, normalize, angleTo } from './utils.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20; // Increased from 16 to 20 for better visibility

        // Movement
        this.speed = 220;
        this.velocityX = 0;
        this.velocityY = 0;

        // Health
        this.hp = 100;
        this.maxHp = 100;

        // Combat
        this.damage = 22;
        this.fireRate = 0.14; // seconds between shots
        this.fireCooldown = 0;
        this.range = 600;

        // Dash
        this.dashSpeed = 800;
        this.dashDuration = 0.15; // seconds
        this.dashCooldown = 0;
        this.dashCooldownMax = 1.0; // seconds
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;

        // Visual
        this.sprite = 'player_walk';
        this.animation = 'idle';
        this.facing = 0; // angle in radians

        // State
        this.alive = true;
    }

    update(dt, input, canvas) {
        if (!this.alive) return;

        // Update cooldowns
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);

        // Handle dash
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            } else {
                // Move in dash direction
                this.x += this.dashDirX * this.dashSpeed * dt;
                this.y += this.dashDirY * this.dashSpeed * dt;
            }
        } else {
            // Normal movement
            const movement = input.getMovementVector();
            const normalized = normalize(movement.x, movement.y);

            this.velocityX = normalized.x * this.speed;
            this.velocityY = normalized.y * this.speed;

            this.x += this.velocityX * dt;
            this.y += this.velocityY * dt;
        }

        // Clamp to canvas bounds
        this.x = clamp(this.x, this.radius, canvas.width - this.radius);
        this.y = clamp(this.y, this.radius, canvas.height - this.radius);

        // Update facing direction (towards mouse)
        const mouse = input.getMousePosition();
        this.facing = angleTo(this.x, this.y, mouse.x, mouse.y);

        // Update animation based on movement
        if (Math.abs(this.velocityX) > 10 || Math.abs(this.velocityY) > 10) {
            this.animation = 'walk';
        } else {
            this.animation = 'idle';
        }
    }

    /**
     * Attempt to perform dash
     */
    dash(mouseX, mouseY) {
        if (this.dashCooldown > 0 || this.isDashing) {
            return false;
        }

        // Calculate dash direction (towards mouse)
        const dirX = mouseX - this.x;
        const dirY = mouseY - this.y;
        const normalized = normalize(dirX, dirY);

        this.dashDirX = normalized.x;
        this.dashDirY = normalized.y;
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;

        return true;
    }

    /**
     * Check if player can shoot
     */
    canShoot() {
        return this.fireCooldown <= 0;
    }

    /**
     * Trigger shoot (returns true if shot was fired)
     */
    shoot() {
        if (!this.canShoot()) {
            return false;
        }

        this.fireCooldown = this.fireRate;
        return true;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        if (!this.alive) return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    /**
     * Heal
     */
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    /**
     * Level up (increase stats)
     */
    levelUp() {
        // Increase max HP
        this.maxHp += 12;

        // Restore some HP
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.maxHp * 0.45));

        // Slight damage increase (optional)
        this.damage += 2;
    }

    /**
     * Reset player to initial state
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.hp = this.maxHp;
        this.alive = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.fireCooldown = 0;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTimer = 0;
    }

    /**
     * Get player position
     */
    getPosition() {
        return { x: this.x, y: this.y };
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
