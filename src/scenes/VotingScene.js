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
        this.selectedCandidate = null;
        this.votes = {}; // { candidateId: { marked: false, number: '' } }
        this.inputActive = null; // candidateId
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
        
        // Background
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

            // Party Name
            this.add.text(width/2 - 250, y, can.name, { 
                fontSize: '16px', color: '#000', fontStyle: 'bold', wordWrap: { width: 140 }
            }).setOrigin(0, 0.5);

            // 1st Box: Logo
            const logoContainer = this.add.container(width/2 + 10, y);
            const logoBg = this.add.rectangle(0, 0, 70, 70, 0xffffff).setStrokeStyle(2, 0x000000).setInteractive();
            const logoImg = this.add.image(0, 0, can.logo).setDisplaySize(60, 60);
            logoContainer.add([logoBg, logoImg]);

            const graphicsMark = this.add.graphics();
            logoContainer.add(graphicsMark);
            can.graphicsMark = graphicsMark;

            logoBg.on('pointerdown', () => this.openMinigame(can));

            // 2nd Box: Number (19)
            const boxNum = this.add.rectangle(width/2 + 90, y, 70, 70, 0xffffff).setStrokeStyle(2, 0x000000).setInteractive();
            const numText = this.add.text(width/2 + 90, y, '', { fontSize: '36px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
            can.numText = numText;
            can.boxNum = boxNum;

            // 3rd Box: Always Empty
            this.add.rectangle(width/2 + 170, y, 70, 70, 0xffffff).setStrokeStyle(2, 0x000000);

            const handleInput = () => {
                if (!this.votes[can.id].marked) {
                    this.showMessage("Primero marca el partido con una X");
                    return;
                }
                this.inputActive = can.id;
                this.candidates.forEach(c => c.boxNum.setFillStyle(0xffffff));
                boxNum.setFillStyle(0xffffcc);
            };

            boxNum.on('pointerdown', handleInput);
        });

        // Confirm Button
        const btn = this.add.rectangle(width/2, height/2 + 240, 180, 50, 0xf0e68c).setInteractive().setStrokeStyle(2, 0x000000);
        this.add.text(width/2, height/2 + 240, 'Confirmar', { fontSize: '22px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);

        btn.on('pointerdown', () => this.validateVote());

        // Key Input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.inputActive) return;
            const can = this.candidates.find(c => c.id === this.inputActive);
            
            if (event.keyCode >= 48 && event.keyCode <= 57) { // 0-9
                if (this.votes[can.id].number.length < 2) {
                    this.votes[can.id].number += event.key;
                    can.numText.setText(this.votes[can.id].number);
                }
            } else if (event.keyCode === 8) { // Backspace
                this.votes[can.id].number = this.votes[can.id].number.slice(0, -1);
                can.numText.setText(this.votes[can.id].number);
            }
        });

        this.feedback = this.add.text(width/2, height/2 + 290, '', { fontSize: '20px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
    }

    openMinigame(candidate) {
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9).setInteractive();
        const logoArea = this.add.rectangle(width/2, height/2, 400, 400, 0xffffff).setStrokeStyle(4, 0x000000);
        const zoomLogo = this.add.image(width/2, height/2, candidate.logo).setDisplaySize(380, 380).setAlpha(0.3);
        const msg = this.add.text(width/2, height/2 - 250, 'Dibuja una X sobre el logo', { fontSize: '28px', color: '#fff' }).setOrigin(0.5);

        const drawingGraphics = this.add.graphics();
        drawingGraphics.lineStyle(8, 0x000000);
        
        let isDrawing = false;
        let strokes = 0;
        let points = [];

        // Change Cursor to Pencil
        this.input.setDefaultCursor('url(assets/images/pencil-cursor.png), pointer');

        const onMove = (pointer) => {
            if (isDrawing) {
                drawingGraphics.lineTo(pointer.x, pointer.y);
                drawingGraphics.strokePath();
                points.push({ x: pointer.x, y: pointer.y });
            }
        };

        const onDown = (pointer) => {
            if (pointer.x > width/2 - 200 && pointer.x < width/2 + 200 && 
                pointer.y > height/2 - 200 && pointer.y < height/2 + 200) {
                isDrawing = true;
                drawingGraphics.beginPath();
                drawingGraphics.moveTo(pointer.x, pointer.y);
                strokes++;
            }
        };

        const onUp = () => {
            isDrawing = false;
        };

        this.input.on('pointerdown', onDown);
        this.input.on('pointermove', onMove);
        this.input.on('pointerup', onUp);

        // Done button to analyze
        const doneBtn = this.add.rectangle(width/2, height/2 + 250, 150, 50, 0x00ff00).setInteractive();
        const doneText = this.add.text(width/2, height/2 + 250, 'Listo', { fontSize: '22px', color: '#000' }).setOrigin(0.5);

        doneBtn.on('pointerdown', () => {
            // Simple X Detection: At least 2 strokes and some points
            if (strokes >= 2 && points.length > 20) {
                this.votes[candidate.id].marked = true;
                this.drawMarkOnBallot(candidate, points);
                this.cleanupMinigame();
            } else {
                this.showMessage("Dibuja una X más clara (al menos 2 trazos)");
            }
        });

        this.cleanupMinigame = () => {
            this.input.off('pointerdown', onDown);
            this.input.off('pointermove', onMove);
            this.input.off('pointerup', onUp);
            this.input.setDefaultCursor('default');
            overlay.destroy();
            logoArea.destroy();
            zoomLogo.destroy();
            msg.destroy();
            drawingGraphics.destroy();
            doneBtn.destroy();
            doneText.destroy();
        };
    }

    drawMarkOnBallot(candidate, points) {
        const { width, height } = this.scale;
        const g = candidate.graphicsMark;
        g.lineStyle(4, 0xff0000);
        
        // Find bounds of drawing to scale it down
        let minX = Math.min(...points.map(p => p.x));
        let maxX = Math.max(...points.map(p => p.x));
        let minY = Math.min(...points.map(p => p.y));
        let maxY = Math.max(...points.map(p => p.y));

        const drawW = maxX - minX;
        const drawH = maxY - minY;
        const scale = 50 / Math.max(drawW, drawH);

        g.beginPath();
        points.forEach((p, i) => {
            const tx = (p.x - (minX + drawW/2)) * scale;
            const ty = (p.y - (minY + drawH/2)) * scale;
            
            // Check if it's a new stroke (distance jump)
            if (i > 0) {
                const dist = Phaser.Math.Distance.Between(points[i-1].x, points[i-1].y, p.x, p.y);
                if (dist > 30) {
                    g.moveTo(tx, ty);
                } else {
                    g.lineTo(tx, ty);
                }
            } else {
                g.moveTo(tx, ty);
            }
        });
        g.strokePath();
    }

    validateVote() {
        const selected = Object.keys(this.votes).filter(id => this.votes[id].marked || this.votes[id].number !== '');
        
        if (selected.length === 0) {
            this.showMessage("No has marcado nada");
            return;
        }

        if (selected.length > 1) {
            this.showMessage("Voto Nulo: Has marcado más de un partido");
            return;
        }

        const id = selected[0];
        const vote = this.votes[id];

        if (id === 'peru' && vote.number === '19') {
            this.feedback.setText("¡VOTO CORRECTO!").setColor('#00ff00');
        } else {
            this.feedback.setText("Estás marcando incorrectamente").setColor('#ff0000');
        }
    }

    showMessage(txt) {
        this.feedback.setText(txt).setColor('#ff0000');
        this.time.delayedCall(2000, () => {
            if (this.feedback.text === txt) this.feedback.setText('');
        });
    }
}
