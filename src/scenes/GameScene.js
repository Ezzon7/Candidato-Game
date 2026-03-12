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
        
        // --- MENSAJES ---
        this.load.image('cedula_msg', '../../assets/images/cedula-msg.png');
        this.load.image('validacion_beta_msg', '../../assets/images/validacion-beta-msg.png');
        
        // Carga de la imagen de diálogo/apoyo
        this.load.image('apoyo1', '../../assets/images/apoyo1.png');
        this.load.image('apoyo2', '../../assets/images/apoyo2.png');
        this.load.image('apoyo3', '../../assets/images/apoyo3.png');

        // --- NPC ---
        this.load.image('personero1', '../../assets/characters/personero1.png');
        this.load.image('personero2', '../../assets/characters/personero2.png');
        this.load.image('personero3', '../../assets/characters/personero3.png');
        this.load.image('npc1', '../../assets/characters/npc1.png');
        this.load.image('npc2', '../../assets/characters/npc2.png');
        this.load.image('npc3', '../../assets/characters/npc3.png');
        this.load.image('npc4', '../../assets/characters/npc4.png');
        this.load.image('npc5', '../../assets/characters/npc5.png');
        this.load.image('npc6', '../../assets/characters/npc6.png');
    }

    create() {
        const { width, height } = this.scale;

        // --- CONFIGURACIÓN DEL MAPA ---
        const map = this.make.tilemap({ key: 'mapa' });
        const nombresTilesets = ['anfora', 'cabina', 'casillero1', 'casillero2', 'casillero3', 'escritorio', 'estante', 'mesa', 'pared_64', 'pared1', 'pared2', 'pared3', 'pizarra', 'puerta_64', 'puerta_cerrada_64', 'suelo_32', 'votacion'];
        const allTilesets = nombresTilesets.map(name => map.addTilesetImage(name, name));
        
        map.createLayer('Suelo', allTilesets, 0, 0);
        const paredesLayer = map.createLayer('Paredes', allTilesets, 0, 0);
        const objetosLayer = map.createLayer('Objetos', allTilesets, 0, 0); 
        const decoracionesLayer = map.createLayer('Decoraciones', allTilesets, 0, 0); 

        this.anforaPos = null;
        decoracionesLayer.forEachTile(tile => {
            if (tile.index >= 94 && tile.index <= 97) {
                if (!this.anforaPos) this.anforaPos = { x: tile.getCenterX(), y: tile.getCenterY() };
            }
        });

        paredesLayer.setCollisionByProperty({ collides: true });
        if (objetosLayer) objetosLayer.setCollisionByProperty({ collides: true });

        // --- NPC CON COLISIÓN ---
        this.npcsGroup = this.physics.add.staticGroup();
        this.npcsGroup.create(920, 68, 'personero1').refreshBody();
        this.npcsGroup.create(960, 68, 'personero2').setScale(1.1).refreshBody();
        this.npcsGroup.create(1000, 69, 'personero3').refreshBody();
        this.npcsGroup.create(150, 950, 'npc1').refreshBody();
        this.npcsGroup.create(190, 952, 'npc2').refreshBody();
        this.npcsGroup.create(1100, 830, 'npc3').refreshBody();
        this.npcsGroup.create(1140, 830, 'npc4').refreshBody();
        this.npcsGroup.create(450, 630, 'npc5').refreshBody();
        this.npcsGroup.create(490, 630, 'npc6').refreshBody();

        // --- IMAGEN DE APOYO/DIÁLOGO ---
        // Nace invisible en la posición (150, 970)
        this.dialogoApoyo = this.add.image(210, 900, 'apoyo1').setDepth(300).setVisible(false).setScale(0.6);
        this.dialogoApoyo2 = this.add.image(510, 580, 'apoyo2').setDepth(300).setVisible(false).setScale(0.6);
        this.dialogoApoyo3 = this.add.image(1150, 780, 'apoyo3').setDepth(300).setVisible(false).setScale(0.6);

        // --- GENERACIÓN DE FRAMES DEL PERSONAJE ---
        const texture = this.textures.get('player_texture');
        const fW = 35; const fH = 47.5; 
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                const i = (r * 3) + c;
                texture.add(i, 0, Math.floor(c * fW) + 2, Math.floor(r * fH), fW - 4, Math.floor(fH));
            }
        }

        // --- ENTIDADES Y FÍSICA ---
        const spawnX = this.registry.get('playerX') || 260;
        const spawnY = this.registry.get('playerY') || 1450;

        this.player = this.physics.add.sprite(spawnX, spawnY, 'player_texture', 1);
        this.player.body.setSize(16, 12).setOffset(5, 35);
        this.player.setDepth(10); 
        this.createAnimations();

        this.physics.add.collider(this.player, paredesLayer);
        if (objetosLayer) this.physics.add.collider(this.player, objetosLayer);
        this.physics.add.collider(this.player, this.npcsGroup);
        
        // --- CÁMARA ---
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.8);

        // --- CONTROLES ---
        this.teclas = this.input.keyboard.addKeys('W,A,S,D');
        this.teclaE = this.input.keyboard.addKey('E');
        this.interactionPrompt = this.add.text(width / 2, height - 100, 'Presiona E para votar', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0.8);

        this.crearDPadCruceta();

        // --- MENSAJES Y UI ---
        this.msgCedula = this.add.image(930, 150, 'cedula_msg').setDepth(200).setVisible(false).setScale(0.5);
        this.msgValidacion = this.add.image(930, 150, 'validacion_beta_msg').setDepth(200).setVisible(false).setScale(0.5);

        // --- PERSISTENCIA DE ESTADOS ---
        this.btnA_usado = this.registry.get('btnA_usado') || false;
        this.btnB_usado = this.registry.get('btnB_usado') || false;
        this.btnC_usado = this.registry.get('btnC_usado') || false;

        // --- BOTONES DE INTERACCIÓN ---
        this.btnA = this.add.image(920, 100, 'btn_interactuar').setInteractive().setScale(0.5).setDepth(100).setVisible(false);
        this.btnA.on('pointerdown', () => {
            this.btnA_usado = true;
            this.registry.set('btnA_usado', true);
            this.btnA.setVisible(false);
            this.msgCedula.setVisible(true);
            this.time.delayedCall(3000, () => this.msgCedula.setVisible(false));
        });

        this.btnB = this.add.image(1555, 82, 'btn_interactuar').setInteractive().setScale(0.5).setDepth(100).setVisible(false);
        this.btnB.on('pointerdown', () => {
            this.btnB_usado = true;
            this.registry.set('btnB_usado', true);
            this.btnB.setVisible(false);
            this.registry.set('playerX', this.player.x);
            this.registry.set('playerY', this.player.y);
            this.scene.start('VotingScene');
        });

        this.btnC = this.add.image(920, 100, 'btn_interactuar').setInteractive().setScale(0.5).setDepth(100).setVisible(false);
        this.btnC.on('pointerdown', () => {
            this.btnC_usado = true;
            this.registry.set('btnC_usado', true);
            this.btnC.setVisible(false);
            this.msgValidacion.setVisible(true);
            this.time.delayedCall(3000, () => {
                this.msgValidacion.setVisible(false);
                const esCorrecto = this.registry.get('votoEspecial') || false;
                if (esCorrecto) this.scene.start('WinScene');
                else this.scene.start('LoseScene');
            });
        });
    }

    crearDPadCruceta() {
        const { width, height } = this.scale;
        const xBase = width - 300; const yBase = height - 250;
        const crucetaImg = this.add.image(xBase, yBase, 'dpad_cruceta').setScrollFactor(0).setAlpha(0.6).setScale(0.10);
        this.touchControl = { up: false, down: false, left: false, right: false };
        const crearZona = (x, y, dir) => {
            const zona = this.add.rectangle(x, y, 60, 60, 0x000000, 0).setInteractive().setScrollFactor(0);
            const stop = () => { this.touchControl[dir] = false; if (!Object.values(this.touchControl).includes(true)) crucetaImg.setAlpha(0.6); };
            zona.on('pointerdown', () => { this.touchControl[dir] = true; crucetaImg.setAlpha(1); });
            zona.on('pointerup', stop); zona.on('pointerout', stop);
        };
        const dist = 45;
        crearZona(xBase, yBase - dist, 'up'); crearZona(xBase, yBase + dist, 'down');
        crearZona(xBase - dist, yBase, 'left'); crearZona(xBase + dist, yBase, 'right');
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
        if (this.teclas.A.isDown || this.touchControl.left) { this.player.setVelocityX(-speed); this.player.anims.play('walk-left', true); mov = true; }
        else if (this.teclas.D.isDown || this.touchControl.right) { this.player.setVelocityX(speed); this.player.anims.play('walk-right', true); mov = true; }
        if (this.teclas.W.isDown || this.touchControl.up) { this.player.setVelocityY(-speed); if (!mov) this.player.anims.play('walk-up', true); mov = true; }
        else if (this.teclas.S.isDown || this.touchControl.down) { this.player.setVelocityY(speed); if (!mov) this.player.anims.play('walk-down', true); mov = true; }

        // --- LÓGICA DE PROXIMIDAD PARA DIÁLOGO (apoyo1.png) ---
        const distApoyo = Phaser.Math.Distance.Between(this.player.x, this.player.y, 190, 950);
        const distApoyo2 = Phaser.Math.Distance.Between(this.player.x, this.player.y, 450, 630);
        const distApoyo3 = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1100, 800);
        // Si el jugador está a menos de 40 píxeles, la imagen aparece
        if (distApoyo < 60) {
            this.dialogoApoyo.setVisible(true);
        } else {
            this.dialogoApoyo.setVisible(false);
        }

        if (distApoyo2 < 60) {
            this.dialogoApoyo2.setVisible(true);
        } else {
            this.dialogoApoyo2.setVisible(false);
        }

        if (distApoyo3 < 60) {
            this.dialogoApoyo3.setVisible(true);
        } else {
            this.dialogoApoyo3.setVisible(false);
        }

        // --- VISIBILIDAD BOTONES ---
        if (!this.btnA_usado) {
            const distA = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.btnA.x, this.btnA.y);
            this.btnA.setVisible(distA < 30);
        } else this.btnA.setVisible(false);

        if (this.btnA_usado && !this.btnB_usado) {
            const distB = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.btnB.x, this.btnB.y);
            this.btnB.setVisible(distB < 30);
        } else this.btnB.setVisible(false);

        if (this.btnB_usado && !this.btnC_usado) {
            const distC = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.btnC.x, this.btnC.y);
            this.btnC.setVisible(distC < 30);
        } else this.btnC.setVisible(false);

        if (this.anforaPos) {
            const distAnfora = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.anforaPos.x, this.anforaPos.y);
            if (distAnfora < 60) {
                this.interactionPrompt.setVisible(true);
                if (Phaser.Input.Keyboard.JustDown(this.teclaE)) this.scene.start('VotingScene');
            } else this.interactionPrompt.setVisible(false);
        }

        if (!mov) {
            this.player.anims.stop();
            if (this.player.anims.currentAnim) this.player.setFrame(this.player.anims.currentAnim.frames[1].frame.name);
        }
    }
}