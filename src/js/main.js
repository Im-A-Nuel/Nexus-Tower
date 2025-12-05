/**
 * main.js - Entry Point
 * Initialize game and start
 */

import { Game } from './game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Nexus Tower Defender - Starting...');

    // Get canvas
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Create game instance
    window.game = new Game(canvas);

    console.log('✅ Game initialized successfully!');
    console.log('📋 Controls:');
    console.log('  - W A S D: Move');
    console.log('  - SPACE / Click: Shoot');
    console.log('  - F: Dash');
    console.log('  - ESC: Pause');
    console.log('  - G: Toggle Grid (Debug)');

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent spacebar scrolling
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
});

// Handle window resize (optional - untuk responsive)
window.addEventListener('resize', () => {
    // Could implement canvas scaling here if needed
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            // Tab is hidden - could auto-pause here
            if (window.game.state === 'playing') {
                window.game.pauseGame();
            }
        }
    }
});

console.log('🚀 Nexus Tower Defender loaded!');
