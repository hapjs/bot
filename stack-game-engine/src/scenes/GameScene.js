import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig.js';

/**
 * 游戏主场景
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameState = 'waiting'; // waiting, playing, paused, gameover
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectStacks = 0;
        this.currentLevel = 1;
        this.blockWidth = GameConfig.BLOCK.WIDTH;
        this.blockSpeed = GameConfig.BLOCK.BASE_SPEED;
        this.stackedBlocks = [];
        this.currentBlock = null;
        this.fallingPieces = [];
        this.particles = [];
        this.soundEnabled = true;
    }

    create() {
        // 获取全局引用
        window.gameScene = this;
        
        // 音效上下文
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.soundEnabled = this.registry.get('soundEnabled');

        // 创建背景渐变
        this.createBackground();

        // 初始化底部基座
        this.initBaseBlock();

        // 输入处理
        this.input.on('pointerdown', () => this.placeBlock());
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.gameState === 'waiting') {
                this.startGame();
            } else if (this.gameState === 'playing') {
                this.placeBlock();
            }
        });

        // 初始不创建移动方块，等待开始游戏
    }

    createBackground() {
        const gradient = this.make.graphics();
        gradient.fillGradientStyle(
            GameConfig.COLORS.BACKGROUND_TOP,
            GameConfig.COLORS.BACKGROUND_TOP,
            GameConfig.COLORS.BACKGROUND_BOTTOM,
            GameConfig.COLORS.BACKGROUND_BOTTOM,
            1
        );
        gradient.fillRect(0, 0, GameConfig.WIDTH, GameConfig.HEIGHT);
        gradient.generateTexture('background', GameConfig.WIDTH, GameConfig.HEIGHT);
        gradient.destroy();

        this.add.image(GameConfig.WIDTH / 2, GameConfig.HEIGHT / 2, 'background');
    }

    initBaseBlock() {
        this.stackedBlocks = [];
        const baseBlock = this.createBlock(
            GameConfig.WIDTH / 2 - GameConfig.BLOCK.WIDTH / 2,
            GameConfig.HEIGHT - GameConfig.BLOCK.HEIGHT * 2 - 30,
            GameConfig.BLOCK.WIDTH,
            GameConfig.BLOCK.HEIGHT,
            this.getColor(0)
        );
        this.stackedBlocks.push(baseBlock);
    }

    createBlock(x, y, width, height, colorData) {
        const graphics = this.make.graphics();
        
        // 发光效果
        graphics.lineStyle(3, colorData.glow, 0.8);
        graphics.fillStyle(colorData.main, 1);
        
        // 圆角矩形
        const radius = 6;
        graphics.fillRoundedRect(2, 2, width - 4, height - 4, radius);
        graphics.strokeRoundedRect(2, 2, width - 4, height - 4, radius);
        
        // 高光
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillRoundedRect(5, 5, width - 10, height / 3, radius);
        
        graphics.generateTexture('block_' + Date.now(), width, height);
        graphics.destroy();

        const block = this.add.image(x + width / 2, y + height / 2, 'block_' + Date.now());
        block.setDisplaySize(width, height);
        block.blockData = { x, y, width, height, color: colorData };
        
        return block;
    }

    getColor(level) {
        const hue = (level * 25) % 360;
        return {
            main: `hsl(${hue}, 80%, 55%)`,
            glow: `hsl(${hue}, 80%, 50%)`,
            light: `hsl(${hue}, 80%, 70%)`
        };
    }

    getSpeedForLevel(level) {
        const speeds = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10];
        return speeds[Math.min(level - 1, speeds.length - 1)];
    }

    getWidthVariation(level) {
        if (level < GameConfig.DIFFICULTY.WIDTH_VARIATION_START) {
            return GameConfig.BLOCK.WIDTH;
        }
        const variation = (level % 5) * 10;
        return GameConfig.BLOCK.WIDTH - variation + Math.random() * 20;
    }

    startGame() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // 重置游戏状态
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectStacks = 0;
        this.currentLevel = 1;
        this.blockWidth = GameConfig.BLOCK.WIDTH;
        this.blockSpeed = this.getSpeedForLevel(1);
        this.gameState = 'playing';

        // 清理旧方块
        this.stackedBlocks.forEach(b => b.destroy());
        this.fallingPieces.forEach(p => p.destroy());
        this.particles.forEach(p => p.destroy());
        this.stackedBlocks = [];
        this.fallingPieces = [];
        this.particles = [];

        // 重新初始化基座
        this.initBaseBlock();

        // 更新 UI
        this.updateUI();

        // 隐藏游戏结束覆盖层
        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) overlay.classList.remove('show');

        // 禁用开始按钮，启用暂停按钮
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;

        // 创建第一个移动方块
        this.spawnCurrentBlock();

        // 开始计时器
        if (this.moveTimer) this.moveTimer.remove();
        this.moveTimer = this.time.addEvent({
            delay: 16, // ~60fps
            callback: this.moveBlock,
            callbackScope: this,
            loop: true
        });
    }

    spawnCurrentBlock() {
        if (this.currentBlock) {
            this.currentBlock.destroy();
        }

        const lastBlock = this.stackedBlocks[this.stackedBlocks.length - 1];
        const colorData = this.getColor(this.stackedBlocks.length);
        const direction = Math.random() > 0.5 ? 1 : -1;

        this.currentBlock = {
            x: 0,
            y: lastBlock.y - GameConfig.BLOCK.HEIGHT - 25,
            width: this.blockWidth,
            height: GameConfig.BLOCK.HEIGHT,
            direction: direction,
            color: colorData,
            sprite: null
        };

        this.currentBlock.sprite = this.createBlock(
            this.currentBlock.x,
            this.currentBlock.y,
            this.currentBlock.width,
            this.currentBlock.height,
            this.currentBlock.color
        );
    }

    moveBlock() {
        if (this.gameState !== 'playing' || !this.currentBlock) return;

        this.currentBlock.x += this.blockSpeed * this.currentBlock.direction;

        // 边界检测
        if (this.currentBlock.x <= GameConfig.GAME_AREA.SIDE_PADDING) {
            this.currentBlock.x = GameConfig.GAME_AREA.SIDE_PADDING;
            this.currentBlock.direction = 1;
        } else if (this.currentBlock.x + this.currentBlock.width >= GameConfig.WIDTH - GameConfig.GAME_AREA.SIDE_PADDING) {
            this.currentBlock.x = GameConfig.WIDTH - GameConfig.GAME_AREA.SIDE_PADDING - this.currentBlock.width;
            this.currentBlock.direction = -1;
        }

        // 更新精灵位置
        if (this.currentBlock.sprite) {
            this.currentBlock.sprite.x = this.currentBlock.x + this.currentBlock.width / 2;
            this.currentBlock.sprite.y = this.currentBlock.y + this.currentBlock.height / 2;
        }
    }

    placeBlock() {
        if (this.gameState !== 'playing' || !this.currentBlock) return;

        const lastBlock = this.stackedBlocks[this.stackedBlocks.length - 1];
        const current = this.currentBlock;

        // 计算重叠区域
        const overlapLeft = Math.max(current.x, lastBlock.blockData.x);
        const overlapRight = Math.min(
            current.x + current.width,
            lastBlock.blockData.x + lastBlock.blockData.width
        );
        const overlapWidth = overlapRight - overlapLeft;

        // 完全没对准 - 游戏结束
        if (overlapWidth <= 0) {
            this.gameOver();
            return;
        }

        // 检查是否完美堆叠
        const isPerfect = Math.abs(overlapWidth - lastBlock.blockData.width) < GameConfig.COMBO.PERFECT_TOLERANCE &&
                         Math.abs(current.x - lastBlock.blockData.x) < GameConfig.COMBO.PERFECT_TOLERANCE;

        // 创建掉落碎片
        this.createFallingPieces(current, lastBlock);

        // 添加新方块到堆叠
        const newBlock = this.createBlock(
            overlapLeft,
            current.y,
            overlapWidth,
            GameConfig.BLOCK.HEIGHT,
            current.color
        );
        this.stackedBlocks.push({
            sprite: newBlock,
            blockData: {
                x: overlapLeft,
                y: current.y,
                width: overlapWidth,
                height: GameConfig.BLOCK.HEIGHT,
                color: current.color
            }
        });

        // 计分
        if (isPerfect) {
            this.combo++;
            this.perfectStacks++;
            const points = GameConfig.COMBO.BASE_BONUS + this.combo * GameConfig.COMBO.BONUS_MULTIPLIER;
            this.score += points;
            
            this.playSound('perfect');
            this.hapticFeedback([15, 50, 15]);
            this.createPerfectEffect(current.x + current.width / 2, current.y);
            this.showFloatingText('完美!', current.x + current.width / 2, current.y, 0xFFD700);
            
            if (this.combo >= 2) {
                this.playSound('combo');
                this.showComboToast();
            }

            // 检查成就
            this.checkAchievements('perfect', this.combo);
        } else {
            this.combo = 0;
            this.score += 1;
            this.playSound('place');
            this.hapticFeedback([10]);
        }

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // 检查成就
        this.checkAchievements('score', this.score);
        this.checkAchievements('combo', this.combo);

        // 更新 UI
        this.updateUI();

        // 难度提升
        if (this.score >= this.currentLevel * GameConfig.DIFFICULTY.SCORE_PER_LEVEL) {
            this.currentLevel++;
            this.blockSpeed = this.getSpeedForLevel(this.currentLevel);
            this.blockWidth = this.getWidthVariation(this.currentLevel);
            this.showFloatingText(`第 ${this.currentLevel} 关!`, GameConfig.WIDTH / 2, 100, 0x667eea);
        }

        // 视图滚动
        if (this.stackedBlocks.length > 8) {
            this.scrollView(GameConfig.BLOCK.HEIGHT);
        }

        // 生成新方块
        this.spawnCurrentBlock();
    }

    createFallingPieces(current, lastBlock) {
        // 左侧掉落
        if (current.x < lastBlock.blockData.x) {
            const piece = this.createBlock(
                current.x,
                current.y,
                lastBlock.blockData.x - current.x,
                GameConfig.BLOCK.HEIGHT,
                current.color
            );
            this.fallingPieces.push({
                sprite: piece,
                velocity: 0,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        // 右侧掉落
        if (current.x + current.width > lastBlock.blockData.x + lastBlock.blockData.width) {
            const cutX = lastBlock.blockData.x + lastBlock.blockData.width;
            const piece = this.createBlock(
                cutX,
                current.y,
                (current.x + current.width) - cutX,
                GameConfig.BLOCK.HEIGHT,
                current.color
            );
            this.fallingPieces.push({
                sprite: piece,
                velocity: 0,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    scrollView(amount) {
        this.stackedBlocks.forEach(block => {
            block.sprite.y += amount;
            block.blockData.y += amount;
        });
        
        this.fallingPieces.forEach(piece => {
            piece.sprite.y += amount;
        });
    }

    createPerfectEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const particle = this.add.circle(
                x,
                y,
                Phaser.Math.Between(3, 8),
                GameConfig.COLORS.PARTICLE_GOLD
            );
            particle.vx = Phaser.Math.Between(-10, 10);
            particle.vy = Phaser.Math.Between(-10, -3);
            particle.alpha = 1;
            this.particles.push(particle);
        }
    }

    showFloatingText(text, x, y, color) {
        const textObj = this.add.text(x, y, text, {
            font: 'bold 24px Arial',
            color: '#' + color.toString(16).padStart(6, '0'),
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: textObj,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => textObj.destroy()
        });
    }

    showComboToast() {
        const toast = document.getElementById('comboToast');
        document.getElementById('comboCount').textContent = this.combo;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 800);
    }

    checkAchievements(type, value) {
        const unlocked = this.registry.get('achievements') || [];
        
        GameConfig.ACHIEVEMENTS.forEach(achievement => {
            if (unlocked.includes(achievement.id)) return;
            
            let shouldUnlock = false;
            if (achievement.type === 'score' && value >= achievement.threshold) {
                shouldUnlock = true;
            } else if (achievement.type === 'perfect' && value >= achievement.threshold) {
                shouldUnlock = true;
            } else if (achievement.type === 'combo' && value >= achievement.threshold) {
                shouldUnlock = true;
            }
            
            if (shouldUnlock) {
                unlocked.push(achievement.id);
                this.registry.set('achievements', unlocked);
                localStorage.setItem('stackAchievements', JSON.stringify(unlocked));
                this.showAchievement(achievement);
            }
        });
    }

    showAchievement(achievement) {
        const toast = document.getElementById('achievementToast');
        document.getElementById('achievementIcon').textContent = achievement.icon;
        document.getElementById('achievementTitle').textContent = `成就解锁：${achievement.name}`;
        document.getElementById('achievementDesc').textContent = achievement.desc;
        toast.classList.add('show');
        this.playSound('perfect');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('perfect').textContent = this.perfectStacks;
    }

    gameOver() {
        this.gameState = 'gameover';
        this.playSound('gameover');
        this.hapticFeedback([50, 50, 50, 50, 50]);

        // 创建爆炸粒子
        const colors = GameConfig.COLORS.PARTICLE_COLORS;
        for (let i = 0; i < 50; i++) {
            const particle = this.add.circle(
                this.currentBlock.x + this.currentBlock.width / 2,
                this.currentBlock.y + this.currentBlock.height / 2,
                Phaser.Math.Between(4, 10),
                colors[Math.floor(Math.random() * colors.length)]
            );
            particle.vx = Phaser.Math.Between(-15, 15);
            particle.vy = Phaser.Math.Between(-15, 15);
            particle.alpha = 1;
            this.particles.push(particle);
        }

        // 更新最高分
        const highScore = this.registry.get('highScore') || 0;
        if (this.score > highScore) {
            this.registry.set('highScore', this.score);
            localStorage.setItem('stackHighScore', this.score);
            document.getElementById('highScore').textContent = this.score;
            document.getElementById('newRecordBadge').style.display = 'inline-block';
        } else {
            document.getElementById('newRecordBadge').style.display = 'none';
        }

        // 显示结算
        document.getElementById('finalScoreDisplay').textContent = this.score;
        document.getElementById('finalMaxCombo').textContent = this.maxCombo;
        document.getElementById('finalPerfect').textContent = this.perfectStacks;

        // 显示游戏结束覆盖层
        setTimeout(() => {
            document.getElementById('gameOverOverlay').classList.add('show');
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = true;
        }, 500);

        // 停止计时器
        if (this.moveTimer) {
            this.moveTimer.remove();
            this.moveTimer = null;
        }
    }

    restartGame() {
        this.startGame();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseBtn').innerHTML = '<span>▶</span> <span>继续</span>';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseBtn').innerHTML = '<span>⏸</span> <span>暂停</span>';
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.registry.set('soundEnabled', this.soundEnabled);
        localStorage.setItem('stackSoundEnabled', this.soundEnabled);
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        switch(type) {
            case 'place':
                oscillator.frequency.setValueAtTime(GameConfig.AUDIO.PLACE_FREQ, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
                oscillator.start(this.audioCtx.currentTime);
                oscillator.stop(this.audioCtx.currentTime + 0.1);
                break;
            case 'perfect':
                GameConfig.AUDIO.PERFECT_FREQS.forEach((freq, i) => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + i * 0.1 + 0.2);
                    osc.start(this.audioCtx.currentTime + i * 0.1);
                    osc.stop(this.audioCtx.currentTime + i * 0.1 + 0.2);
                });
                return;
            case 'combo':
                const freq = GameConfig.AUDIO.COMBO_FREQ_BASE + this.combo * 50;
                oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
                oscillator.start(this.audioCtx.currentTime);
                oscillator.stop(this.audioCtx.currentTime + 0.15);
                break;
            case 'gameover':
                oscillator.frequency.setValueAtTime(GameConfig.AUDIO.GAMEOVER_FREQ_START, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
                oscillator.start(this.audioCtx.currentTime);
                oscillator.stop(this.audioCtx.currentTime + 0.5);
                break;
        }
    }

    hapticFeedback(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    update(time, delta) {
        // 更新掉落碎片
        this.fallingPieces = this.fallingPieces.filter(piece => {
            piece.velocity += 0.6;
            piece.sprite.y += piece.velocity;
            piece.rotation += piece.rotationSpeed;
            piece.sprite.rotation = piece.rotation;
            piece.sprite.alpha -= 0.015;
            return piece.sprite.alpha > 0 && piece.sprite.y < GameConfig.HEIGHT + 50;
        });

        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.4;
            particle.alpha -= 0.02;
            return particle.alpha > 0 && particle.y < GameConfig.HEIGHT + 50;
        });
    }
}

export default GameScene;
