export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.tilemapTiledJSON('mapa', '../../assets/maps/escuela_v2.tmj');
        const tilesets = ['anfora', 'cabina', 'casillero1', 'casillero2', 'casillero3', 'escritorio', 'estante', 'mesa', 'pared_64', 'pared1', 'pared2', 'pared3', 'pizarra', 'puerta_64', 'puerta_cerrada_64', 'suelo_32', 'votacion'];
        tilesets.forEach(name => this.load.image(name, `../../assets/images/${name}.png`));
        
        this.load.image('player_texture', '../../assets/characters/Player1.png');
        this.load.image('dpad_cruceta', '../../assets/images/arrows.png');
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
        this.player = this.physics.add.sprite(265, 1450, 'player_texture', 1);
        this.player.body.setSize(16, 12).setOffset(5, 35);
        this.createAnimations();

        this.physics.add.collider(this.player, paredesLayer);
        if (objetosLayer) this.physics.add.collider(this.player, objetosLayer);
        
        // --- CÁMARA ---
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.8);

        // --- CONTROLES ---
        this.teclas = this.input.keyboard.addKeys('W,A,S,D');
        this.crearDPadCruceta();
    }

    crearDPadCruceta() {
        const { width, height } = this.scale;
        
        // Ubicación
        const xBase = width - 300; 
        const yBase = height - 250;
        
        const crucetaImg = this.add.image(xBase, yBase, 'dpad_cruceta')
            .setScrollFactor(0)
            .setAlpha(0.6)
            .setScale(0.10);

        this.touchControl = { up: false, down: false, left: false, right: false };

        // Tamaño de zona optimizado para toque de pulgar (60x60)
        const zonaSize = 60; 

        const crearZona = (x, y, dir) => {
            const zona = this.add.rectangle(x, y, zonaSize, zonaSize, 0x000000, 0)
                .setInteractive()
                .setScrollFactor(0);

            // Función para detener el movimiento de forma segura
            const stopDir = () => {
                this.touchControl[dir] = false;
                // Si ya no se presiona nada, bajamos el brillo
                if (!Object.values(this.touchControl).includes(true)) {
                    crucetaImg.setAlpha(0.6);
                }
            };

            zona.on('pointerdown', () => { 
                this.touchControl[dir] = true; 
                crucetaImg.setAlpha(1);
            });

            // Usamos pointerup y pointerout para evitar que el personaje se quede caminando solo
            zona.on('pointerup', stopDir);
            zona.on('pointerout', stopDir);
        };

        // Posicionamiento de las zonas sobre los brazos de tu cruceta (ajuste de distancia a 45)
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
            anims.create({ key: 'walk-down', frames: anims.generateFrameNames('player_texture', { start: 0, end: 2 }), ...cfg });
            anims.create({ key: 'walk-left', frames: anims.generateFrameNames('player_texture', { start: 3, end: 5 }), ...cfg });
            anims.create({ key: 'walk-right', frames: anims.generateFrameNames('player_texture', { start: 6, end: 8 }), ...cfg });
            anims.create({ key: 'walk-up', frames: anims.generateFrameNames('player_texture', { start: 9, end: 11 }), ...cfg });
        }
    }

    update() {
        const speed = 130;
        this.player.setVelocity(0);
        let mov = false;

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

        if (!mov) {
            this.player.anims.stop();
            if (this.player.anims.currentAnim) {
                this.player.setFrame(this.player.anims.currentAnim.frames[1].frame.name);
            }
        }
    }
}