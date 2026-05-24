const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, platforms, coins, goldCoins, gadgets, scoreText, goldText, distanceText, speedrunText;
let score = 0;
let goldScore = 0;
let maxDistance = 0;
let nextPlatformY = 500;
let platformCount = 0; 
let activeSkin = 'skin_trump'; 
let gameSpeedTimer = 0;
let currentGravity = 800;

function preload() {
    this.load.image('skin1', 'skin1.png');
    this.load.image('skin_trump', 'skin_trump.png');
    this.load.image('coin', 'coin.png');
    this.load.image('gold_coin', 'gold_coin.png'); 
    this.load.image('platform', 'platform.png');
    this.load.image('propeller', 'propeller.png');
    this.load.image('rope', 'rope.png');
    this.load.image('blackhole', 'blackhole.png');
}

function create() {
    platforms = this.physics.add.group({ allowGravity: false, immovable: true });
    coins = this.physics.add.group({ allowGravity: false });
    goldCoins = this.physics.add.group({ allowGravity: false });
    gadgets = this.physics.add.group({ allowGravity: false });

    let startPlat = platforms.create(200, 550, 'platform').setScale(0.5);
    startPlat.isSafe = true;

    player = this.physics.add.sprite(200, 450, activeSkin).setScale(0.15);
    player.setCollideWorldBounds(true);
    
    this.physics.add.collider(player, platforms, handlePlatformCollision);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.overlap(player, goldCoins, collectGoldCoin, null, this);
    this.physics.add.overlap(player, gadgets, collectGadget, null, this);

    changeGameBackground(this, activeSkin);

    this.input.on('pointerdown', () => {
        if (player.body.touching.down) {
            player.setVelocityY(-350);
        }
    });

    scoreText = this.add.text(16, 16, 'Coins: 0', { fontSize: '16px', fill: '#fff', fontFamily: 'Arial' });
    goldText = this.add.text(16, 38, 'Gold: 0', { fontSize: '16px', fill: '#ffd700', fontFamily: 'Arial' });
    distanceText = this.add.text(280, 16, '0m', { fontSize: '18px', fill: '#00ff00', fontFamily: 'Arial' });
    speedrunText = this.add.text(140, 16, 'SPEED: 1x', { fontSize: '14px', fill: '#ff3333', fontFamily: 'Arial' });

    for (let i = 0; i < 4; i++) { spawnPlatform(); }
}

function update() {
    if (player.y < this.cameras.main.scrollY + 300) {
        this.cameras.main.scrollY = player.y - 300;
        spawnPlatform();
    }

    gameSpeedTimer += 1;
    if (gameSpeedTimer % 900 === 0) {
        currentGravity += 100;
        this.physics.world.gravity.y = currentGravity;
        let speedMultiplier = (currentGravity / 800).toFixed(1);
        speedrunText.setText('SPEED: ' + speedMultiplier + 'x 🔥');
        this.cameras.main.setTint(0xff9999);
    }

    let currentDistance = Math.floor((500 - player.y) / 5);
    if (currentDistance > maxDistance) {
        maxDistance = currentDistance;
        distanceText.setText(maxDistance + 'm');
    }

    platforms.children.iterate((plat) => {
        if (plat && player.y < plat.y - 20 && plat.wasSteppedOn && !plat.isSafe) {
            plat.destroy(); 
        }
    });

    if (player.y > this.cameras.main.scrollY + 600) {
        alert("🤫 IShowSpeed: WAAAY No Way!!"); 
        this.scene.restart();
        score = 0;
        goldScore = 0;
        maxDistance = 0;
        nextPlatformY = 500;
        platformCount = 0;
        currentGravity = 800;
    }
}

function spawnPlatform() {
    if (platforms.countActive() >= 4) return;

    let x = Phaser.Math.Between(60, 340);
    platformCount++;
    
    let plat = platforms.create(x, nextPlatformY, 'platform');
    plat.setScale(0.18); 
    plat.wasSteppedOn = false;
    
    if (platformCount % 12 === 0) {
        plat.isTrap = true; 
        plat.setTint(0xff3333); 
        plat.setAlpha(0.8);
    } else {
        plat.isTrap = false;
    }

    if (Phaser.Math.Between(1, 100) <= 3) {
        coins.create(x, nextPlatformY - 30, 'coin').setScale(0.4);
    }

    if (Phaser.Math.Between(1, 1000) <= 5) {
        goldCoins.create(x, nextPlatformY - 30, 'gold_coin').setScale(0.4);
    }

    if (Phaser.Math.Between(1, 1000) === 7) {
        let items = ['propeller', 'rope', 'blackhole'];
        let chosenItem = Phaser.Math.RND.pick(items);
        let gadget = gadgets.create(x, nextPlatformY - 35, chosenItem).setScale(0.4);
        gadget.type = chosenItem;
    }

    nextPlatformY -= Phaser.Math.Between(90, 130);
}

function handlePlatformCollision(player, platform) {
    if (player.body.touching.down) {
        if (platform.isTrap) {
            platform.destroy(); 
        } else {
            platform.wasSteppedOn = true; 
        }
    }
}

function collectCoin(player, coin) {
    coin.destroy();
    score += 1; 
    scoreText.setText('Coins: ' + score);
}

function collectGoldCoin(player, goldCoin) {
    goldCoin.destroy();
    goldScore += 1; 
    goldText.setText('Gold: ' + goldScore);
}

function collectGadget(player, gadget) {
    let type = gadget.type;
    gadget.destroy();
    if (type === 'propeller') player.setVelocityY(-600); 
    else if (type === 'blackhole') {
        coins.children.iterate((coin) => { if (coin) this.physics.moveToObject(coin, player, 300); });
        goldCoins.children.iterate((gc) => { if (gc) this.physics.moveToObject(gc, player, 300); });
    } else if (type === 'rope') player.setVelocityY(-450);
}

function changeGameBackground(scene, skin) {
    if (skin === 'skin_trump') scene.cameras.main.setBackgroundColor('#1a237e'); 
    else scene.cameras.main.setBackgroundColor('#2d1a2f'); 
}
