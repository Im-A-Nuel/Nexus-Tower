/**
 * level.js - Level Generator
 * Handles level generation and difficulty scaling
 */

import { EnemyBase } from './base.js';
import { NPC } from './npc.js';
import { TEAMS, random, randomInt, clamp, distance } from './utils.js';

// Difficulty presets
export const DIFFICULTIES = {
    easy: {
        baseMin: 1,
        baseMax: 2,
        guardsPerBase: 1,
        npcHpMultiplier: 0.65,
        npcDamageMultiplier: 0.65,
        aggroRadius: 150
    },
    normal: {
        baseMin: 2,
        baseMax: 3,
        guardsPerBase: 1,
        npcHpMultiplier: 0.8,
        npcDamageMultiplier: 0.8,
        aggroRadius: 170
    },
    hard: {
        baseMin: 2,
        baseMax: 3,
        guardsPerBase: 2,
        npcHpMultiplier: 0.95,
        npcDamageMultiplier: 0.95,
        aggroRadius: 190
    },
    insane: {
        baseMin: 3,
        baseMax: 4,
        guardsPerBase: 3,
        npcHpMultiplier: 1.15,
        npcDamageMultiplier: 1.1,
        aggroRadius: 210
    }
};

export class LevelGenerator {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.difficulty = DIFFICULTIES.normal;
    }

    /**
     * Set difficulty
     */
    setDifficulty(difficultyName) {
        if (DIFFICULTIES[difficultyName]) {
            this.difficulty = DIFFICULTIES[difficultyName];
        }
    }

    /**
     * Generate level (returns bases and NPCs)
     */
    generateLevel(level) {
        const bases = [];
        const npcs = [];

        // Calculate number of bases based on level and difficulty
        const baseCount = clamp(
            this.difficulty.baseMin + Math.floor((level - 1) / 2),
            this.difficulty.baseMin,
            this.difficulty.baseMax
        );

        // Generate enemy bases
        const enemyTeams = [TEAMS.RED, TEAMS.BLUE, TEAMS.GREEN];
        const positions = this.generateBasePositions(baseCount);

        for (let i = 0; i < baseCount; i++) {
            const pos = positions[i];
            const team = enemyTeams[i % enemyTeams.length];

            // Create base
            const base = new EnemyBase(pos.x, pos.y, team, level);
            base.aggroRadius = this.difficulty.aggroRadius;
            bases.push(base);

            // Create guards for this base
            const guardCount = clamp(
                this.difficulty.guardsPerBase + Math.floor((level - 1) / 3),
                1,
                4
            );

            for (let g = 0; g < guardCount; g++) {
                const anchor = base.getGuardAnchor(g);
                const npc = this.createNPC(
                    anchor.x,
                    anchor.y,
                    team,
                    base,
                    level
                );
                npc.anchorX = anchor.x;
                npc.anchorY = anchor.y;

                npcs.push(npc);
                base.guards.push(npc);
            }
        }

        return { bases, npcs };
    }

    /**
     * Generate positions untuk enemy bases (tidak overlap)
     */
    generateBasePositions(count) {
        const positions = [];
        const minDistance = 280; // Min distance between bases
        const minFromLeft = 520; // Min distance from left side (player area)

        // Safe area for bases (right side of map)
        const leftX = Math.floor(this.width * 0.56);
        const rightX = this.width - 60;
        const topY = 80;
        const bottomY = this.height - 80;

        let attempts = 0;
        const maxAttempts = 50;

        while (positions.length < count && attempts < maxAttempts * count) {
            attempts++;

            // Random position
            const x = random(leftX, rightX);
            const y = random(topY, bottomY);

            // Check distance from left side
            if (x < minFromLeft) continue;

            // Check distance from other bases
            let valid = true;
            for (const pos of positions) {
                if (distance(x, y, pos.x, pos.y) < minDistance) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                positions.push({ x, y });
            }
        }

        // If couldn't place all bases, use grid fallback
        while (positions.length < count) {
            const i = positions.length;
            const x = leftX + (i % 2) * ((rightX - leftX) / 2) + random(-20, 20);
            const y = topY + Math.floor(i / 2) * 140 + random(-20, 20);
            positions.push({ x, y });
        }

        return positions;
    }

    /**
     * Create NPC dengan difficulty scaling
     */
    createNPC(x, y, team, base, level) {
        const npc = new NPC(x, y, team, base, level);

        // Apply difficulty multipliers
        npc.hp = Math.round(npc.hp * this.difficulty.npcHpMultiplier);
        npc.maxHp = npc.hp;
        npc.damage = Math.round(npc.damage * this.difficulty.npcDamageMultiplier);
        npc.senseRadius = this.difficulty.aggroRadius;

        return npc;
    }

    /**
     * Get level info
     */
    getLevelInfo(level) {
        const baseCount = clamp(
            this.difficulty.baseMin + Math.floor((level - 1) / 2),
            this.difficulty.baseMin,
            this.difficulty.baseMax
        );

        const guardCount = clamp(
            this.difficulty.guardsPerBase + Math.floor((level - 1) / 3),
            1,
            4
        );

        return {
            level,
            bases: baseCount,
            guardsPerBase: guardCount,
            totalEnemies: baseCount * guardCount
        };
    }
}
