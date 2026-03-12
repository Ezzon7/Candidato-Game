export class LoseScene extends Phaser.Scene {
    constructor() {
        super('LoseScene');
    }

    create() {
        const { width, height } = this.scale;
        
        // Fondo rojo suave
        this.add.rectangle(width/2, height/2, width, height, 0xffe0e0);

        this.add.text(width/2, height/2 - 50, 'VOTO INCORRECTO.\nInténtalo de nuevo', {
            fontSize: '32px',
            color: '#ff0000',
            align: 'center',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Botón Reintentar
        const btn = this.add.rectangle(width/2, height/2 + 80, 200, 50, 0xffffff).setInteractive().setStrokeStyle(2, 0x000000);
        this.add.text(width/2, height/2 + 80, 'Reintentar', { fontSize: '24px', color: '#000' }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            // Limpiamos los datos de progreso manualmente
            this.registry.set('btnA_usado', false);
            this.registry.set('btnB_usado', false);
            this.registry.set('btnC_usado', false);
            this.registry.set('tieneCedula', false);
            this.registry.set('votoRealizado', false);
            this.registry.set('votoEntregado', false);
            this.registry.set('mostrarMensajeRetorno', false);
            this.registry.set('playerX', 260); // Volver al inicio de la escuela
            this.registry.set('playerY', 1450);
            this.registry.set('votoEspecial', false);

            this.scene.start('GameScene');
        });
    }
}