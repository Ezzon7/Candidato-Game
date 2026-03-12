export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.isResolvingFinal = false;
        this.npcHintCooldownUntil = 0;
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
        // Resetear flags de instancia que NO se reinician con scene.start()
        // (el constructor solo corre una vez al instanciar, no al reiniciar la escena).
        this.isResolvingFinal = false;
        this.npcHintCooldownUntil = 0;

        const { width, height } = this.scale;

        // --- CONFIGURACIÓN DEL MAPA ---
        const map = this.make.tilemap({ key: 'mapa' });
        const nombresTilesets = ['anfora', 'cabina', 'casillero1', 'casillero2', 'casillero3', 'escritorio', 'estante', 'mesa', 'pared_64', 'pared1', 'pared2', 'pared3', 'pizarra', 'puerta_64', 'puerta_cerrada_64', 'suelo_32', 'votacion'];
        const allTilesets = nombresTilesets.map(name => map.addTilesetImage(name, name));
        
        map.createLayer('Suelo', allTilesets, 0, 0);
        const paredesLayer = map.createLayer('Paredes', allTilesets, 0, 0);
        const objetosLayer = map.createLayer('Objetos', allTilesets, 0, 0); 
        const decoracionesLayer = map.createLayer('Decoraciones', allTilesets, 0, 0); 

        // Punto de interaccion de la mesa de votacion (tiles de votacion.png).
        const votacionTileIds = new Set([102, 103, 104, 105]);
        const votacionTiles = [];
        decoracionesLayer.forEachTile(tile => {
            if (votacionTileIds.has(tile.index)) {
                votacionTiles.push({ x: tile.getCenterX(), y: tile.getCenterY() });
            }
        });

        if (votacionTiles.length > 0) {
            const xs = votacionTiles.map(p => p.x);
            const ys = votacionTiles.map(p => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            this.anforaPos = {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            };

            // Radio dinamico: diagonal del bloque + margen amplio para comodidad.
            const halfW = (maxX - minX) / 2;
            const halfH = (maxY - minY) / 2;
            this.anforaInteractionRadius = Math.max(130, Math.sqrt((halfW * halfW) + (halfH * halfH)) + 72);
        } else {
            // Fallback defensivo si cambia el mapa o IDs.
            this.anforaPos = { x: 1504, y: 96 };
            this.anforaInteractionRadius = 130;
        }

        this.mesaPos = { x: 920, y: 100 };

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
        // enableCapture=false para no bloquear WASD/E en inputs HTML (formulario final).
        this.teclas = this.input.keyboard.addKeys('W,A,S,D', false);
        this.teclaE = this.input.keyboard.addKey('E', false);
        this.interactionPrompt = this.add.text(width / 2, height - 100, '', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0.85);

        this.systemMessage = this.add.text(width / 2, 40, '', {
            fontSize: '18px',
            color: '#fff8c6',
            backgroundColor: '#111111',
            padding: { x: 10, y: 6 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(999);

        this.playerSpeech = this.add.text(this.player.x, this.player.y - 55, '', {
            fontSize: '15px',
            color: '#111111',
            backgroundColor: '#ffffff',
            padding: { x: 8, y: 5 },
            wordWrap: { width: 260 },
            align: 'center'
        }).setOrigin(0.5).setVisible(false).setDepth(400);

        this.crearDPadCruceta();

        // --- MENSAJES Y UI ---
        this.msgCedula = this.add.image(930, 150, 'cedula_msg').setDepth(200).setVisible(false).setScale(0.5);
        this.msgValidacion = this.add.image(930, 150, 'validacion_beta_msg').setDepth(200).setVisible(false).setScale(0.5);

        // --- PERSISTENCIA DE ESTADOS DEL FLUJO ---
        this.tieneCedula = this.registry.get('tieneCedula');
        this.votoRealizado = this.registry.get('votoRealizado');
        this.votoEntregado = this.registry.get('votoEntregado');

        // Compatibilidad con estados antiguos si existen.
        if (typeof this.tieneCedula !== 'boolean') this.tieneCedula = this.registry.get('btnA_usado') || false;
        if (typeof this.votoRealizado !== 'boolean') this.votoRealizado = this.registry.get('btnB_usado') || false;
        if (typeof this.votoEntregado !== 'boolean') this.votoEntregado = this.registry.get('btnC_usado') || false;

        this.registry.set('tieneCedula', this.tieneCedula);
        this.registry.set('votoRealizado', this.votoRealizado);
        this.registry.set('votoEntregado', this.votoEntregado);

        // --- BOTONES DE INTERACCION (TACTIL) ---
        this.btnMesa = this.add.image(this.mesaPos.x, this.mesaPos.y, 'btn_interactuar')
            .setInteractive()
            .setScale(0.5)
            .setDepth(100)
            .setVisible(false);
        this.btnMesa.on('pointerdown', () => this.handleMesaInteraction());

        this.btnAnfora = this.add.image(this.anforaPos.x, this.anforaPos.y, 'btn_interactuar')
            .setInteractive()
            .setScale(0.5)
            .setDepth(100)
            .setVisible(false);
        this.btnAnfora.on('pointerdown', () => this.handleAnforaInteraction());

        // Boton de salida rapida.
        const btnSalir = this.add.rectangle(width - 70, 30, 120, 38, 0x8f1022)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .setDepth(500)
            .setStrokeStyle(2, 0xffffff);
        const txtSalir = this.add.text(width - 70, 30, 'Salir', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        btnSalir.on('pointerdown', () => {
            this.registry.set('playerX', this.player.x);
            this.registry.set('playerY', this.player.y);
            this.scene.start('MenuScene');
        });

        if (this.registry.get('mostrarMensajeRetorno')) {
            this.registry.set('mostrarMensajeRetorno', false);
            this.showPlayerSpeech('Ahora tengo que regresar a dejar mi cartilla.', 3500);
            this.showSystemMessage('Vuelve donde los miembros de mesa para entregar tu cartilla.', 3500);
        }

        if (!this.tieneCedula) {
            this.showSystemMessage('Miembros de mesa: Acercate y recoge tu cedula para votar.', 2800);
        }
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

        // --- LOGICA DE PROXIMIDAD PARA DIALOGO (apoyo1.png) ---
        const distApoyo = Phaser.Math.Distance.Between(this.player.x, this.player.y, 190, 950);
        const distApoyo2 = Phaser.Math.Distance.Between(this.player.x, this.player.y, 450, 630);
        const distApoyo3 = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1100, 800);
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

        const distMesa = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mesaPos.x, this.mesaPos.y);
        const distAnfora = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.anforaPos.x, this.anforaPos.y);

        // --- MENSAJE GUIA DE NPCS ---
        if (this.tieneCedula && !this.votoRealizado && (distApoyo < 70 || distApoyo2 < 70 || distApoyo3 < 70)) {
            if (this.time.now >= this.npcHintCooldownUntil) {
                this.npcHintCooldownUntil = this.time.now + 4500;
                this.showSystemMessage('NPC: Ve por tu derecha, marca tu voto y luego regresa a la mesa.', 3200);
            }
        }

        // --- VISIBILIDAD DE BOTONES INTERACTIVOS ---
        this.btnMesa.setVisible(distMesa < 35);
        this.btnAnfora.setVisible(this.tieneCedula && !this.votoRealizado && distAnfora < 100);

        // --- PROMPT CONTEXTUAL ---
        if (distMesa < 70) {
            if (!this.tieneCedula) this.setPrompt('Presiona E o boton para recoger tu cedula');
            else if (this.votoRealizado && !this.votoEntregado) this.setPrompt('Presiona E o boton para entregar tu cartilla');
            else if (!this.votoRealizado) this.setPrompt('Miembros de mesa: ve a tu derecha para marcar tu voto');
            else this.hidePrompt();
        } else if (distAnfora < this.anforaInteractionRadius) {
            if (!this.tieneCedula) this.setPrompt('Primero recoge tu cedula con los miembros de mesa');
            else if (!this.votoRealizado) this.setPrompt('Presiona E o boton para marcar en la mesa de votacion');
            else this.setPrompt('Ya marcaste tu voto. Regresa a la mesa');
        } else {
            this.hidePrompt();
        }

        if (Phaser.Input.Keyboard.JustDown(this.teclaE)) {
            if (distMesa < 70) this.handleMesaInteraction();
            else if (distAnfora < this.anforaInteractionRadius) this.handleAnforaInteraction();
        }

        if (this.playerSpeech.visible) {
            this.playerSpeech.setPosition(this.player.x, this.player.y - 52);
        }

        if (!mov) {
            this.player.anims.stop();
            if (this.player.anims.currentAnim) this.player.setFrame(this.player.anims.currentAnim.frames[1].frame.name);
        }
    }

    setPrompt(text) {
        this.interactionPrompt.setText(text).setVisible(true);
    }

    hidePrompt() {
        this.interactionPrompt.setVisible(false);
    }

    showSystemMessage(text, duration = 2500) {
        this.systemMessage.setText(text).setVisible(true);
        if (this.systemMessageTimer) this.systemMessageTimer.remove(false);
        this.systemMessageTimer = this.time.delayedCall(duration, () => {
            this.systemMessage.setVisible(false);
        });
    }

    showPlayerSpeech(text, duration = 2500) {
        this.playerSpeech.setText(text).setVisible(true);
        if (this.playerSpeechTimer) this.playerSpeechTimer.remove(false);
        this.playerSpeechTimer = this.time.delayedCall(duration, () => {
            this.playerSpeech.setVisible(false);
        });
    }

    handleMesaInteraction() {
        if (this.isResolvingFinal) return;

        if (!this.tieneCedula) {
            this.tieneCedula = true;
            this.registry.set('tieneCedula', true);
            this.registry.set('btnA_usado', true);
            this.msgCedula.setVisible(true);
            this.time.delayedCall(2200, () => this.msgCedula.setVisible(false));
            this.showSystemMessage('Miembros de mesa: Ve por tu derecha, marca y luego regresa.', 3200);
            this.showPlayerSpeech('Voy a la mesa de votacion de la derecha y luego regreso.', 3200);
            return;
        }

        if (!this.votoRealizado) {
            this.showSystemMessage('Miembros de mesa: Aun no marcas tu voto. Ve a la derecha.', 2600);
            this.showPlayerSpeech('Todavia no voto. Debo ir a marcar.', 2400);
            return;
        }

        if (!this.votoEntregado) {
            this.isResolvingFinal = true;
            this.votoEntregado = true;
            this.registry.set('votoEntregado', true);
            this.registry.set('btnC_usado', true);
            this.msgValidacion.setVisible(true);
            this.showPlayerSpeech('Listo, ahora esperan la validacion final.', 2400);
            this.time.delayedCall(1800, () => {
                this.msgValidacion.setVisible(false);
                const esCorrecto = this.registry.get('votoEspecial') || false;
                if (esCorrecto) this.scene.start('WinScene');
                else this.scene.start('LoseScene');
            });
        }
    }

    handleAnforaInteraction() {
        if (!this.tieneCedula) {
            this.showSystemMessage('Primero recoge tu cedula con los miembros de mesa.', 2200);
            return;
        }
        if (this.votoRealizado) {
            this.showSystemMessage('Ya marcaste tu voto. Regresa a entregar tu cartilla.', 2200);
            return;
        }

        this.registry.set('playerX', this.player.x);
        this.registry.set('playerY', this.player.y);
        this.scene.start('VotingScene');
    }
}