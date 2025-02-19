let player;
let bullets = [];
let enemies = [];
let bombBoos = [];
let enemyBullets = [];
let bouldergeistHealth = 8;
let gameState = "start";
let stars = [];
let lastShotTime = 0;
let shootDelay = 1000; // 1.5-second delay
let playerShootSounds = [];
let gameOverSound, winSound, startJingle, gameplaySound;
let customFont;
let backgroundVideo;
let health = 3;
let bouldergeist;
let star;
let starAppeared = false;
let starMoving = false;
let starCollected = false;
let starCenterSound;
let appearsSound;
let starChanceSound;
let fadingAura = 0; // For fading aura effect
let bouldergeistPhase = 1;

function preload() {
  playerImage = loadImage("mario spin.webp");
  bouldergeistImage = loadImage("Bouldergeist.png");
  trueFormImage = loadImage("true form.png");
  bombBooImage = loadImage("bomb boo.png");
  starImage = loadImage("star.gif");

  playerShootSounds[0] = loadSound("spin1.wav");
  playerShootSounds[1] = loadSound("spin2.wav");
  gameOverSound = loadSound("Too Bad.mp3");
  winSound = loadSound("Star.mp3");
  startJingle = loadSound("Ghostly.mp3");
  gameplaySound = loadSound("Bouldergeist.mp3");
  appearsSound = loadSound("StarAppears.mp3");
  starCenterSound = loadSound("StarSparkle.wav");
  starChanceSound = loadSound("StarChance.mp3");

  customFont = loadFont("mario.ttf");
  backgroundVideo = createVideo("Mario.mp4");
  backgroundVideo.loop();
  backgroundVideo.hide();
}

function setup() {
  createCanvas(600, 600);
  player = new Player();
  for (let i = 0; i < 50; i++) {
    stars.push(new Star());
  }
  bouldergeist = new Bouldergeist(width / 2, height / 4);
  for (let i = 0; i < 12; i++) {
    bombBoos.push(new BombBoo(i));
  }
  startJingle.loop();
}

function draw() {
  clear();
  image(backgroundVideo, 0, 0, width, height);
  drawStars();

  if (gameState === "start") {
    winSound.stop();
    fill(255);
    textSize(64);
    textAlign(CENTER);
    textFont(customFont);
    text("Mario's\n Ghost Battle", width / 2, height / 2 - 60);
    textSize(32);
    text("Click to Start\n Use Arrows To Move\n And Spacebar To Fire", width / 2, height / 2 + 80);
  } else if (gameState === "play") {
    if (!gameplaySound.isPlaying()) {
      gameplaySound.loop();
    }
    player.move();
    player.show();
    displayHealth();
    displayBouldergeistHealth();

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].move();
      bullets[i].show();

      if (bullets[i].hits(bouldergeist)) {
        bouldergeistHealth -= 1;
        bullets.splice(i, 1);
        if (bouldergeistHealth === 4) {
          bouldergeist.phaseChange();
        }
        if (bouldergeistHealth <= 0 && !starAppeared) {
          bombBoos = [];
          star = new CenterStar(bouldergeist.x, bouldergeist.y);
          starAppeared = true;
          starMoving = true;
          gameplaySound.stop();
          appearsSound.play();
          starChanceSound.loop();
          starCenterSound.loop();
        }
        break;
      }
      for (let j = bombBoos.length - 1; j >= 0; j--) {
        if (bullets[i] && bullets[i].hits(bombBoos[j])) {
          bombBoos.splice(j, 1);
          bullets.splice(i, 1);
          break;
        }
      }
    }

    if (bouldergeistHealth > 0) {
      bouldergeist.show();
    }

    for (let bombBoo of bombBoos) {
      bombBoo.moveAround(bouldergeist);
      bombBoo.show();
    }

    if (frameCount % 60 === 0 && bombBoos.length > 0) {
      let randomBombBoo = random(bombBoos);
      enemyBullets.push(new EnemyBullet(randomBombBoo.x, randomBombBoo.y));
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      enemyBullets[i].move();
      enemyBullets[i].show();
      if (enemyBullets[i].hits(player)) {
        health -= 1;
        enemyBullets.splice(i, 1);
        if (health <= 0) {
          stopAllSounds();
          gameState = "game over";
          gameOverSound.play();
        }
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (enemyBullets[i].y > height) {
        enemyBullets.splice(i, 1);
      }
    }

    if (starAppeared) {
      gameplaySound.stop();
      star.show();
      if (starMoving) {
        star.moveToCenter();
      }
      if (starCollected && dist(player.x, player.y, star.x, star.y) < 40) {
        starCollected = false;
        starCenterSound.stop();
        starChanceSound.stop();
        setTimeout(() => {
          gameState = "win";
          winSound.play();
        }, 100);
      }
    }
  } else if (gameState === "game over" || gameState === "win") {
    fill(gameState === "game over" ? color(255, 0, 0) : color(0, 255, 0));
    textSize(64);
    textAlign(CENTER);
    text(
      gameState === "game over" ? "Game Over" : "You Win!",
      width / 2,
      height / 2
    );
    textSize(24);
    text("Click here to restart", width / 2, height / 2 + 80);
  }
}

function playStarAppearsSound() {
  appearsSound.play();
}

// Adjusted playStarCollectedSound
function playStarCollectedSound() {
  starCenterSound.stop();
  winSound.play();
  setTimeout(() => {
    gameState = "win";
  }, 2000);
}

function showWinScreen() {
  gameState = "win";
}

function keyPressed() {
  if (key === " " || key === "Spacebar") {
    if (millis() - lastShotTime > shootDelay) {
      shoot();
      lastShotTime = millis();
    }
  }
}

function shoot() {
  bullets.push(new Bullet(player.x, player.y - 10));
  let sound = playerShootSounds[bullets.length % 2];
  sound.play();
}

function stopAllSounds() {
  [
    playerShootSounds,
    gameOverSound,
    startJingle,
    gameplaySound,
    starChanceSound,
    starCenterSound,
    appearsSound,
  ].forEach((sound) => {
    if (sound instanceof Array) {
      sound.forEach((s) => s.stop());
    } else {
      sound.stop();
    }
  });
}

function mousePressed() {
  if (gameState === "start") {
    gameState = "play";
    stopAllSounds();
    startJingle.stop();
  } else if (gameState === "game over" || gameState === "win") {
    resetGame();
  }
}

function resetGame() {
  gameState = "start";
  bullets = [];
  enemyBullets = [];
  health = 3;
  bouldergeistHealth = 8;
  bombBoos = [];
  starAppeared = false;
  starMoving = false;
  starCollected = false;
  star = null; // Reset the star object
  for (let i = 0; i < 12; i++) {
    bombBoos.push(new BombBoo(i));
  }
  bouldergeist.image = bouldergeistImage;
  stopAllSounds(); // Ensure no lingering sounds
  startJingle.loop();
}

function displayHealth() {
  textSize(64);
  textFont(customFont);
  fill(255, 255, 0);
  textAlign(CENTER);
  text(health, width - 50, 50);
}

function displayBouldergeistHealth() {
  fill(255, 0, 0);
  noStroke();
  rect(20, 20, map(bouldergeistHealth, 0, 8, 0, 200), 20);
  fill(255);
  textSize(12);
  text("Bouldergeist Health", 120, 15);
}

class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 3);
    this.speed = random(0.5, 2);
  }

  move() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = 0;
      this.x = random(width);
    }
  }

  show() {
    fill(255);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }
}

class CenterStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
  }

  moveToCenter() {
    let targetX = width / 2;
    let targetY = height / 2;
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    let distToTarget = dist(this.x, this.y, targetX, targetY);
    if (distToTarget > 1) {
      this.x += dx * 0.05;
      this.y += dy * 0.05;
    } else {
      starMoving = false;
      starCollected = true;
    }
  }

  show() {
    image(
      starImage,
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
  }
}

function playStarAppearsSound() {
  appearsSound.play();
}

function playStarCenterSound() {
  starCenterSound.loop();
}

function playStarCollectedSound() {
  starCenterSound.stop();
  collectedSound.play();
  setTimeout(showWinScreen, 2000);
}

function drawStars() {
  for (let star of stars) {
    star.move();
    star.show();
  }
}

function showWinScreen() {
  gameState = "win";
  winSound.play();
}

class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 30;
    this.width = 50;
    this.height = 50;
    this.auraColor = color(173, 216, 230); // Base aura color
  }

  move() {
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= 5;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += 5;
    }
    if (keyIsDown(UP_ARROW)) {
      this.y -= 5;
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.y += 5;
    }
    this.x = constrain(this.x, 0, width - this.width);
    this.y = constrain(this.y, 0, height - this.height);
  }

  show() {
    this.drawFeatheredAura();
    image(playerImage, this.x, this.y, this.width, this.height);
  }

  drawFeatheredAura() {
    let maxRadius = this.width + 30; // Maximum radius of the aura
    let steps = 20; // Number of concentric ellipses to create the gradient effect

    for (let i = 0; i < steps; i++) {
      let radius = map(i, 0, steps, maxRadius, this.width + 10);
      let alpha = map(i, 0, steps, 50, 0); // Gradually decrease opacity
      fill(
        red(this.auraColor),
        green(this.auraColor),
        blue(this.auraColor),
        alpha
      );
      noStroke();
      ellipse(
        this.x + this.width / 2,
        this.y + this.height / 2,
        radius,
        radius
      );
    }
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10;
  }

  move() {
    this.y -= 10;
  }

  show() {
    fill("rgb(0,251,255)");
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }

  hits(enemy) {
    let d = dist(this.x, this.y, enemy.x, enemy.y);
    return d < this.size / 2 + enemy.width / 2;
  }
}

class Bouldergeist {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 100;
    this.image = bouldergeistImage;
  }

  show() {
    image(
      this.image,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }

  phaseChange() {
    this.image = trueFormImage;
    for (let i = 0; i < 12; i++) {
      bombBoos.push(new BombBoo(i));
    }
  }
}

class BombBoo {
  constructor(i) {
    this.angle = map(i, 0, 12, 0, TWO_PI);
    this.radius = 150;
    this.x = width / 2 + this.radius * cos(this.angle);
    this.y = height / 4 + this.radius * sin(this.angle);
    this.width = 30;
    this.height = 30;
  }

  moveAround(target) {
    this.angle += 0.02;
    this.x = target.x + this.radius * cos(this.angle);
    this.y = target.y + this.radius * sin(this.angle);
  }

  show() {
    image(bombBooImage, this.x, this.y, this.width, this.height);
  }
}

class EnemyBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10;
  }

  move() {
    this.y += 5;
  }

  show() {
    fill("yellow");
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }

  hits(player) {
    let d = dist(
      this.x,
      this.y,
      player.x + player.width / 2,
      player.y + player.height / 2
    );
    return d < this.size / 2 + player.width / 2;
  }
}
