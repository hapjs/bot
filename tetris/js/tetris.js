// TETRIS NEON - Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const boardOverlay = document.getElementById('boardOverlay');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');
const finalLinesElement = document.getElementById('finalLines');
const highscoreDisplay = document.getElementById('highscoreDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_BLOCK_SIZE = 25;

// Tetromino definitions with neon colors
const TETROMINOES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f5ff',
        glow: '0 0 10px rgba(0, 245, 255, 0.8)'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00',
        glow: '0 0 10px rgba(255, 255, 0, 0.8)'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#bd00ff',
        glow: '0 0 10px rgba(189, 0, 255, 0.8)'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00ff00',
        glow: '0 0 10px rgba(0, 255, 0, 0.8)'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#ff0044',
        glow: '0 0 10px rgba(255, 0, 68, 0.8)'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0066ff',
        glow: '0 0 10px rgba(0, 102, 255, 0.8)'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#ff8800',
        glow: '0 0 10px rgba(255, 136, 0, 0.8)'
    }
};

// Game state
let board = [];
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let score = 0;
let level = 1;
let lines = 0;
let highScore = localStorage.getItem('tetrisHighScore') || 0;
let gameLoop = null;
let isGameRunning = false;
let isPaused = false;
let dropInterval = 1000;
let lastDrop = 0;

// Initialize board
function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

// Create a random piece
function createPiece() {
    const pieces = 'IOTSZJL';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const tetromino = TETROMINOES[type];
    
    return {
        type,
        shape: tetromino.shape,
        color: tetromino.color,
        glow: tetromino.glow,
        x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2),
        y: 0
    };
}

// Draw a single block
function drawBlock(context, x, y, color, glow, size = BLOCK_SIZE) {
    const padding = 1;
    const innerSize = size - padding * 2;
    
    // Glow effect
    context.shadowBlur = 10;
    context.shadowColor = glow;
    
    // Block body
    context.fillStyle = color;
    context.fillRect(x * size + padding, y * size + padding, innerSize, innerSize);
    
    // Inner highlight
    context.shadowBlur = 0;
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(x * size + padding + 2, y * size + padding + 2, innerSize - 4, innerSize / 3);
    
    // Inner shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(x * size + padding + 2, y * size + padding + innerSize - innerSize / 3 - 2, innerSize - 4, innerSize / 3);
}

// Draw the board
function drawBoard() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Draw placed blocks
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                const block = board[y][x];
                drawBlock(ctx, x, y, block.color, block.glow);
            }
        }
    }
}

// Draw current piece
function drawPiece() {
    if (!currentPiece) return;
    
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(ctx, currentPiece.x + dx, currentPiece.y + dy, currentPiece.color, currentPiece.glow);
            }
        });
    });
    
    // Draw ghost piece
    const ghostY = getGhostY();
    ctx.globalAlpha = 0.3;
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(ctx, currentPiece.x + dx, ghostY + dy, currentPiece.color, currentPiece.glow);
            }
        });
    });
    ctx.globalAlpha = 1;
}

// Get ghost piece Y position
function getGhostY() {
    let ghostY = currentPiece.y;
    while (!collision(currentPiece.x, ghostY + 1, currentPiece.shape)) {
        ghostY++;
    }
    return ghostY;
}

// Draw next piece preview
function drawNextPiece() {
    nextCtx.fillStyle = '#12121a';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!nextPiece) return;
    
    const offsetX = (nextCanvas.width / NEXT_BLOCK_SIZE - nextPiece.shape[0].length) / 2;
    const offsetY = (nextCanvas.height / NEXT_BLOCK_SIZE - nextPiece.shape.length) / 2;
    
    nextPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(nextCtx, offsetX + dx, offsetY + dy, nextPiece.color, nextPiece.glow, NEXT_BLOCK_SIZE);
            }
        });
    });
}

// Draw hold piece preview
function drawHoldPiece() {
    holdCtx.fillStyle = '#12121a';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    
    if (!holdPiece) return;
    
    const offsetX = (holdCanvas.width / NEXT_BLOCK_SIZE - holdPiece.shape[0].length) / 2;
    const offsetY = (holdCanvas.height / NEXT_BLOCK_SIZE - holdPiece.shape.length) / 2;
    
    holdPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(holdCtx, offsetX + dx, offsetY + dy, holdPiece.color, holdPiece.glow, NEXT_BLOCK_SIZE);
            }
        });
    });
}

// Check collision
function collision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Rotate piece
function rotatePiece() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    
    if (!collision(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
    } else if (!collision(currentPiece.x - 1, currentPiece.y, rotated)) {
        currentPiece.x -= 1;
        currentPiece.shape = rotated;
    } else if (!collision(currentPiece.x + 1, currentPiece.y, rotated)) {
        currentPiece.x += 1;
        currentPiece.shape = rotated;
    }
}

// Move piece
function movePiece(dir) {
    if (!collision(currentPiece.x + dir, currentPiece.y, currentPiece.shape)) {
        currentPiece.x += dir;
    }
}

// Drop piece
function dropPiece() {
    if (!collision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
        return true;
    }
    return false;
}

// Hard drop
function hardDrop() {
    while (dropPiece()) {
        score += 2;
    }
    lockPiece();
}

// Lock piece in place
function lockPiece() {
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                const y = currentPiece.y + dy;
                const x = currentPiece.x + dx;
                if (y >= 0) {
                    board[y][x] = { color: currentPiece.color, glow: currentPiece.glow };
                }
            }
        });
    });
    
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    canHold = true;
    
    drawNextPiece();
    drawHoldPiece();
    
    if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
    }
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        linesElement.textContent = lines;
        
        // Scoring: 1=100, 2=300, 3=500, 4=800
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;
        scoreElement.textContent = score;
        
        // Level up every 10 lines
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

// Hold piece
function holdCurrentPiece() {
    if (!canHold) return;
    
    if (holdPiece) {
        const temp = currentPiece;
        currentPiece = holdPiece;
        holdPiece = temp;
        currentPiece.x = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
        currentPiece.y = 0;
    } else {
        holdPiece = currentPiece;
        currentPiece = nextPiece;
        nextPiece = createPiece();
        holdPiece.x = Math.floor(COLS / 2) - Math.floor(holdPiece.shape[0].length / 2);
        holdPiece.y = 0;
        drawNextPiece();
    }
    
    canHold = false;
    drawHoldPiece();
}

// Game loop
function update(timestamp) {
    if (!isGameRunning || isPaused) return;
    
    if (timestamp - lastDrop > dropInterval) {
        if (!dropPiece()) {
            lockPiece();
        }
        lastDrop = timestamp;
    }
    
    drawBoard();
    drawPiece();
    
    gameLoop = requestAnimationFrame(update);
}

// Start game
function startGame() {
    initBoard();
    currentPiece = createPiece();
    nextPiece = createPiece();
    holdPiece = null;
    canHold = true;
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    isGameRunning = true;
    isPaused = false;
    
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    linesElement.textContent = '0';
    
    boardOverlay.style.display = 'none';
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'flex';
    
    drawNextPiece();
    drawHoldPiece();
    
    lastDrop = performance.now();
    gameLoop = requestAnimationFrame(update);
}

// Toggle pause
function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        boardOverlay.style.display = 'flex';
        boardOverlay.querySelector('.overlay-text').textContent = 'PAUSED';
        boardOverlay.querySelector('.overlay-subtext').textContent = 'Press P to resume';
        pauseBtn.querySelector('.btn-text').textContent = 'RESUME';
    } else {
        boardOverlay.style.display = 'none';
        pauseBtn.querySelector('.btn-text').textContent = 'PAUSE';
        lastDrop = performance.now();
        gameLoop = requestAnimationFrame(update);
    }
}

// Game over
function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
    
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = level;
    finalLinesElement.textContent = lines;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore);
        highscoreDisplay.style.display = 'inline-flex';
    } else {
        highscoreDisplay.style.display = 'none';
    }
    
    gameOverModal.style.display = 'flex';
    pauseBtn.style.display = 'none';
}

// Reset game
function resetGame() {
    gameOverModal.style.display = 'none';
    boardOverlay.style.display = 'flex';
    boardOverlay.querySelector('.overlay-text').textContent = 'READY?';
    boardOverlay.querySelector('.overlay-subtext').textContent = 'Press START';
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
    
    initBoard();
    drawBoard();
    
    nextCtx.fillStyle = '#12121a';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    holdCtx.fillStyle = '#12121a';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
}

// Keyboard controls
document.addEventListener('keydown', function(e) {
    if (!isGameRunning) {
        if (e.code === 'Space' || e.code === 'Enter') {
            startGame();
        }
        return;
    }
    
    if (e.code === 'KeyP') {
        togglePause();
        return;
    }
    
    if (isPaused) return;
    
    switch (e.code) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowDown':
            if (dropPiece()) score += 1;
            scoreElement.textContent = score;
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'Space':
            hardDrop();
            break;
        case 'KeyC':
            holdCurrentPiece();
            break;
    }
    
    if (isGameRunning && !isPaused) {
        drawBoard();
        drawPiece();
    }
});

// Button events
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// Initialize
initBoard();
drawBoard();

console.log('🎮 TETRIS NEON loaded');
