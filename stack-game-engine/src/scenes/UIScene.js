import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig.js';

/**
 * UI 场景 - 处理游戏界面元素
 */
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // UI 场景主要用于与 DOM 元素交互
        // Phaser 的 UI 可以通过 DOM 元素或游戏内文本实现
        
        // 这里可以添加游戏内的 UI 元素
        // 如暂停指示器、关卡提示等
    }

    updateScore(score) {
        // 更新分数显示
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    }

    updateCombo(combo) {
        // 更新连击显示
        const comboElement = document.getElementById('combo');
        if (comboElement) {
            comboElement.textContent = combo;
        }
    }

    updatePerfect(perfect) {
        // 更新完美堆叠显示
        const perfectElement = document.getElementById('perfect');
        if (perfectElement) {
            perfectElement.textContent = perfect;
        }
    }

    updateHighScore(highScore) {
        // 更新最高分显示
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = highScore;
        }
    }
}

export default UIScene;
