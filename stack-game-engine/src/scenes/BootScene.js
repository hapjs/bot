import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig.js';

/**
 * 启动场景 - 加载资源和初始化
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 显示加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0xffffff, 0.5);
        progressBox.fillRect(
            GameConfig.WIDTH / 2 - 100,
            GameConfig.HEIGHT / 2 - 25,
            200,
            50
        );

        const loadingText = this.add.text(
            GameConfig.WIDTH / 2,
            GameConfig.HEIGHT / 2 - 50,
            '加载中...',
            {
                font: '20px Arial',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);

        // 加载进度
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(
                GameConfig.WIDTH / 2 - 90,
                GameConfig.HEIGHT / 2 - 15,
                180 * value,
                30
            );
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // 这里可以加载图片、音频等资源
        // this.load.image('block', 'assets/block.png');
        // this.load.audio('place', 'assets/sounds/place.mp3');
    }

    create() {
        // 初始化游戏数据
        this.registry.set('score', 0);
        this.registry.set('highScore', parseInt(localStorage.getItem('stackHighScore')) || 0);
        this.registry.set('combo', 0);
        this.registry.set('maxCombo', 0);
        this.registry.set('perfectStacks', 0);
        this.registry.set('soundEnabled', localStorage.getItem('stackSoundEnabled') !== 'false');

        // 加载成就状态
        const savedAchievements = localStorage.getItem('stackAchievements');
        if (savedAchievements) {
            this.registry.set('achievements', JSON.parse(savedAchievements));
        } else {
            this.registry.set('achievements', []);
        }

        // 启动 UI 场景
        this.scene.start('UIScene');
        
        // 启动游戏场景
        this.scene.start('GameScene');
    }
}

export default BootScene;
