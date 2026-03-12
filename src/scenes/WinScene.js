export class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    create() {
        const { width, height } = this.scale;
        
        // Fondo verde suave
        this.add.rectangle(width/2, height/2, width, height, 0xe0ffe0);

        this.add.text(width/2, height/2, 'HAS GANADO.\nFELICIDADES!!!!!', {
            fontSize: '42px',
            color: '#00aa00',
            align: 'center',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
}