const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const mapImage = new Image();
mapImage.src = 'gamemap.png'; // Pastikan path ini benar sesuai struktur folder Anda

// Waypoints dari Tiled JSON (contoh)
const waypoints = [
    {x: 0, y: 384}, {x: 256, y: 384}, {x: 256, y: 128}, {x: 768, y: 128},
    {x: 768, y: 640}, {x: 1024, y: 640}, {x: 1024, y: 384}, {x: 1280, y: 384}
];

// PENTING: Pindahkan definisi class PlacementTile ke sini (sebelum dipanggil)
class PlacementTile {
    constructor(position) {
        this.position = position;
        this.size = 64;
        this.occupied = false;
    }
    draw() {
        ctx.fillStyle = this.occupied ? 'rgba(0,255,0,0.3)' : 'rgba(255,255,255,0.15)';
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);
    }
}

// Data untuk tile penempatan tower (contoh)
const placementTilesData2D = Array.from({length: 12}, () => Array(20).fill(0));
const placementTiles = [];
placementTilesData2D[5] = [0, 0, 14, 14, 0, 0, 0, 14, 14, 0, 0, 14, 14, 0, 0, 0, 0, 0, 0, 0];
placementTilesData2D[2] = [0, 0, 0, 0, 0, 0, 0, 14, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

placementTilesData2D.forEach((row, y) => {
    row.forEach((symbol, x) => {
        if (symbol === 14) placementTiles.push(new PlacementTile({x: x*64, y: y*64})); // Sekarang ini seharusnya berfungsi
    });
});


// Definisi class Tower, Projectile, Enemy, Particle, dan Global Variables lainnya tetap di bawah ini
class Tower {
    constructor(position) {
        this.position = {...position};
        this.width = 128; this.height = 64;
        this.center = {x: position.x + 64, y: position.y + 32};
        this.radius = 250; this.damage = 20; this.fireRate = 100; this.frames = 0;
        this.level = 1; this.type = 'basic';
        this.projectiles = [];
        this.target = null;
    }
    draw() {
        ctx.fillStyle = this.level === 1 ? 'blue' : 'purple';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        // Defense radius clip
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,0,255,0.1)';
        ctx.fill();
    }
    update() {
        this.draw();
        this.frames++;
        if (this.frames % this.fireRate === 0 && this.target) {
            this.projectiles.push(new Projectile(this.center, this.target, this.damage, this.type));
        }
    }
    evolve() {
        if (essence >= 50 && this.level < 3) {
            essence -= 50;
            this.level++;
            this.damage *= 1.5; this.radius += 50; this.fireRate /= 1.2;
            this.type = 'laser';
            // Animasi scale
            this.width *= 1.2; this.height *= 1.2; this.center.x += 10; this.center.y += 5;
        }
    }
}

class Projectile {
    constructor(position, enemy, damage, type) {
        this.position = {...position};
        this.enemy = enemy;
        this.radius = 10; this.speed = 5; this.damage = damage; this.type = type;
    }
    draw() {
        if (this.type === 'basic') {
            ctx.beginPath(); ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2);
            ctx.fillStyle = 'orange'; ctx.fill();
        } else {  // Laser beam
            ctx.beginPath(); ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.enemy.center.x, this.enemy.center.y);
            const grad = ctx.createLinearGradient(this.position.x, this.position.y, this.enemy.center.x, this.enemy.center.y);
            grad.addColorStop(0, 'red'); grad.addColorStop(1, 'yellow');
            ctx.strokeStyle = grad; ctx.lineWidth = 5; ctx.stroke();
        }
    }
    update() {
        const angle = Math.atan2(this.enemy.center.y - this.position.y, this.enemy.center.x - this.position.x);
        this.position.x += Math.cos(angle) * this.speed;
        this.position.y += Math.sin(angle) * this.speed;
        this.draw();
    }
}

class Enemy {
    constructor(position) {
        this.position = {...position};
        this.width = 50; this.height = 50; this.center = {x: position.x + 25, y: position.y + 25};
        this.health = 100; this.speed = 2; this.waypointIndex = 0;
    }
    draw() {
        ctx.fillStyle = this.speed > 2 ? 'red' : 'green'; 
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        // Health bar
        ctx.fillStyle = 'red'; ctx.fillRect(this.position.x, this.position.y - 10, 50, 5);
        ctx.fillStyle = 'green'; ctx.fillRect(this.position.x, this.position.y - 10, 50 * (this.health / 100), 5);
    }
    update() {
        const waypoint = waypoints[this.waypointIndex];
        const xDist = waypoint.x - this.center.x;
        const yDist = waypoint.y - this.center.y;
        const angle = Math.atan2(yDist, xDist);
        this.position.x += Math.cos(angle) * this.speed;
        this.position.y += Math.sin(angle) * this.speed;
        this.center = {x: this.position.x + 25, y: this.position.y + 25};
        if (Math.hypot(xDist, yDist) < this.speed) this.waypointIndex++;
        if (this.waypointIndex >= waypoints.length) {
            nexusHP -= 10; 
            if (nexusHP <= 50) gameOver = true; 
            const index = enemies.indexOf(this);
            if (index > -1) enemies.splice(index, 1);
        }
        this.draw();
    }
    evolve() {
        this.speed *= 1.2; this.health *= 1.3;
    }
}

class Particle {
    constructor(position) {
        this.position = position; this.radius = Math.random() * 10 + 5;
        this.velocity = {x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10};
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath(); ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = 'orange'; ctx.fill();
        ctx.restore();
    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.alpha -= 0.01;
        this.draw();
    }
}

// Global Variables
let enemies = [], towers = [], particles = [];
let essence = 100, nexusHP = 100, wave = 1, gameOver = false;
let activeTile = undefined;
const mouse = {x: 0, y: 0};

canvas.addEventListener('mousemove', e => { 
    mouse.x = e.offsetX; 
    mouse.y = e.offsetY;
    
    activeTile = null;
    for (const tile of placementTiles) {
        if (mouse.x > tile.position.x && mouse.x < tile.position.x + tile.size &&
            mouse.y > tile.position.y && mouse.y < tile.position.y + tile.size) {
            activeTile = tile;
            break;
        }
    }
});

canvas.addEventListener('click', () => {
    if (activeTile && !activeTile.occupied && essence >= 50) {
        essence -= 50;
        towers.push(new Tower(activeTile.position));
        activeTile.occupied = true;
    } else {
        // Logika untuk evolve tower yang sudah ada
        for(const tower of towers) {
             if (mouse.x > tower.position.x && mouse.x < tower.position.x + tower.width &&
                 mouse.y > tower.position.y && mouse.y < tower.position.y + tower.height) {
                 tower.evolve();
             }
        }
    }
});

// Spawn waves
function spawnWave() {
    for (let i = 0; i < wave * 3; i++) {
        const offset = i * -150; // Jarak antar musuh
        enemies.push(new Enemy({x: waypoints[0].x + offset, y: waypoints[0].y}));
    }
    if (wave > 5) enemies.forEach(e => e.evolve());
    document.getElementById('wave').innerText = wave;
    wave++;
}

// Animation loop
function animate() {
    if (gameOver) {
        document.getElementById('gameOver').style.display = 'flex';
        return;
    }
    requestAnimationFrame(animate);
    ctx.drawImage(mapImage, 0, 0);
    
    placementTiles.forEach(t => t.draw());

    towers.forEach(t => {
        t.update();
        // Target selection
        const validEnemies = enemies.filter(e => Math.hypot(e.center.x - t.center.x, e.center.y - t.center.y) < t.radius);
        t.target = validEnemies[0];

        for (let i = t.projectiles.length - 1; i >= 0; i--) {
            const p = t.projectiles[i];
            p.update();
            const dist = Math.hypot(p.position.x - p.enemy.center.x, p.position.y - p.enemy.center.y);
            if (dist < p.enemy.width / 2) {
                p.enemy.health -= p.damage;
                if (p.enemy.health <= 0) {
                    const idx = enemies.indexOf(p.enemy);
                    if (idx > -1) {
                         enemies.splice(idx, 1);
                         essence += 25; 
                    }
                    for (let k = 0; k < 10; k++) particles.push(new Particle(p.position));
                }
                t.projectiles.splice(i, 1);
            }
        }
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update();
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) particles.splice(i, 1);
    }
    
    // Update UI
    document.getElementById('essence').innerText = essence;
    document.getElementById('nexusHP').innerText = nexusHP;
    
    // Check win condition
    if (wave > 11 && enemies.length === 0) {
        if (nexusHP > 50 && towers.filter(t => t.level > 1).length >= 5) {
            alert('You Win!');
            gameOver = true;
        } else {
             gameOver = true; 
        }
    }
}

mapImage.onload = () => {
    animate();
    spawnWave();
    setInterval(spawnWave, 15000); // Gelombang baru setiap 15 detik
};