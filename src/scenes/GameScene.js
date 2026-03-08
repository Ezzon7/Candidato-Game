export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // --- MAPA Y ENTORNO ---
        this.load.tilemapTiledJSON('mapa', '../../assets/maps/escuela_v2.tmj');
        const tilesets = ['anfora', 'cabina', 'casillero1', 'casillero2', 'casillero3', 'escritorio', 'estante', 'mesa', 'pared_64', 'pared1', 'pared2', 'pared3', 'pizarra', 'puerta_64', 'puerta_cerrada_64', 'suelo_32', 'votacion'];
        tilesets.forEach(name => this.load.image(name, `../../assets/images/${name}.png`));
        
        // --- PERSONAJE Y UI ---
        this.load.image('player_texture', '../../assets/characters/Player1.png');
        this.load.image('dpad_cruceta', '../../assets/images/arrows.png');
        this.load.image('btn_interactuar', '../../assets/images/interactuar.png');
        
        // Carga de la imagen del mensaje de la cédula
        this.load.image('cedula_msg', '../../assets/images/cedula-msg.png');
    }

    create() {
        // --- CONFIGURACIÓN DEL MAPA ---
        const map = this.make.tilemap({ key: 'mapa' });
        const nombresTilesets = ['anfora', 'cabina', 'casillero1', 'casillero2', 'casillero3', 'escritorio', 'estante', 'mesa', 'pared_64', 'pared1', 'pared2', 'pared3', 'pizarra', 'puerta_64', 'puerta_cerrada_64', 'suelo_32', 'votacion'];
        const allTilesets = nombresTilesets.map(name => map.addTilesetImage(name, name));
        
        map.createLayer('Suelo', allTilesets, 0, 0);
        const paredesLayer = map.createLayer('Paredes', allTilesets, 0, 0);
        const objetosLayer = map.createLayer('Objetos', allTilesets, 0, 0); 
        const decoracionesLayer = map.createLayer('Decoraciones', allTilesets, 0, 0); 

        // Lógica del ánfora
        this.anforaPos = null;
        decoracionesLayer.forEachTile(tile => {
            if (tile.index >= 94 && tile.index <= 97) {
                if (!this.anforaPos) {
                    this.anforaPos = { x: tile.getCenterX(), y: tile.getCenterY() };
                }
            }
        });

        paredesLayer.setCollisionByProperty({ collides: true });
        if (objetosLayer) objetosLayer.setCollisionByProperty({ collides: true });

        // --- GENERACIÓN DE FRAMES DEL PERSONAJE ---
        const texture = this.textures.get('player_texture');
        const fW = 35; 
        const fH = 47.5; 
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                const i = (r * 3) + c;
                texture.add(i, 0, Math.floor(c * fW) + 2, Math.floor(r * fH), fW - 4, Math.floor(fH));
            }
        }

        // --- ENTIDADES Y FÍSICA ---
        this.player = this.physics.add.sprite(260, 1450, 'player_texture', 1);
        this.player.body.setSize(16, 12).setOffset(5, 35);
        this.createAnimations();

        this.physics.add.collider(this.player, paredesLayer);
        if (objetosLayer) this.physics.add.collider(this.player, objetosLayer);
        
        // --- CÁMARA ---
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.8);

        // --- CONTROLES ---
        const { width, height } = this.scale;
        this.teclas = this.input.keyboard.addKeys('W,A,S,D');
        this.teclaE = this.input.keyboard.addKey('E');

        // Prompt de interacción
        this.interactionPrompt = this.add.text(width / 2, height - 100, 'Presiona E para votar', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0.8);

        this.crearDPadCruceta();

        // --- BOTONES DE INTERACCIÓN ---
        // Imagen del mensaje
        this.msgCedula = this.add.image(930, 150, 'cedula_msg').setDepth(200).setVisible(false).setScale(0.5);

        // Botón A (Cédula) - Posición (920, 100)
        this.btnA = this.add.image(920, 100, 'btn_interactuar').setInteractive().setScale(0.5).setDepth(100).setVisible(false);
        this.btnA.usado = false;

        this.btnA.on('pointerdown', () => {
            this.btnA.usado = true;
            this.btnA.setVisible(false);
            
            // Mostrar mensaje por 5 segundos
            this.msgCedula.setVisible(true);
            this.time.delayedCall(3000, () => {
                this.msgCedula.setVisible(false);
            });
        });

        // Botón B (Votación) - Posición (1555, 82)
        this.btnB = this.add.image(1555, 82, 'btn_interactuar').setInteractive().setScale(0.5).setDepth(100).setVisible(false);
        this.btnB.usado = false;

        this.btnB.on('pointerdown', () => {
            this.btnB.usado = true;
            this.btnB.setVisible(false);
            this.scene.start('VotingScene');
        });
    }

    crearDPadCruceta() {
        const { width, height } = this.scale;
        const xBase = width - 300; 
        const yBase = height - 250;
        const crucetaImg = this.add.image(xBase, yBase, 'dpad_cruceta').setScrollFactor(0).setAlpha(0.6).setScale(0.10);
        this.touchControl = { up: false, down: false, left: false, right: false };
        const zonaSize = 60; 

        const crearZona = (x, y, dir) => {
            const zona = this.add.rectangle(x, y, zonaSize, zonaSize, 0x000000, 0).setInteractive().setScrollFactor(0);
            const stopDir = () => {
                this.touchControl[dir] = false;
                if (!Object.values(this.touchControl).includes(true)) crucetaImg.setAlpha(0.6);
            };
            zona.on('pointerdown', () => { this.touchControl[dir] = true; crucetaImg.setAlpha(1); });
            zona.on('pointerup', stopDir);
            zona.on('pointerout', stopDir);
        };

        const dist = 45;
        crearZona(xBase, yBase - dist, 'up');
        crearZona(xBase, yBase + dist, 'down');
        crearZona(xBase - dist, yBase, 'left');
        crearZona(xBase + dist, yBase, 'right');
    }

    createAnimations() {
        const anims = this.anims;
        const cfg = { frameRate: 8, repeat: -1 };
        if (!anims.exists('walk-down')) {
            anims.create({ key: 'walk-down', frames: anims.generateFrameNumbers('player_texture', { start: 0, end: 2 }), ...cfg });
            anims.create({ key: 'walk-left', frames: anims.generateFrameNumbers('player_texture', { start: 3, end: 5 }), ...cfg });
            anims.create({ key: 'walk-right', frames: anims.generateFrameNumbers('player_texture', { start: 6, end: 8 }), ...cfg });
            anims.create({ key: 'walk-up', frames: anims.generateFrameNumbers('player_texture', { start: 9, end: 11 }), ...cfg });
        }
    }

    update() {
        const speed = 130;
        this.player.setVelocity(0);
        let mov = false;

        // Movimiento
        if (this.teclas.A.isDown || this.touchControl.left) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('walk-left', true);
            mov = true;
        } else if (this.teclas.D.isDown || this.touchControl.right) {
            this.player.setVelocityX(speed);
            this.player.anims.play('walk-right', true);
            mov = true;
        }

        if (this.teclas.W.isDown || this.touchControl.up) {
            this.player.setVelocityY(-speed);
            if (!mov) this.player.anims.play('walk-up', true);
            mov = true;
        } else if (this.teclas.S.isDown || this.touchControl.down) {
            this.player.setVelocityY(speed);
            if (!mov) this.player.anims.play('walk-down', true);
            mov = true;
        }

        // --- LÓGICA DE PROXIMIDAD ---
        // Botón A
        if (!this.btnA.usado) {
            const distA = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.btnA.x, this.btnA.y);
            this.btnA.setVisible(distA < 30);
        }

        // Botón B
        if (!this.btnB.usado) {
            const distB = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.btnB.x, this.btnB.y);
            this.btnB.setVisible(distB < 30);
        }

        // Ánfora
        if (this.anforaPos) {
            const distAnfora = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.anforaPos.x, this.anforaPos.y);
            if (distAnfora < 60) {
                this.interactionPrompt.setVisible(true);
                if (Phaser.Input.Keyboard.JustDown(this.teclaE)) {
                    this.scene.start('VotingScene');
                }
            } else {
                this.interactionPrompt.setVisible(false);
            }
        }

        if (!mov) {
            this.player.anims.stop();
            if (this.player.anims.currentAnim) this.player.setFrame(this.player.anims.currentAnim.frames[1].frame.name);
        }
    }
}