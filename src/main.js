import { GameScene } from './scenes/GameScene.js';
import { VotingScene } from './scenes/VotingScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    input: {
        activePointers: 3 // PERMITE HASTA 3 TOQUES SIMULTÁNEOS
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [GameScene, VotingScene]
};

new Phaser.Game(config);
            