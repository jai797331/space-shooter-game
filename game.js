// DOM
const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const timeEl = document.getElementById("time");
const targetEl = document.getElementById("target");

const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");

// Game vars
let gameRunning = false;
let score = 0;
let level = 1;
let enemySpeed = 3;
let enemiesPerLevel = 10;
let enemiesKilled = 0;

let timeLeft = 30;           // seconds (countdown)
let targetScore = 100;      // target score to win

// intervals
let spawnInterval = null;
let timerInterval = null;

// initialize HUD values
scoreEl.textContent = score;
levelEl.textContent = level;
timeEl.textContent = timeLeft;
targetEl.textContent = targetScore;

// small starfield — visual only
function createStars() {
    for (let i = 0; i < 80; i++) {
        let s = document.createElement("div");
        s.className = "star";
        s.style.left = Math.random() * window.innerWidth + "px";
        s.style.top = Math.random() * window.innerHeight + "px";
        s.style.animationDuration = (6 + Math.random() * 8) + "s";
        s.style.opacity = (0.3 + Math.random() * 0.8);
        gameArea.appendChild(s);
    }
}
createStars();

// center player position variable (keeps movement consistent)
let playerX = window.innerWidth / 2;
window.addEventListener("load", () => {
    // sync with actual player position if available
    playerX = player.offsetLeft || (window.innerWidth / 2);
    player.style.left = playerX + "px";
});

// START GAME (press Enter)
document.addEventListener("keydown", e => {
    if (!gameRunning && e.key === "Enter") {
        startScreen.classList.add("hidden");
        endScreen.classList.add("hidden");
        startGame();
    }
});

// player movement & shooting (Up = shoot)
document.addEventListener("keydown", e => {
    if (!gameRunning) return;

    if (e.key === "ArrowLeft") {
        playerX = Math.max(10, playerX - 30);
        player.style.left = playerX + "px";
    }
    if (e.key === "ArrowRight") {
        playerX = Math.min(window.innerWidth - 30, playerX + 30);
        player.style.left = playerX + "px";
    }
    if (e.key === "ArrowUp") {
        shoot();
    }
});

// startGame setups
function startGame() {
    // reset variables
    score = 0;
    level = 1;
    enemySpeed = 3;
    enemiesKilled = 0;
    timeLeft = 30;
    targetScore = parseInt(targetEl.textContent) || 100;

    scoreEl.textContent = score;
    levelEl.textContent = level;
    timeEl.textContent = timeLeft;
    targetEl.textContent = targetScore;

    gameRunning = true;

    // start countdown
    timerInterval = setInterval(() => {
        if (!gameRunning) { clearInterval(timerInterval); return; }
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame("⏳ TIME'S UP — GAME OVER");
        }
    }, 1000);

    // start spawning enemies
    startSpawning();
}

// spawn enemies every X ms (speed depends on level)
function startSpawning() {
    if (spawnInterval) clearInterval(spawnInterval);

    // spawn faster as level increases — base delay reduced by level
    let baseDelay = Math.max(350, 1000 - (level - 1) * 100);

    spawnInterval = setInterval(() => {
        if (!gameRunning) { clearInterval(spawnInterval); return; }
        spawnEnemy();
    }, baseDelay);
}

// create an enemy and make it fall
function spawnEnemy() {
    const enemy = document.createElement("div");
    enemy.className = "enemy";
    enemy.style.left = Math.random() * (window.innerWidth - 50) + "px";
    enemy.style.top = "0px";
    gameArea.appendChild(enemy);

    const fallInterval = setInterval(() => {
        if (!gameRunning) { clearInterval(fallInterval); return; }

        enemy.style.top = parseInt(enemy.style.top || 0) + enemySpeed + "px";

        // enemy reached bottom -> game over
        if (parseInt(enemy.style.top) > window.innerHeight - 80) {
            clearInterval(fallInterval);
            enemy.remove();
            endGame("💥 ENEMY REACHED YOU — GAME OVER");
        }
    }, 30);
}

// shooting logic
let lastShot = 0;
function shoot() {
    const now = Date.now();
    if (now - lastShot < 160) return; // small cooldown
    lastShot = now;

    const bullet = document.createElement("div");
    bullet.className = "bullet";
    bullet.style.left = (playerX + 12) + "px";
    bullet.style.bottom = "70px";
    gameArea.appendChild(bullet);

    const move = setInterval(() => {
        if (!gameRunning) { clearInterval(move); if (bullet.parentNode) bullet.remove(); return; }

        bullet.style.bottom = (parseInt(bullet.style.bottom || 0) + 12) + "px";

        // collision check with enemies
        document.querySelectorAll(".enemy").forEach(enemy => {
            if (!bullet.parentNode || !enemy.parentNode) return;
            if (isColliding(bullet, enemy)) {
                // remove both
                try { bullet.remove(); } catch(e){}
                try { enemy.remove(); } catch(e){}

                clearInterval(move);

                score += 10;
                enemiesKilled++;
                scoreEl.textContent = score;

                // level up when killed enough enemies
                if (enemiesKilled >= enemiesPerLevel) {
                    level++;
                    enemiesKilled = 0;
                    enemySpeed += 1;
                    levelEl.textContent = level;

                    // respawn speed updated
                    startSpawning();
                }

                // win condition
                if (score >= targetScore) {
                    winGame();
                }
            }
        });

        // remove bullet if off-screen
        if (parseInt(bullet.style.bottom) > window.innerHeight) {
            clearInterval(move);
            try { bullet.remove(); } catch(e){}
        }
    }, 25);
}

// collision helper
function isColliding(a, b) {
    const r1 = a.getBoundingClientRect();
    const r2 = b.getBoundingClientRect();
    return !(r1.bottom < r2.top || r1.top > r2.bottom || r1.right < r2.left || r1.left > r2.right);
}

// end game (loss)
function endGame(msg) {
    if (!gameRunning) return;
    gameRunning = false;

    // stop intervals
    if (spawnInterval) clearInterval(spawnInterval);
    if (timerInterval) clearInterval(timerInterval);

    // clear objects
    document.querySelectorAll(".enemy").forEach(e => e.remove());
    document.querySelectorAll(".bullet").forEach(b => b.remove());

    endScreen.textContent = msg + "  — PRESS ENTER TO RESTART";
    endScreen.classList.remove("hidden");
    startScreen.classList.add("hidden");
}

// win game
function winGame() {
    if (!gameRunning) return;
    gameRunning = false;

    if (spawnInterval) clearInterval(spawnInterval);
    if (timerInterval) clearInterval(timerInterval);

    document.querySelectorAll(".enemy").forEach(e => e.remove());
    document.querySelectorAll(".bullet").forEach(b => b.remove());

    endScreen.textContent = "🏆 YOU WIN!  — PRESS ENTER TO PLAY AGAIN";
    endScreen.classList.remove("hidden");
    startScreen.classList.add("hidden");
}

