export class VotingScene extends Phaser.Scene {
    constructor() {
        super('VotingScene');
        this.candidates = [
            { id: 'fuerza', name: 'FUERZA POR EL CAMBIO', logo: 'logo_fuerza' },
            { id: 'peru', name: 'PERÚ PRIMERO', logo: 'logo_peru' },
            { id: 'pais', name: 'POR EL PAÍS', logo: 'logo_pais' },
            { id: 'podemos', name: 'PODEMOS JUNTOS', logo: 'logo_podemos' },
            { id: 'solidaridad', name: 'CON SOLIDARIDAD', logo: 'logo_solidaridad' }
        ];
        this.votes = {}; 
        this.inputActive = null;
    }

    preload() {
        this.load.image('logo_fuerza', '../../assets/images/partidos/fuerza-por-el-cambio.png');
        this.load.image('logo_peru', '../../assets/images/partidos/peru-primero.png');
        this.load.image('logo_pais', '../../assets/images/partidos/por-el-pais.png');
        this.load.image('logo_podemos', '../../assets/images/partidos/podemos-juntos.png');
        this.load.image('logo_solidaridad', '../../assets/images/partidos/con-solidaridad.png');
        this.load.image('pencil', '../../assets/images/pencil-cursor.png');
    }

    create() {
        const { width, height } = this.scale;
        
        // Fondo y Tarjeta
        this.add.rectangle(width/2, height/2, width, height, 0xeeeeee);
        const cardWidth = 550;
        const cardHeight = 550;
        this.add.rectangle(width/2, height/2, cardWidth, cardHeight, 0xe0ffff).setStrokeStyle(2, 0x000000);

        this.add.text(width/2, height/2 - 240, 'SENADORES', { 
            fontSize: '32px', color: '#000', fontStyle: 'bold' 
        }).setOrigin(0.5);

        let startY = height/2 - 180;
        const rowHeight = 85;

        this.candidates.forEach((can, index) => {
            const y = startY + (index * rowHeight);
            this.votes[can.id] = { marked: false, number: '' };

            this.add.text(width/2 - 250, y, can.name, { 
                fontSize: '16px', color: '#000', fontStyle: 'bold', wordWrap: { width: 140 }
            }).setOrigin(0, 0.5);

            const logoContainer = this.add.container(width/2 + 10, y);
            const logoBg = this.add.rectangle(0, 0, 70, 70, 0xffffff).setStrokeStyle(2, 0x000000).setInteractive();
            const logoImg = this.add.image(0, 0, can.logo).setDisplaySize(60, 60);
            logoContainer.add([logoBg, logoImg]);

            const graphicsMark = this.add.graphics();
            logoContainer.add(graphicsMark);
            can.graphicsMark = graphicsMark;

            logoBg.on('pointerdown', () => this.openMinigame(can));

            const boxNum = this.add.rectangle(width/2 + 90, y, 70, 70, 0xffffff).setStrokeStyle(2, 0x000000).setInteractive();
            const numText = this.add.text(width/2 + 90, y, '', { fontSize: '36px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
            can.numText = numText;
            can.boxNum = boxNum;

            this.add.rectangle(width/2 + 170, y, 70, 70, 0xffffff).setStrokeStyle(2, 0x000000);

            boxNum.on('pointerdown', () => {
                if (!this.votes[can.id].marked) {
                    this.showMessage("Primero marca el partido con una X");
                    return;
                }
                this.inputActive = can.id;
                this.candidates.forEach(c => c.boxNum.setFillStyle(0xffffff));
                boxNum.setFillStyle(0xffffcc);
            });
        });

        // --- BOTONES INFERIORES ---
        const btnConfirm = this.add.rectangle(width/2 - 100, height/2 + 240, 180, 50, 0xf0e68c).setInteractive().setStrokeStyle(2, 0x000000);
        this.add.text(width/2 - 100, height/2 + 240, 'Confirmar', { fontSize: '22px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        btnConfirm.on('pointerdown', () => this.showConfirmationWindow());

        const btnClean = this.add.rectangle(width/2 + 100, height/2 + 240, 180, 50, 0xffcccc).setInteractive().setStrokeStyle(2, 0x000000);
        this.add.text(width/2 + 100, height/2 + 240, 'Limpiar', { fontSize: '22px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        btnClean.on('pointerdown', () => this.clearBallot());

        // --- VENTANA DE CONFIRMACIÓN (Modal) ---
        this.confirmContainer = this.add.container(0, 0).setDepth(1000).setVisible(false);
        const modalBg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.6).setInteractive();
        const winBox = this.add.rectangle(width/2, height/2, 400, 200, 0xffffff).setStrokeStyle(4, 0x000000);
        const winText = this.add.text(width/2, height/2 - 40, '¿Estás seguro que deseas\nconfirmar tu voto?', { 
            fontSize: '20px', color: '#000', align: 'center', fontStyle: 'bold' 
        }).setOrigin(0.5);

        const btnSi = this.add.rectangle(width/2 - 80, height/2 + 40, 100, 40, 0x90ee90).setInteractive().setStrokeStyle(2, 0x000000);
        const txtSi = this.add.text(width/2 - 80, height/2 + 40, 'SÍ', { color: '#000' }).setOrigin(0.5);
        btnSi.on('pointerdown', () => {
            this.confirmContainer.setVisible(false);
            this.validateVote();
        });

        const btnNo = this.add.rectangle(width/2 + 80, height/2 + 40, 100, 40, 0xffcccb).setInteractive().setStrokeStyle(2, 0x000000);
        const txtNo = this.add.text(width/2 + 80, height/2 + 40, 'NO', { color: '#000' }).setOrigin(0.5);
        btnNo.on('pointerdown', () => this.confirmContainer.setVisible(false));

        this.confirmContainer.add([modalBg, winBox, winText, btnSi, txtSi, btnNo, txtNo]);

        // Teclado
        this.input.keyboard.on('keydown', (event) => {
            if (!this.inputActive || this.confirmContainer.visible) return;
            const can = this.candidates.find(c => c.id === this.inputActive);
            if (event.keyCode >= 48 && event.keyCode <= 57) {
                if (this.votes[can.id].number.length < 2) {
                    this.votes[can.id].number += event.key;
                    can.numText.setText(this.votes[can.id].number);
                }
            } else if (event.keyCode === 8) {
                this.votes[can.id].number = this.votes[can.id].number.slice(0, -1);
                can.numText.setText(this.votes[can.id].number);
            }
        });

        this.feedback = this.add.text(width/2, height/2 + 290, '', { fontSize: '20px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
    }

    showConfirmationWindow() {
        this.confirmContainer.setVisible(true);
    }

    clearBallot() {
        this.candidates.forEach(can => {
            this.votes[can.id].marked = false;
            this.votes[can.id].number = '';
            can.graphicsMark.clear();
            can.numText.setText('');
            can.boxNum.setFillStyle(0xffffff);
        });
        this.inputActive = null;
        this.feedback.setText("Cédula limpiada").setColor('#0000ff');
        this.time.delayedCall(1500, () => this.feedback.setText(''));
    }

    // --- VALIDACIÓN DE VOTOS ---
    validateVote() {
        // Filtrar qué IDs tienen algo marcado o algún número escrito
        const selected = Object.keys(this.votes).filter(id => this.votes[id].marked || this.votes[id].number !== '');
        
        // 1. CASO VOTO EN BLANCO
        if (selected.length === 0) {
            this.showMessage("Voto en blanco: Seleccione una opción");
            return;
        }

        // 2. CASO VOTO NULO
        if (selected.length > 1) {
            this.showMessage("Voto nulo: Has marcado más de un partido");
            return;
        }

        // 3. CASO VOTO VÁLIDO (Solo queda una opción seleccionada)
        const id = selected[0];
        const vote = this.votes[id];

        // Comprobar si es el voto específico para el final "Especial"
        if (id === 'peru' && vote.number === '19') {
            this.registry.set('votoEspecial', true); // Boolean en TRUE
        } else {
            this.registry.set('votoEspecial', false); // Boolean en FALSE (votó por otro o con otro número)
        }

        this.feedback.setText("¡VOTO VÁLIDO!").setColor('#00ff00');
        
        // Retorno automático tras 3 segundos
        this.time.delayedCall(3000, () => {
            this.scene.start('GameScene');
        });
    }

    // --- MINIJUEGO DE DIBUJO ---
    openMinigame(candidate) {
        if (this.confirmContainer.visible) return;
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9).setInteractive();
        const logoArea = this.add.rectangle(width/2, height/2, 400, 400, 0xffffff).setStrokeStyle(4, 0x000000);
        const zoomLogo = this.add.image(width/2, height/2, candidate.logo).setDisplaySize(380, 380).setAlpha(0.3);
        const msg = this.add.text(width/2, height/2 - 250, 'Dibuja una X sobre el logo', { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
        const drawingGraphics = this.add.graphics().lineStyle(8, 0x000000);
        
        let isDrawing = false; let strokes = 0; let points = [];
        this.input.setDefaultCursor('url(../../assets/images/pencil-cursor.png), pointer');

        const onMove = (p) => { if (isDrawing) { drawingGraphics.lineTo(p.x, p.y); drawingGraphics.strokePath(); points.push({ x: p.x, y: p.y }); } };
        const onDown = (p) => { if (p.x > width/2 - 200 && p.x < width/2 + 200 && p.y > height/2 - 200 && p.y < height/2 + 200) { isDrawing = true; drawingGraphics.beginPath(); drawingGraphics.moveTo(p.x, p.y); strokes++; } };
        this.input.on('pointerdown', onDown); this.input.on('pointermove', onMove); this.input.on('pointerup', () => isDrawing = false);

        const doneBtn = this.add.rectangle(width/2, height/2 + 250, 150, 50, 0x00ff00).setInteractive();
        const doneText = this.add.text(width/2, height/2 + 250, 'Listo', { fontSize: '22px', color: '#000' }).setOrigin(0.5);

        doneBtn.on('pointerdown', () => {
            if (strokes >= 2 && points.length > 20) {
                this.votes[candidate.id].marked = true;
                this.drawMarkOnBallot(candidate, points);
                this.cleanupMinigame();
            } else {
                this.showMessage("Dibuja una X más clara (al menos 2 trazos)");
            }
        });

        this.cleanupMinigame = () => {
            this.input.off('pointerdown', onDown); this.input.off('pointermove', onMove);
            this.input.setDefaultCursor('default');
            overlay.destroy(); logoArea.destroy(); zoomLogo.destroy(); msg.destroy();
            drawingGraphics.destroy(); doneBtn.destroy(); doneText.destroy();
        };
    }

    drawMarkOnBallot(candidate, points) {
        const g = candidate.graphicsMark; g.lineStyle(4, 0xff0000);
        let minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
        let minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
        const drawW = maxX - minX, drawH = maxY - minY, scale = 50 / Math.max(drawW, drawH);
        g.beginPath();
        points.forEach((p, i) => {
            const tx = (p.x - (minX + drawW/2)) * scale, ty = (p.y - (minY + drawH/2)) * scale;
            if (i > 0) { if (Phaser.Math.Distance.Between(points[i-1].x, points[i-1].y, p.x, p.y) > 30) g.moveTo(tx, ty); else g.lineTo(tx, ty); } else g.moveTo(tx, ty);
        });
        g.strokePath();
    }

    showMessage(txt) {
        this.feedback.setText(txt).setColor('#ff0000');
        this.time.delayedCall(2000, () => { if (this.feedback.text === txt) this.feedback.setText(''); });
    }
}