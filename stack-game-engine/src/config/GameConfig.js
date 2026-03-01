/**
 * 游戏配置常量
 */
export const GameConfig = {
    // 画布尺寸
    WIDTH: 400,
    HEIGHT: 600,
    
    // 方块配置
    BLOCK: {
        WIDTH: 100,
        HEIGHT: 30,
        BASE_SPEED: 2,
        MAX_SPEED: 10
    },
    
    // 游戏区域
    GAME_AREA: {
        TOP_PADDING: 50,
        BOTTOM_PADDING: 80,
        SIDE_PADDING: 20
    },
    
    // 难度曲线
    DIFFICULTY: {
        SCORE_PER_LEVEL: 10,
        SPEED_INCREMENT: 0.5,
        WIDTH_VARIATION_START: 3
    },
    
    // 连击配置
    COMBO: {
        PERFECT_TOLERANCE: 2,  // 完美堆叠误差容忍 (px)
        BONUS_MULTIPLIER: 2,
        BASE_BONUS: 5
    },
    
    // 成就配置
    ACHIEVEMENTS: [
        { id: 'first10', name: '初出茅庐', desc: '达到 10 分', icon: '🥉', threshold: 10 },
        { id: 'first30', name: '渐入佳境', desc: '达到 30 分', icon: '🥈', threshold: 30 },
        { id: 'first50', name: '叠叠乐大师', desc: '达到 50 分', icon: '🥇', threshold: 50 },
        { id: 'perfect5', name: '完美主义', desc: '连续 5 次完美堆叠', icon: '💎', type: 'perfect', threshold: 5 },
        { id: 'combo10', name: '连击之王', desc: '10 连击', icon: '🔥', type: 'combo', threshold: 10 }
    ],
    
    // 颜色配置
    COLORS: {
        BACKGROUND_TOP: 0x667eea,
        BACKGROUND_BOTTOM: 0x764ba2,
        BLOCK_GLOW: 0xffffff,
        PARTICLE_GOLD: 0xFFD700,
        PARTICLE_COLORS: [0xff6b6b, 0xf093fb, 0x4facfe, 0x43e97b, 0xffd93d]
    },
    
    // 音效配置
    AUDIO: {
        PLACE_FREQ: 400,
        PERFECT_FREQS: [523, 659, 784],
        COMBO_FREQ_BASE: 300,
        GAMEOVER_FREQ_START: 400
    }
};

export default GameConfig;
