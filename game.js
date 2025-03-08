const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let balloons = [];
let letters = [];
let threads = [];
let pump, pumpHandle, airBlow;
const INFLATE_SPEED = 0.01;
const MAX_SIZE_BALLOON = 0.25;
const MAX_SIZE_LETTER = 0.05;
let pumpHandleTween;
let currentLetterIndex = 0;

function preload() {
    this.load.image('background', 'assets/baground.png');
    this.load.image('pump', 'assets/air_container.png');
    this.load.image('pump_handle', 'assets/pump_handle.png');
    this.load.image('air_blow', 'assets/air_blow.png');
    this.load.image('thread', 'assets/thread.png');

    for (let i = 1; i <= 26; i++) {
        this.load.image(`balloon${i}`, `assets/ballon${i}.png`);
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let letter of alphabet) {
        this.load.image(`letter${letter}`, `assets/${letter}.png`);
    }
}

function create() {
    const background = this.add.image(config.width / 2, config.height / 2, 'background');
    background.displayWidth = config.width;
    background.displayHeight = config.height;

    const pumpX = config.width - 130;
    const pumpY = config.height - 130;

    pump = this.add.image(pumpX, pumpY, 'pump').setScale(0.5);
    pumpHandle = this.add.image(pumpX, pumpY - 155, 'pump_handle').setScale(0.4).setInteractive({ useHandCursor: true }); //cursor only on handle
    airBlow = this.add.image(pumpX - 120, pumpY, 'air_blow').setScale(0.3);

    pumpHandle.on('pointerdown', () => {
        if (currentLetterIndex < 26) {
            startPumpAnimation();
        }
    });
}

function startPumpAnimation() {
    if (!pumpHandleTween) {
        pumpHandleTween = pumpHandle.scene.tweens.add({
            targets: pumpHandle,
            y: pumpHandle.y + 75,
            duration: 200,
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                pumpHandleTween = null;
                pumpHandle.y = pump.y - 155;
                createBalloon(airBlow.x, airBlow.y);
            }
        });
    }
}

function createBalloon(x, y) {
    currentLetterIndex++;
    const balloon = game.scene.scenes[0].physics.add.image(x, y, `balloon${currentLetterIndex}`).setScale(0.05);
    let balloonData = { balloon, inflated: false };
    balloons.push(balloonData);

    balloon.setInteractive();
    balloon.on('pointerdown', () => removeBalloon(balloon));

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = game.scene.scenes[0].add.image(x, y, `letter${alphabet[currentLetterIndex - 1]}`).setScale(0.05);
    letters.push(letter);

    const thread = game.scene.scenes[0].add.image(x, y + 50, 'thread').setScale(0.2).setDepth(1);
    threads.push(thread);

    game.scene.scenes[0].tweens.add({
        targets: balloon,
        scaleX: MAX_SIZE_BALLOON,
        scaleY: MAX_SIZE_BALLOON,
        duration: 800,
        ease: 'Linear',
        onComplete: () => {
            balloonData.inflated = true;
            balloon.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-200, -100));
        }
    });

    game.scene.scenes[0].tweens.add({
        targets: letter,
        scaleX: MAX_SIZE_LETTER,
        scaleY: MAX_SIZE_LETTER,
        duration: 800,
        ease: 'Linear',
    });
}

function removeBalloon(balloon) {
    const index = balloons.findIndex(b => b.balloon === balloon);
    if (index !== -1) {
        balloons[index].balloon.destroy();
        letters[index].destroy();
        threads[index].destroy();
        balloons.splice(index, 1);
        letters.splice(index, 1);
        threads.splice(index, 1);
    }
}

function update() {
    balloons.forEach((balloonData, index) => {
        let { balloon, inflated } = balloonData;
        if (inflated) {
            letters[index].x = balloon.x;
            letters[index].y = balloon.y;
            threads[index].x = balloon.x;
            threads[index].y = balloon.y + 80;

            if (balloon.y < 0) {
                balloon.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(100, 200));
            } else if (balloon.y > config.height) {
                balloon.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-200, -100));
            }

            if (balloon.x < 0 || balloon.x > config.width) {
                balloon.setVelocity(Phaser.Math.Between(balloon.x < 0 ? 100 : -100, balloon.x < 0 ? 200 : -200), balloon.body.velocity.y);
            }

            balloon.x = Phaser.Math.Clamp(balloon.x, 0, config.width);
            balloon.y = Phaser.Math.Clamp(balloon.y, 0, config.height);
        }
    });
}