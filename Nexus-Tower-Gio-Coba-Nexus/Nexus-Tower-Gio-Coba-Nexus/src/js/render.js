/**
 * render.js - Renderer
 * Handles all canvas rendering operations
 */

import { TEAM_COLORS } from './utils.js';
import { drawSpriteFrame, SPRITE_CONFIGS, getSpriteConfig } from './sprite-animator.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Disable smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;

        // Debug options
        this.showGrid = false;
        this.showAggroRadius = false; // Hidden by default for cleaner gameplay
        this.showCollisionBoxes = false;

        // Loaded sprites (akan diisi dari luar)
        this.sprites = {};
    }

    // ===== Clear & Background =====

    clear() {
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        // Gradient background with depth
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width
        );
        gradient.addColorStop(0, '#0f1420');
        gradient.addColorStop(0.5, '#0a0e1a');
        gradient.addColorStop(1, '#050810');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw tileset if loaded with slight transparency
        if (this.sprites.tileset) {
            this.ctx.globalAlpha = 0.85;
            this.ctx.drawImage(this.sprites.tileset, 0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1;

            // Add subtle overlay for depth
            this.ctx.fillStyle = 'rgba(10, 14, 26, 0.15)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            // Fallback: Draw subtle texture pattern
            this.ctx.globalAlpha = 0.03;
            this.ctx.fillStyle = '#ffffff';
            for (let x = 0; x < this.width; x += 20) {
                for (let y = 0; y < this.height; y += 20) {
                    if (Math.random() > 0.5) {
                        this.ctx.fillRect(x, y, 2, 2);
                    }
                }
            }
            this.ctx.globalAlpha = 1;
        }

        // Vignette effect
        const vignette = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.width * 0.3,
            this.width / 2, this.height / 2, this.width * 0.8
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        if (!this.showGrid) return;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        const gridSize = 64;

        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }

        this.ctx.stroke();
        this.ctx.restore();
    }

    // ===== Entity Rendering =====

    drawPlayer(player, mouseX, mouseY) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, player.radius + 2, player.radius * 0.8, player.radius * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Aim line (subtle)
        this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(mouseX - player.x, mouseY - player.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Player sprite (jika loaded)
        if (player.sprite && this.sprites[player.sprite]) {
            const img = this.sprites[player.sprite];
            const size = player.radius * 4; // Optimized size for clarity

            // Drop shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 5;

            // Get sprite config for player walk animation
            const config = SPRITE_CONFIGS.PLAYER_WALK;
            const frameIndex = Math.floor(Date.now() / 100) % config.frames; // Simple animation

            // Draw single frame from sprite sheet
            drawSpriteFrame(
                this.ctx,
                img,
                frameIndex,
                config.width,
                config.height,
                -size / 2,
                -size / 2,
                size,
                size
            );

            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
        } else {
            // Fallback: Draw circle with glow
            // Outer glow
            this.ctx.shadowColor = TEAM_COLORS.player;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = TEAM_COLORS.player;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Reset shadow
            this.ctx.shadowBlur = 0;

            // Inner highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(-player.radius * 0.3, -player.radius * 0.3, player.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Hit flash overlay
        if (player.flashTimer > 0) {
            const intensity = Math.min(1, player.flashTimer / (player.flashDuration || 0.001));
            this.ctx.globalAlpha = 0.25 + intensity * 0.45;
            this.ctx.fillStyle = '#ffffff';
            const flashRadius = player.sprite && this.sprites[player.sprite] ? player.radius * 2 : player.radius * 1.2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // HP bar (adjusted position for larger sprite)
        if (player.hp < player.maxHp) {
            const spriteSize = player.sprite && this.sprites[player.sprite] ? player.radius * 4 : player.radius;
            this.drawHealthBar(0, -spriteSize / 2 - 14, 48, 5, player.hp, player.maxHp, TEAM_COLORS.player);
        }

        this.ctx.restore();
    }

    drawNexus(nexus) {
        this.ctx.save();
        this.ctx.translate(nexus.x, nexus.y);

        // Aggro radius (disabled for cleaner look)
        // if (this.showAggroRadius) {
        //     this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
        //     this.ctx.lineWidth = 2;
        //     this.ctx.setLineDash([8, 8]);
        //     this.ctx.beginPath();
        //     this.ctx.arc(0, 0, nexus.aggroRadius, 0, Math.PI * 2);
        //     this.ctx.stroke();
        //     this.ctx.setLineDash([]);
        //     this.ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
        //     this.ctx.fill();
        // }

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        this.ctx.fillRect(-nexus.width / 2 + 4, -nexus.height / 2 + 6, nexus.width, nexus.height);

        // Nexus sprite
        if (nexus.sprite && this.sprites[nexus.sprite]) {
            const img = this.sprites[nexus.sprite];
            const displaySize = nexus.width * 1.3; // Optimized size for clarity

            // Glow effect
            this.ctx.shadowColor = '#22c55e';
            this.ctx.shadowBlur = 25;

            // Get castle sprite config and animate
            const config = SPRITE_CONFIGS.CASTLE;
            const frameIndex = Math.floor(Date.now() / 200) % config.frames; // Slow animation

            // Draw single frame from sprite sheet
            drawSpriteFrame(
                this.ctx,
                img,
                frameIndex,
                config.width,
                config.height,
                -displaySize / 2,
                -displaySize / 2,
                displaySize,
                displaySize
            );

            this.ctx.shadowBlur = 0;
        } else {
            // Fallback: Draw rectangle with gradient
            const gradient = this.ctx.createLinearGradient(0, -nexus.height / 2, 0, nexus.height / 2);
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(1, '#16a34a');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-nexus.width / 2, -nexus.height / 2, nexus.width, nexus.height);

            // Border with glow
            this.ctx.strokeStyle = '#4ade80';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#22c55e';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeRect(-nexus.width / 2, -nexus.height / 2, nexus.width, nexus.height);
            this.ctx.shadowBlur = 0;
        }

        // Hit flash overlay
        if (nexus.flashTimer > 0) {
            const intensity = Math.min(1, nexus.flashTimer / (nexus.flashDuration || 0.001));
            this.ctx.globalAlpha = 0.2 + intensity * 0.45;
            this.ctx.fillStyle = '#ffffff';
            const flashSize = nexus.sprite && this.sprites[nexus.sprite] ? nexus.width * 1.35 : nexus.width * 1.05;
            this.ctx.fillRect(-flashSize / 2, -flashSize / 2, flashSize, flashSize);
            this.ctx.globalAlpha = 1;
        }

        // HP bar (adjusted position for larger sprite)
        const nexusDisplaySize = nexus.sprite && this.sprites[nexus.sprite] ? nexus.width * 1.3 : nexus.width;
        this.drawHealthBar(0, -nexusDisplaySize / 2 - 14, nexusDisplaySize * 0.75, 6, nexus.hp, nexus.maxHp, '#22c55e');

        this.ctx.restore();
    }

    drawEnemyBase(base) {
        if (base.hp <= 0) {
            // Destroyed base
            this.ctx.save();
            this.ctx.translate(base.x, base.y);

            // Rubble effect
            this.ctx.fillStyle = '#1f2937';
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(-base.width / 2, -base.height / 2, base.width, base.height);

            // X mark
            this.ctx.globalAlpha = 0.4;
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(-base.width / 3, -base.height / 3);
            this.ctx.lineTo(base.width / 3, base.height / 3);
            this.ctx.moveTo(base.width / 3, -base.height / 3);
            this.ctx.lineTo(-base.width / 3, base.height / 3);
            this.ctx.stroke();

            this.ctx.restore();
            return;
        }

        this.ctx.save();
        this.ctx.translate(base.x, base.y);

        // Aggro radius (disabled for cleaner look)
        // if (this.showAggroRadius) {
        //     const color = TEAM_COLORS[base.team];
        //     this.ctx.strokeStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
        //     this.ctx.lineWidth = 2;
        //     this.ctx.setLineDash([8, 8]);
        //     this.ctx.beginPath();
        //     this.ctx.arc(0, 0, base.aggroRadius, 0, Math.PI * 2);
        //     this.ctx.stroke();
        //     this.ctx.setLineDash([]);
        //     this.ctx.fillStyle = color.replace(')', ', 0.05)').replace('rgb', 'rgba');
        //     this.ctx.fill();
        // }

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        this.ctx.fillRect(-base.width / 2 + 4, -base.height / 2 + 6, base.width, base.height);

        // Base sprite
        if (base.sprite && this.sprites[base.sprite]) {
            const img = this.sprites[base.sprite];
            const displaySize = base.width * 1.3; // Optimized size for clarity

            // Glow effect
            this.ctx.shadowColor = TEAM_COLORS[base.team];
            this.ctx.shadowBlur = 20;

            // Get castle sprite config and animate
            const config = SPRITE_CONFIGS.CASTLE;
            const frameIndex = Math.floor(Date.now() / 200) % config.frames; // Slow animation

            // Draw single frame from sprite sheet
            drawSpriteFrame(
                this.ctx,
                img,
                frameIndex,
                config.width,
                config.height,
                -displaySize / 2,
                -displaySize / 2,
                displaySize,
                displaySize
            );

            this.ctx.shadowBlur = 0;
        } else {
            // Fallback: Draw rectangle with gradient
            const gradient = this.ctx.createLinearGradient(0, -base.height / 2, 0, base.height / 2);
            const color = TEAM_COLORS[base.team];
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.3));
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-base.width / 2, -base.height / 2, base.width, base.height);

            // Border with glow
            this.ctx.strokeStyle = this.lightenColor(color, 0.3);
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeRect(-base.width / 2, -base.height / 2, base.width, base.height);
            this.ctx.shadowBlur = 0;
        }

        // Hit flash overlay
        if (base.flashTimer > 0) {
            const intensity = Math.min(1, base.flashTimer / (base.flashDuration || 0.001));
            this.ctx.globalAlpha = 0.2 + intensity * 0.45;
            this.ctx.fillStyle = '#ffffff';
            const flashSize = base.sprite && this.sprites[base.sprite] ? base.width * 1.35 : base.width * 1.05;
            this.ctx.fillRect(-flashSize / 2, -flashSize / 2, flashSize, flashSize);
            this.ctx.globalAlpha = 1;
        }

        // HP bar (adjusted position for larger sprite)
        const baseDisplaySize = base.sprite && this.sprites[base.sprite] ? base.width * 1.3 : base.width;
        this.drawHealthBar(0, -baseDisplaySize / 2 - 14, baseDisplaySize * 0.75, 6, base.hp, base.maxHp, '#ef4444');

        this.ctx.restore();
    }

    drawNPC(npc) {
        this.ctx.save();
        this.ctx.translate(npc.x, npc.y);

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, npc.radius, npc.radius * 0.7, npc.radius * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // NPC sprite
        if (npc.sprite && this.sprites[npc.sprite]) {
            const img = this.sprites[npc.sprite];
            const size = npc.radius * 3.5; // Optimized size for clarity

            // Drop shadow for sprite
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetY = 4;

            // Get sprite config and animate
            const config = getSpriteConfig(npc.sprite);
            if (config) {
                const frameIndex = Math.floor(Date.now() / 120) % config.frames;

                // Draw single frame from sprite sheet
                drawSpriteFrame(
                    this.ctx,
                    img,
                    frameIndex,
                    config.width,
                    config.height,
                    -size / 2,
                    -size / 2,
                    size,
                    size
                );
            } else {
                // Fallback: draw entire sprite
                this.ctx.drawImage(img, -size / 2, -size / 2, size, size);
            }

            // Reset shadow
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
        } else {
            // Fallback: Draw circle with effects
            const color = TEAM_COLORS[npc.team];

            // Glow based on state
            if (npc.state === 'CHASE') {
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 12;
            }

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, npc.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;

            // Border if GUARD
            if (npc.state === 'GUARD') {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, npc.radius + 1, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Inner highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.beginPath();
            this.ctx.arc(-npc.radius * 0.3, -npc.radius * 0.3, npc.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Hit flash overlay
        if (npc.flashTimer > 0) {
            const intensity = Math.min(1, npc.flashTimer / (npc.flashDuration || 0.001));
            this.ctx.globalAlpha = 0.22 + intensity * 0.4;
            this.ctx.fillStyle = '#ffffff';
            const flashRadius = npc.sprite && this.sprites[npc.sprite] ? npc.radius * 1.8 : npc.radius * 1.2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // HP bar (adjusted position for larger sprite)
        if (npc.hp < npc.maxHp) {
            const spriteSize = npc.sprite && this.sprites[npc.sprite] ? npc.radius * 3.5 : npc.radius;
            this.drawHealthBar(0, -spriteSize / 2 - 10, 36, 4, npc.hp, npc.maxHp, TEAM_COLORS[npc.team]);
        }

        this.ctx.restore();
    }

    drawProjectile(projectile) {
        this.ctx.save();

        // Projectile sprite
        if (projectile.sprite && this.sprites[projectile.sprite]) {
            const img = this.sprites[projectile.sprite];
            const size = projectile.radius * 4; // Increased from 3 to 4
            this.ctx.translate(projectile.x, projectile.y);
            this.ctx.rotate(projectile.angle);

            // Glow effect
            this.ctx.shadowColor = projectile.owner === 'player' ? '#fbbf24' : '#f97316';
            this.ctx.shadowBlur = 15;

            this.ctx.drawImage(img, -size / 2, -size / 2, size, size);

            this.ctx.shadowBlur = 0;
        } else {
            // Fallback: Draw circle with trail effect
            const isPlayer = projectile.owner === 'player';
            const color = isPlayer ? '#fbbf24' : '#f97316';

            // Draw trail
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = color;
            const trailLength = 3;
            for (let i = 1; i <= trailLength; i++) {
                const offsetX = -Math.cos(projectile.angle) * i * 3;
                const offsetY = -Math.sin(projectile.angle) * i * 3;
                const alpha = 0.3 * (1 - i / trailLength);
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(projectile.x + offsetX, projectile.y + offsetY, projectile.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Main projectile with glow
            this.ctx.globalAlpha = 1;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Bright core
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        this.ctx.fillStyle = particle.color || '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawCrosshair(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Outer ring with glow
        this.ctx.shadowColor = '#22d3ee';
        this.ctx.shadowBlur = 14;
        this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner ring
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#22d3ee';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.stroke();

        // Cross arms
        const arm = 14;
        const gap = 6;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.beginPath();
        this.ctx.moveTo(-arm, 0);
        this.ctx.lineTo(-gap, 0);
        this.ctx.moveTo(gap, 0);
        this.ctx.lineTo(arm, 0);
        this.ctx.moveTo(0, -arm);
        this.ctx.lineTo(0, -gap);
        this.ctx.moveTo(0, gap);
        this.ctx.lineTo(0, arm);
        this.ctx.stroke();

        // Center dot
        this.ctx.fillStyle = '#22d3ee';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    // ===== UI Elements =====

    drawHealthBar(x, y, width, height, current, max, color) {
        const percent = Math.max(0, Math.min(1, current / max));

        // Background with shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);

        // Inner shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height * 0.4);

        // Fill with gradient
        if (percent > 0) {
            const fillGradient = this.ctx.createLinearGradient(
                x - width / 2, y - height / 2,
                x - width / 2, y + height / 2
            );

            // Color intensity based on HP percentage
            if (percent > 0.5) {
                fillGradient.addColorStop(0, this.lightenColor(color, 0.2));
                fillGradient.addColorStop(1, color);
            } else if (percent > 0.25) {
                fillGradient.addColorStop(0, '#fbbf24');
                fillGradient.addColorStop(1, '#f59e0b');
            } else {
                fillGradient.addColorStop(0, '#ef4444');
                fillGradient.addColorStop(1, '#dc2626');
            }

            this.ctx.fillStyle = fillGradient;
            this.ctx.fillRect(x - width / 2, y - height / 2, width * percent, height);

            // Shine effect on health bar
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x - width / 2, y - height / 2, width * percent, height * 0.4);
        }

        // Border with glow
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);

        // Outer glow
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - width / 2 - 1, y - height / 2 - 1, width + 2, height + 2);
    }

    // ===== Debug Rendering =====

    toggleGrid() {
        this.showGrid = !this.showGrid;
    }

    toggleAggroRadius() {
        this.showAggroRadius = !this.showAggroRadius;
    }

    drawDebugInfo(game) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${Math.round(game.fps)}`, 10, 20);
        this.ctx.fillText(`Entities: ${game.getAllEntities().length}`, 10, 35);
        this.ctx.fillText(`Level: ${game.level}`, 10, 50);
        this.ctx.restore();
    }

    // ===== Sprite Loading =====

    setSprite(key, image) {
        this.sprites[key] = image;
    }

    setSprites(sprites) {
        this.sprites = { ...this.sprites, ...sprites };
    }

    setAssets(assets) {
        // Map asset structure to flat sprite keys for easy access
        this.sprites = {
            // Player sprites
            player_idle: assets.player?.idle,
            player_walk: assets.player?.walk,
            player_run: assets.player?.run,
            player_hurt: assets.player?.hurt,
            player_death: assets.player?.death,

            // Base sprites
            castle_green: assets.bases?.castle_green,
            castle_red: assets.bases?.castle_red,

            // Enemy sprites
            bat: assets.enemies?.bat,
            slime: assets.enemies?.slime,
            big_slime: assets.enemies?.big_slime,
            king_slime: assets.enemies?.king_slime,
            skeleton: assets.enemies?.skeleton,
            zombie: assets.enemies?.zombie,
            ghost: assets.enemies?.ghost,
            demon: assets.enemies?.demon,
            goblin: assets.enemies?.goblin,

            // Projectile sprites
            arrow: assets.projectiles?.arrow,
            cannon: assets.projectiles?.cannon,
            crossbow: assets.projectiles?.crossbow,
            ice: assets.projectiles?.ice,
            lightning: assets.projectiles?.lightning,
            poison: assets.projectiles?.poison,

            // Environment
            tileset: assets.environment?.tileset,
            ground: assets.environment?.ground,
            stone: assets.environment?.stone
        };

        console.log('✅ Renderer assets loaded:', this.sprites);
    }

    // ===== Color Utilities =====

    lightenColor(color, amount) {
        // Simple lighten function for hex colors
        if (color.startsWith('#')) {
            const num = parseInt(color.slice(1), 16);
            const r = Math.min(255, ((num >> 16) & 255) + amount * 255);
            const g = Math.min(255, ((num >> 8) & 255) + amount * 255);
            const b = Math.min(255, (num & 255) + amount * 255);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }

    darkenColor(color, amount) {
        // Simple darken function for hex colors
        if (color.startsWith('#')) {
            const num = parseInt(color.slice(1), 16);
            const r = Math.max(0, ((num >> 16) & 255) - amount * 255);
            const g = Math.max(0, ((num >> 8) & 255) - amount * 255);
            const b = Math.max(0, (num & 255) - amount * 255);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
}
