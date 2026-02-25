// SNAKE MINIMAL - Clean Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const modalBackdrop = document.getElementById('modalBackdrop');
const finalScoreElement = document.getElementById('finalScore');
const newRecordElement = document.getElementById('newRecord');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const tempoBtns = document.querySelectorAll('.tempo-btn');

// Game config
const gridSize = 18;
const tileCountX = Math.floor(canvas.width / gridSize);
const tileCountY = Math.floor(canvas.height / gridSize);

// Game state
let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeMinimalHighScore') || 0;
let gameLoop = null;
let isGameRunning = false;
let isPaused = false;
let gameSpeed = 100;
let isNewRecord = false;
let foodParticles = [];

// Display high score
highScoreElement.textContent = highScore;

// Initialize snake
function initSnake() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
}

// Generate food
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
    createFoodParticles(food.x, food.y);
}

// Create food particles
function createFoodParticles(x, y) {
    foodParticles = [];
    for (let i = 0; i < 6; i++) {
        foodParticles.push({
            x: x * gridSize + gridSize / 2,
            y: y * gridSize + gridSize / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            color: `hsla(${160 + Math.random() * 40}, 70%, 60%, ${0.3 + Math.random() * 0.3})`
        });
    }
}

// Update particles
function updateParticles() {
    foodParticles = foodParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        return p.life > 0;
    });
}

// Draw particles
function drawParticles() {
    foodParticles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#f8f6f3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid
    ctx.strokeStyle = 'rgba(45, 45, 45, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw food (soft circle with glow)
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255, 139, 122, 0.4)';
    ctx.fillStyle = '#ff8b7a';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw particles
    updateParticles();
    drawParticles();
    
    // Draw snake
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        if (isHead) {
            // Head - teal with soft shadow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(93, 212, 196, 0.3)';
            ctx.fillStyle = '#5dd4c4';
        } else {
            // Body - gradient fade
            ctx.shadowBlur = 0;
            const alpha = 1 - (index / snake.length) * 0.4;
            ctx.fillStyle = `rgba(184, 230, 213, ${alpha})`;
        }
        
        // Rounded rectangle
        const padding = 3;
        const radius = 6;
        const x = segment.x * gridSize + padding;
        const y = segment.y * gridSize + padding;
        const w = gridSize - padding * 2;
        const h = gridSize - padding * 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
        
        // Eyes for head
        if (isHead) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#2d2d2d';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (direction.x === 1) {
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, segment.y * gridSize + 5, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, segment.y * gridSize + gridSize - 8, eyeSize, eyeSize);
            } else if (direction.x === -1) {
                ctx.fillRect(segment.x * gridSize + eyeOffset - 1, segment.y * gridSize + 5, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + eyeOffset - 1, segment.y * gridSize + gridSize - 8, eyeSize, eyeSize);
            } else if (direction.y === -1) {
                ctx.fillRect(segment.x * gridSize + 5, segment.y * gridSize + eyeOffset - 1, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - 8, segment.y * gridSize + eyeOffset - 1, eyeSize, eyeSize);
            } else {
                ctx.fillRect(segment.x * gridSize + 5, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - 8, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
            }
        }
    });
    
    ctx.shadowBlur = 0;
}

// Update game state
function update() {
    if (isPaused) return;
    
    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver();
        return;
    }
    
    // Self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

// Game step
function gameStep() {
    update();
    draw();
}

// Game over
function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeMinimalHighScore', highScore);
        highScoreElement.textContent = highScore;
        isNewRecord = true;
        newRecordElement.style.display = 'inline-flex';
    } else {
        isNewRecord = false;
        newRecordElement.style.display = 'none';
    }
    
    finalScoreElement.textContent = score;
    modalBackdrop.style.display = 'flex';
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
}

// Reset game
function resetGame() {
    initSnake();
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = '0';
    gameSpeed = parseInt(document.querySelector('.tempo-btn.active').dataset.speed);
    modalBackdrop.style.display = 'none';
    startBtn.style.display = 'flex';
    startBtn.querySelector('.btn-text').textContent = 'start';
    startBtn.querySelector('.btn-icon').textContent = '▶';
    pauseBtn.style.display = 'flex';
    pauseBtn.querySelector('.btn-text').textContent = 'pause';
    pauseBtn.querySelector('.btn-icon').textContent = '⏸';
    isPaused = false;
    generateFood();
    draw();
}

// Start game
function startGame() {
    if (isGameRunning) {
        togglePause();
    } else {
        isGameRunning = true;
        isPaused = false;
        startBtn.querySelector('.btn-text').textContent = 'running';
        startBtn.querySelector('.btn-icon').textContent = '⏸';
        pauseBtn.style.display = 'flex';
        gameLoop = setInterval(gameStep, gameSpeed);
    }
}

// Toggle pause
function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.querySelector('.btn-text').textContent = 'resume';
        pauseBtn.querySelector('.btn-icon').textContent = '▶';
    } else {
        pauseBtn.querySelector('.btn-text').textContent = 'pause';
        pauseBtn.querySelector('.btn-icon').textContent = '⏸';
    }
}

// Show difficulty
function showDifficulty() {
    modalBackdrop.style.display = 'none';
    startBtn.style.display = 'flex';
    startBtn.querySelector('.btn-text').textContent = 'start';
}

// Tempo buttons
tempoBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        tempoBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        gameSpeed = parseInt(this.dataset.speed);
    });
});

// Keyboard controls
document.addEventListener('keydown', function(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    
    if (e.code === 'Space') {
        if (isGameRunning) {
            togglePause();
        } else if (modalBackdrop.style.display === 'none') {
            startGame();
        }
        return;
    }
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction.x !== -1) {
            nextDirection = { x: 1, y: 0 };
        } else if (dx < 0 && direction.x !== 1) {
            nextDirection = { x: -1, y: 0 };
        }
    } else {
        if (dy > 0 && direction.y !== -1) {
            nextDirection = { x: 0, y: 1 };
        } else if (dy < 0 && direction.y !== 1) {
            nextDirection = { x: 0, y: -1 };
        }
    }
}, { passive: false });

// Button events
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// Initialize
initSnake();
generateFood();
draw();

console.log('🐍 Snake Minimal loaded');
