/**
 * utils.js - Utility Functions
 * Helper functions untuk math, collision detection, dan utilities lainnya
 */

// ===== Math Utilities =====

/**
 * Clamp nilai antara min dan max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Random number antara min dan max
 */
export function random(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Random integer antara min dan max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Normalize vector (x, y) menjadi unit vector
 */
export function normalize(x, y) {
    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    return {
        x: x / length,
        y: y / length
    };
}

/**
 * Distance antara dua point (squared, lebih cepat)
 */
export function distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * Distance antara dua point (actual distance)
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt(distanceSquared(x1, y1, x2, y2));
}

/**
 * Angle dari (x1, y1) ke (x2, y2) dalam radian
 */
export function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Rotate point (x, y) around origin by angle (in radians)
 */
export function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos
    };
}

// ===== Collision Detection =====

/**
 * Circle-Circle collision detection
 */
export function circleCollision(x1, y1, r1, x2, y2, r2) {
    const distSq = distanceSquared(x1, y1, x2, y2);
    const radiusSum = r1 + r2;
    return distSq <= radiusSum * radiusSum;
}

/**
 * Circle-Rectangle collision detection
 */
export function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
    // Find closest point on rectangle to circle center
    const closestX = clamp(cx, rx - rw / 2, rx + rw / 2);
    const closestY = clamp(cy, ry - rh / 2, ry + rh / 2);

    // Calculate distance from circle center to closest point
    const distSq = distanceSquared(cx, cy, closestX, closestY);

    return distSq <= radius * radius;
}

/**
 * Point-Rectangle collision (AABB)
 */
export function pointRectCollision(px, py, rx, ry, rw, rh) {
    return (
        px >= rx - rw / 2 &&
        px <= rx + rw / 2 &&
        py >= ry - rh / 2 &&
        py <= ry + rh / 2
    );
}

/**
 * Rectangle-Rectangle collision (AABB)
 */
export function rectRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 - w1 / 2 < x2 + w2 / 2 &&
        x1 + w1 / 2 > x2 - w2 / 2 &&
        y1 - h1 / 2 < y2 + h2 / 2 &&
        y1 + h1 / 2 > y2 - h2 / 2
    );
}

/**
 * Distance dari point (px, py) ke rectangle (centered)
 */
export function pointRectDistance(px, py, rx, ry, rw, rh) {
    const dx = Math.max(Math.abs(px - rx) - rw / 2, 0);
    const dy = Math.max(Math.abs(py - ry) - rh / 2, 0);
    return Math.hypot(dx, dy);
}

// ===== Array Utilities =====

/**
 * Remove item dari array
 */
export function removeFromArray(array, item) {
    const index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ===== DOM Utilities =====

/**
 * Get element by ID (dengan error handling)
 */
export function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id "${id}" not found!`);
    }
    return element;
}

/**
 * Show/Hide element
 */
export function showElement(element, show = true) {
    if (!element) return;
    if (show) {
        element.classList.add('active');
    } else {
        element.classList.remove('active');
    }
}

// ===== Image Loading =====

/**
 * Load single image
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Load multiple images
 */
export async function loadImages(sources) {
    const promises = Object.entries(sources).map(async ([key, src]) => {
        const img = await loadImage(src);
        return [key, img];
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results);
}

// ===== Animation Frame Utilities =====

/**
 * Parse sprite sheet menjadi frames
 */
export function parseSpriteSheet(image, frameWidth, frameHeight, frameCount) {
    const frames = [];
    const cols = Math.floor(image.width / frameWidth);

    for (let i = 0; i < frameCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        frames.push({
            x: col * frameWidth,
            y: row * frameHeight,
            width: frameWidth,
            height: frameHeight
        });
    }

    return frames;
}

// ===== Debugging =====

/**
 * Draw debug circle
 */
export function debugCircle(ctx, x, y, radius, color = 'rgba(255, 0, 0, 0.3)') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

/**
 * Draw debug rectangle
 */
export function debugRect(ctx, x, y, width, height, color = 'rgba(255, 0, 0, 0.3)') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    ctx.restore();
}

/**
 * Draw debug text
 */
export function debugText(ctx, text, x, y, color = '#ffffff') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '12px monospace';
    ctx.fillText(text, x, y);
    ctx.restore();
}

// ===== Constants Export =====

export const TEAMS = {
    PLAYER: 'player',
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green'
};

export const TEAM_COLORS = {
    [TEAMS.PLAYER]: '#22d3ee',
    [TEAMS.RED]: '#ef4444',
    [TEAMS.BLUE]: '#3b82f6',
    [TEAMS.GREEN]: '#22c55e'
};

export const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_UP: 'levelup',
    GAME_OVER: 'gameover'
};
