export class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    preload() {
        // Sonido de victoria - coloca el archivo en assets/audio/win-sound.mp3
        this.load.audio('win_sound', '../../assets/audio/win-sound.mp3');
    }

    create() {
        const { width, height } = this.scale;

        // ─── FONDO ────────────────────────────────────────────────────────────────
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a6e35);
        this.add.rectangle(width / 2, height / 2, width, height * 0.62, 0xf0fff4);

        // ─── ESTRELLA DECORATIVA ─────────────────────────────────────────────────
        const star = this.add.text(width / 2, height * 0.18, '🏆', {
            fontSize: '64px'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: star,
            scaleX: 1.15, scaleY: 1.15,
            duration: 800,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // ─── MENSAJES ─────────────────────────────────────────────────────────────
        this.add.text(width / 2, height * 0.30, '¡FELICITACIONES!', {
            fontSize: '52px',
            color: '#076b30',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.43, '¡Completaste el proceso electoral\ncorrectamente!', {
            fontSize: '24px',
            color: '#0a5a28',
            align: 'center',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.50, 'Ganaste un premio por votar bien.', {
            fontSize: '27px',
            color: '#C8102E',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // ─── BOTÓN REGISTRAR DATOS ────────────────────────────────────────────────
        const btnReg = this.add.rectangle(width / 2, height * 0.64, 390, 68, 0xC8102E)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(3, 0x880012);
        const btnRegTxt = this.add.text(width / 2, height * 0.64, 'REGISTRAR DATOS PARA EL PREMIO', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        btnReg.on('pointerover', () => btnReg.setFillStyle(0xff1a35));
        btnReg.on('pointerout',  () => btnReg.setFillStyle(0xC8102E));
        btnReg.on('pointerdown', () => {
            if (typeof window.mostrarFormularioRegistro === 'function') {
                window.mostrarFormularioRegistro();
            }
        });

        // Pulso en el botón de registro
        this.tweens.add({
            targets: [btnReg, btnRegTxt],
            scaleX: 1.04, scaleY: 1.04,
            duration: 900,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // ─── BOTÓN JUGAR DE NUEVO ────────────────────────────────────────────────
        const btnReplay = this.add.rectangle(width / 2, height * 0.79, 230, 55, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x076b30);
        this.add.text(width / 2, height * 0.79, 'Jugar de nuevo', {
            fontSize: '20px',
            color: '#076b30',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        btnReplay.on('pointerdown', () => {
            this.registry.set('btnA_usado', false);
            this.registry.set('btnB_usado', false);
            this.registry.set('btnC_usado', false);
            this.registry.set('tieneCedula', false);
            this.registry.set('votoRealizado', false);
            this.registry.set('votoEntregado', false);
            this.registry.set('mostrarMensajeRetorno', false);
            this.registry.set('playerX', 260);
            this.registry.set('playerY', 1450);
            this.registry.set('votoEspecial', false);
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
        });

        // ─── SONIDO ───────────────────────────────────────────────────────────────
        if (this.cache.audio.exists('win_sound')) {
            this.sound.play('win_sound', { volume: 0.7 });
        }

        // ─── CONFETI ─────────────────────────────────────────────────────────────
        this._spawnConfetti();
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    _spawnConfetti() {
        const colors = [0xC8102E, 0xffd700, 0x00aa44, 0xffffff, 0x0066cc, 0xff6600];
        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const size = Phaser.Math.Between(5, 11);
            const color = Phaser.Math.RND.pick(colors);
            const piece = this.add.rectangle(x, -10, size, Math.round(size * 1.6), color, 0.85).setDepth(200);
            this.tweens.add({
                targets: piece,
                y: this.scale.height + 20,
                x: x + Phaser.Math.Between(-120, 120),
                rotation: Phaser.Math.FloatBetween(-5, 5),
                duration: Phaser.Math.Between(2500, 5000),
                delay: Phaser.Math.Between(0, 3000),
                ease: 'Linear',
                repeat: -1,
                onRepeat: () => {
                    piece.x = Phaser.Math.Between(0, this.scale.width);
                    piece.y = -10;
                    piece.alpha = 0.85;
                }
            });
        }
    }
}