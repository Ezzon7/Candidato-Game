export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        // Logo ONPE y cabina
        this.load.image('menu_logo', '../../assets/onpe/logo.png');
        this.load.image('menu_cabina', '../../assets/onpe/cabina-votacion-1.png');

        // Música de fondo - coloca el archivo en assets/audio/menu-music.mp3
        this.load.audio('menu_music', '../../assets/audio/menu-music.mp3');
    }

    create() {
        const { width, height } = this.scale;

        // ─── FONDO: Bandera peruana (rojo-blanco-rojo) ───────────────────────────
        this.add.rectangle(width / 2, height / 2, width, height, 0xC8102E);
        this.add.rectangle(width / 2, height / 2, Math.round(width * 0.335), height, 0xffffff);

        // ─── LOGO ONPE ───────────────────────────────────────────────────────────
        this.add.image(width / 2, 78, 'menu_logo').setDisplaySize(220, 70);
        this.add.rectangle(width / 2, 120, 420, 2, 0xffffff).setAlpha(0.5);

        // ─── TÍTULO ──────────────────────────────────────────────────────────────
        this.add.text(width / 2, height * 0.30, '¡APRENDE A VOTAR!', {
            fontSize: '54px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            stroke: '#8B0000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 8, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.42, 'Simulación del proceso electoral peruano', {
            fontSize: '20px',
            color: '#ffe8e8',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // ─── CABINA DECORATIVA ───────────────────────────────────────────────────
        const cabina = this.add.image(width * 0.80, height * 0.58, 'menu_cabina')
            .setDisplaySize(160, 250)
            .setAlpha(0.85);
        this.tweens.add({
            targets: cabina,
            scaleX: cabina.scaleX * 1.03,
            scaleY: cabina.scaleY * 1.03,
            duration: 1800,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // ─── BOTÓN INICIAR ────────────────────────────────────────────────────────
        const btnBg = this.add.rectangle(width * 0.42, height * 0.60, 270, 68, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(3, 0xC8102E);
        const btnText = this.add.text(width * 0.42, height * 0.60, '▶  INICIAR JUEGO', {
            fontSize: '26px',
            color: '#C8102E',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0xC8102E); btnText.setColor('#ffffff'); });
        btnBg.on('pointerout',  () => { btnBg.setFillStyle(0xffffff); btnText.setColor('#C8102E'); });
        btnBg.on('pointerdown', () => {
            if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();
            this.registry.set('btnA_usado', false);
            this.registry.set('btnB_usado', false);
            this.registry.set('btnC_usado', false);
            this.registry.set('tieneCedula', false);
            this.registry.set('votoRealizado', false);
            this.registry.set('votoEntregado', false);
            this.registry.set('mostrarMensajeRetorno', false);
            this.registry.set('votoEspecial', false);
            this.registry.set('playerX', 260);
            this.registry.set('playerY', 1450);
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
        });

        // Pulso suave al botón
        this.tweens.add({
            targets: [btnBg, btnText],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 900,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // ─── PASOS DEL PROCESO ───────────────────────────────────────────────────
        const pasos = ['1. Recoge tu cédula de votación', '2. Ingresa a la cabina de votación', '3. Marca tu voto correctamente'];
        pasos.forEach((paso, i) => {
            this.add.text(width * 0.22, height * 0.73 + i * 28, paso, {
                fontSize: '17px',
                color: '#ffe8e8',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
        });

        // ─── FOOTER ──────────────────────────────────────────────────────────────
        this.add.text(width / 2, height - 22, 'ONPE – Oficina Nacional de Procesos Electorales', {
            fontSize: '13px',
            color: '#ffbbbb',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // ─── CONFETI DE FONDO ────────────────────────────────────────────────────
        this._spawnConfetti();

        // ─── MÚSICA ──────────────────────────────────────────────────────────────
        if (this.cache.audio.exists('menu_music')) {
            this.bgMusic = this.sound.add('menu_music', { loop: true, volume: 0.40 });
            this.bgMusic.play();
        }

        // Fade-in de entrada
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    _spawnConfetti() {
        const colors = [0xffffff, 0xffd700, 0xff6600, 0x00bb44, 0x0066ff, 0xff3366];
        for (let i = 0; i < 35; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const startY = this.scale.height + Phaser.Math.Between(0, 50);
            const color = Phaser.Math.RND.pick(colors);
            const size = Phaser.Math.Between(4, 9);
            const piece = this.add.rectangle(x, startY, size, Math.round(size * 1.6), color, 0.75).setDepth(50);
            this.tweens.add({
                targets: piece,
                y: -20,
                x: x + Phaser.Math.Between(-100, 100),
                rotation: Phaser.Math.FloatBetween(-4, 4),
                duration: Phaser.Math.Between(3000, 6000),
                delay: Phaser.Math.Between(0, 4000),
                ease: 'Linear',
                repeat: -1,
                onRepeat: () => {
                    piece.x = Phaser.Math.Between(0, this.scale.width);
                    piece.y = this.scale.height + 10;
                    piece.alpha = 0.75;
                }
            });
        }
    }
}
