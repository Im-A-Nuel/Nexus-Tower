/**
 * input.js - Input Manager
 * Handles keyboard and mouse input
 */

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Keyboard state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            f: false,
            escape: false,
            g: false, // Debug grid toggle
            r: false  // Range overlay toggle
        };

        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            worldX: 0,
            worldY: 0
        };

        // Previous frame state (untuk detect key press/release events)
        this.prevKeys = { ...this.keys };

        // Bind event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Prevent right-click context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Prevent space bar scrolling
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();

        switch (key) {
            case 'w': this.keys.w = true; break;
            case 'a': this.keys.a = true; break;
            case 's': this.keys.s = true; break;
            case 'd': this.keys.d = true; break;
            case ' ': this.keys.space = true; break;
            case 'f': this.keys.f = true; break;
            case 'escape': this.keys.escape = true; break;
            case 'g': this.keys.g = true; break;
            case 'r': this.keys.r = true; break;
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();

        switch (key) {
            case 'w': this.keys.w = false; break;
            case 'a': this.keys.a = false; break;
            case 's': this.keys.s = false; break;
            case 'd': this.keys.d = false; break;
            case ' ': this.keys.space = false; break;
            case 'f': this.keys.f = false; break;
            case 'escape': this.keys.escape = false; break;
            case 'g': this.keys.g = false; break;
            case 'r': this.keys.r = false; break;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;

        // World coordinates (same as canvas coordinates in this case)
        this.mouse.worldX = this.mouse.x;
        this.mouse.worldY = this.mouse.y;
    }

    handleMouseDown(e) {
        this.mouse.down = true;
    }

    handleMouseUp(e) {
        this.mouse.down = false;
    }

    // Update method - dipanggil setiap frame untuk tracking state changes
    update() {
        // Copy current state to previous state
        this.prevKeys = { ...this.keys };
    }

    // Helper methods untuk detect key events

    /**
     * Check if key is currently pressed
     */
    isKeyDown(key) {
        return this.keys[key] || false;
    }

    /**
     * Check if key was just pressed this frame
     */
    isKeyPressed(key) {
        return this.keys[key] && !this.prevKeys[key];
    }

    /**
     * Check if key was just released this frame
     */
    isKeyReleased(key) {
        return !this.keys[key] && this.prevKeys[key];
    }

    /**
     * Get movement vector dari WASD keys
     */
    getMovementVector() {
        const x = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const y = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        return { x, y };
    }

    /**
     * Check if shoot button is pressed (mouse atau space)
     */
    isShootPressed() {
        return this.mouse.down || this.keys.space;
    }

    /**
     * Get mouse position
     */
    getMousePosition() {
        return {
            x: this.mouse.worldX,
            y: this.mouse.worldY
        };
    }

    /**
     * Reset all input states
     */
    reset() {
        // Reset keyboard
        for (let key in this.keys) {
            this.keys[key] = false;
            this.prevKeys[key] = false;
        }

        // Reset mouse
        this.mouse.down = false;
    }
}
