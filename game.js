const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const healthEl = document.getElementById('health');
const overlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageSub = document.getElementById('message-sub');
const startBtn = document.getElementById('start-btn');

let gameRunning = false;
let score = 0;
let timeLeft = 30;
let health = 100;
let gameInterval;
let timerInterval;
let keys = {};

const creeper = {
    x: 280,
    y: 180,
    size: 32,
    speed: 4,
    color: '#3c8527',
    darkColor: '#1d4213',
    faceColor: '#111111'
};

let diamonds = [];
let cats = [];
let explosions = [];

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    if (e.code === 'Space' && gameRunning) {
        triggerBoom();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

startBtn.addEventListener('click', startGame);

function startGame() {
    score = 0;
    timeLeft = 30;
    health = 100;
    diamonds = [];
    cats = [];
    explosions = [];
    creeper.x = canvas.width / 2 - creeper.size / 2;
    creeper.y = canvas.height / 2 - creeper.size / 2;
    
    updateHUD();
    overlay.style.display = 'none';
    gameRunning = true;

    // Spawn initial items
    for (let i = 0; i < 5; i++) spawnDiamond();
    for (let i = 0; i < 2; i++) spawnCat();

    clearInterval(gameInterval);
    clearInterval(timerInterval);

    gameInterval = setInterval(update, 1000 / 60);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame(true);
        }
        // Spawn cats and diamonds periodically
        if (timeLeft % 3 === 0) spawnCat();
    }, 1000);
}

function spawnDiamond() {
    diamonds.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: Math.random() * (canvas.height - 30) + 15,
        size: 20
    });
}

function spawnCat() {
    cats.push({
        x: Math.random() < 0.5 ? -20 : canvas.width + 20,
        y: Math.random() * canvas.height,
        size: 24,
        speed: 1.5 + Math.random() * 1.5
    });
}

function triggerBoom() {
    // Special ability: Clear nearby cats and get points!
    explosions.push({
        x: creeper.x + creeper.size / 2,
        y: creeper.y + creeper.size / 2,
        radius: 10,
        maxRadius: 100,
        alpha: 1
    });

    cats = cats.filter(cat => {
        let dist = Math.hypot((creeper.x + creeper.size/2) - cat.x, (creeper.y + creeper.size/2) - cat.y);
        if (dist < 100) {
            score += 50;
            return false;
        }
        return true;
    });
    updateHUD();
}

function update() {
    // Movement
    if ((keys['arrowup'] || keys['w']) && creeper.y > 0) creeper.y -= creeper.speed;
    if ((keys['arrowdown'] || keys['s']) && creeper.y < canvas.height - creeper.size) creeper.y += creeper.speed;
    if ((keys['arrowleft'] || keys['a']) && creeper.x > 0) creeper.x -= creeper.speed;
    if ((keys['arrowright'] || keys['d']) && creeper.x < canvas.width - creeper.size) creeper.x += creeper.speed;

    // Diamond collision
    diamonds.forEach((d, index) => {
        let dist = Math.hypot((creeper.x + creeper.size/2) - d.x, (creeper.y + creeper.size/2) - d.y);
        if (dist < creeper.size / 2 + d.size / 2) {
            score += 100;
            diamonds.splice(index, 1);
            spawnDiamond();
            updateHUD();
        }
    });

    // Cat AI (Cats run towards the creeper!)
    cats.forEach((cat, index) => {
        let dx = (creeper.x + creeper.size/2) - cat.x;
        let dy = (creeper.y + creeper.size/2) - cat.y;
        let angle = Math.atan2(dy, dx);
        cat.x += Math.cos(angle) * cat.speed;
        cat.y += Math.sin(angle) * cat.speed;

        // Cat collision with Creeper
        let dist = Math.hypot((creeper.x + creeper.size/2) - cat.x, (creeper.y + creeper.size/2) - cat.y);
        if (dist < creeper.size / 2 + cat.size / 2) {
            health -= 15;
            cats.splice(index, 1);
            spawnCat();
            updateHUD();
            if (health <= 0) {
                endGame(false);
            }
        }
    });

    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background pattern for Minecraft vibe
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw Diamonds
    diamonds.forEach(d => {
        ctx.fillStyle = '#55ffff';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00aaaa';
        ctx.stroke();
    });

    // Draw Cats
    cats.forEach(cat => {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(cat.x - cat.size/2, cat.y - cat.size/2, cat.size, cat.size);
        // Cat ears
        ctx.fillStyle = '#cc8800';
        ctx.fillRect(cat.x - cat.size/2, cat.y - cat.size/2 - 6, 8, 8);
        ctx.fillRect(cat.x + cat.size/2 - 8, cat.y - cat.size/2 - 6, 8, 8);
    });

    // Draw Explosions
    explosions.forEach((exp, index) => {
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 0, ${exp.alpha})`;
        ctx.fill();
        exp.radius += 4;
        exp.alpha -= 0.05;
        if (exp.alpha <= 0) {
            explosions.splice(index, 1);
        }
    });

    // Draw Creeper
    ctx.fillStyle = creeper.color;
    ctx.fillRect(creeper.x, creeper.y, creeper.size, creeper.size);
    ctx.lineWidth = 2;
    ctx.strokeStyle = creeper.darkColor;
    ctx.strokeRect(creeper.x, creeper.y, creeper.size, creeper.size);

    // Creeper Face
    ctx.fillStyle = creeper.faceColor;
    // Left eye
    ctx.fillRect(creeper.x + 6, creeper.y + 6, 6, 6);
    // Right eye
    ctx.fillRect(creeper.x + 20, creeper.y + 6, 6, 6);
    // Nose
    ctx.fillRect(creeper.x + 12, creeper.y + 14, 8, 10);
    // Mouth
    ctx.fillRect(creeper.x + 9, creeper.y + 20, 5, 8);
    ctx.fillRect(creeper.x + 18, creeper.y + 20, 5, 8);
}

function updateHUD() {
    scoreEl.textContent = score;
    healthEl.textContent = Math.max(0, health);
}

function endGame(won) {
    gameRunning = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);

    overlay.style.display = 'flex';
    if (won) {
        messageTitle.textContent = "SSSS... VICTORY!";
        messageSub.textContent = `You survived and gathered awesome loot! Final Score: ${score}`;
    } else {
        messageTitle.textContent = "AWW MAN! (YOU DIED)";
        messageSub.textContent = `Cats got the best of you! Final Score: ${score}`;
    }
    startBtn.textContent = "PLAY AGAIN";
}