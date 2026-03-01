import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// 游戏配置
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 400,
    height: 600,
    backgroundColor: '#667eea',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 400,
        height: 600
    },
    scene: [BootScene, GameScene, UIScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 响应窗口大小变化
function resizeGame() {
    const container = document.getElementById('game-container');
    if (container && game) {
        const maxWidth = Math.min(window.innerWidth - 40, 400);
        const maxHeight = Math.min(window.innerHeight - 250, 600);
        
        const scale = Math.min(maxWidth / 400, maxHeight / 600);
        
        game.scale.setWidth(400 * scale);
        game.scale.setHeight(600 * scale);
    }
}

window.addEventListener('resize', resizeGame);
window.addEventListener('load', resizeGame);

// 导出游戏场景引用
export { game };
