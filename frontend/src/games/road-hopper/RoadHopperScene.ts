import * as Phaser from 'phaser';
import { SeededRNG } from '../engine/SeededRNG';

const CONFIG = {
  GRID_SIZE: 40,
  PLAYER_SIZE: 30,
  MOVE_DISTANCE: 40,
  LIVES: 3,
  TIME_LIMIT: 60000, // 60 seconds
  POINTS_PER_GOAL: 100,
  POINTS_PER_FORWARD: 10,
  CAR_SPEEDS: [60, 80, 100, 120, 80],
  LOG_SPEEDS: [40, 60, 50, 70],
};

type ObstacleType = 'car' | 'log' | 'turtle';

interface Obstacle {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  width: number;
  speed: number;
  type: ObstacleType;
}

export class RoadHopperScene extends Phaser.Scene {
  private onScoreUpdate: (score: number) => void;
  private onGameOver: (finalScore: number) => void;
  private getDirection: () => { up: boolean; down: boolean; left: boolean; right: boolean };
  private getAction: () => boolean;

  private rng: SeededRNG;
  private score: number = 0;
  private lives: number = CONFIG.LIVES;
  private gameOver: boolean = false;
  private timeRemaining: number = CONFIG.TIME_LIMIT;
  private highestRow: number = 11; // Start at bottom

  private player!: Phaser.GameObjects.Graphics;
  private playerRow: number = 11;
  private playerCol: number = 7;
  private obstacles: Obstacle[] = [];
  private canMove: boolean = true;

  private livesText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private goalZones: Phaser.GameObjects.Graphics[] = [];

  constructor(
    onScoreUpdate: (score: number) => void,
    onGameOver: (finalScore: number) => void,
    getDirection: () => { up: boolean; down: boolean; left: boolean; right: boolean },
    getAction: () => boolean,
    seed: number
  ) {
    super({ key: 'RoadHopperScene' });
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.getDirection = getDirection;
    this.getAction = getAction;
    this.rng = new SeededRNG(seed);
  }

  create(): void {
    const { width, height } = this.scale;

    // Draw lanes
    this.drawLanes();

    // Create goal zones
    this.createGoalZones();

    // Create player
    this.player = this.add.graphics();
    this.drawPlayer();
    this.updatePlayerPosition();

    // Create obstacles
    this.createObstacles();

    // UI
    this.livesText = this.add.text(16, height - 30, `LIVES: ${this.lives}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#00ff41',
    });

    this.timeText = this.add.text(width - 16, height - 30, `TIME: ${Math.ceil(this.timeRemaining / 1000)}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#00f5ff',
    }).setOrigin(1, 0);
  }

  drawLanes(): void {
    const { width } = this.scale;
    const graphics = this.add.graphics();

    // Goal area (top)
    graphics.fillStyle(0x00ff41, 0.2);
    graphics.fillRect(0, 0, width, CONFIG.GRID_SIZE);

    // Water lanes
    for (let row = 1; row <= 4; row++) {
      graphics.fillStyle(0x0066ff, 0.3);
      graphics.fillRect(0, row * CONFIG.GRID_SIZE, width, CONFIG.GRID_SIZE);
    }

    // Safe middle
    graphics.fillStyle(0x00ff00, 0.2);
    graphics.fillRect(0, 5 * CONFIG.GRID_SIZE, width, CONFIG.GRID_SIZE);

    // Road lanes
    for (let row = 6; row <= 10; row++) {
      graphics.fillStyle(0x333333);
      graphics.fillRect(0, row * CONFIG.GRID_SIZE, width, CONFIG.GRID_SIZE);

      // Lane markings
      graphics.lineStyle(2, 0xffff00, 0.5);
      for (let x = 0; x < width; x += 40) {
        graphics.strokeRect(x, row * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - 2, 20, 4);
      }
    }

    // Safe start
    graphics.fillStyle(0x00ff00, 0.2);
    graphics.fillRect(0, 11 * CONFIG.GRID_SIZE, width, CONFIG.GRID_SIZE);
  }

  createGoalZones(): void {
    const goalWidth = 60;
    const goalPositions = [100, 240, 380, 520, 660];

    for (const x of goalPositions) {
      const zone = this.add.graphics();
      zone.fillStyle(0x00ff41, 0.4);
      zone.fillRect(x - goalWidth / 2, 5, goalWidth, CONFIG.GRID_SIZE - 10);
      zone.setData('filled', false);
      zone.setData('x', x);
      this.goalZones.push(zone);
    }
  }

  drawPlayer(): void {
    this.player.clear();
    this.player.fillStyle(0x00ff41);

    // Simple frog shape
    const size = CONFIG.PLAYER_SIZE / 2;
    this.player.fillCircle(0, -size * 0.3, size * 0.6); // Head
    this.player.fillEllipse(0, size * 0.2, size * 0.8, size); // Body
    this.player.fillEllipse(-size * 0.6, size * 0.5, size * 0.4, size * 0.6); // Left leg
    this.player.fillEllipse(size * 0.6, size * 0.5, size * 0.4, size * 0.6); // Right leg
  }

  updatePlayerPosition(): void {
    this.player.setPosition(
      this.playerCol * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      this.playerRow * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2
    );
  }

  createObstacles(): void {
    // Cars on road (rows 6-10)
    for (let row = 6; row <= 10; row++) {
      const direction = row % 2 === 0 ? 1 : -1;
      const speed = CONFIG.CAR_SPEEDS[row - 6] * direction;
      const spacing = 200;

      for (let i = 0; i < 4; i++) {
        this.createCar(i * spacing, row, speed);
      }
    }

    // Logs/turtles on water (rows 1-4)
    for (let row = 1; row <= 4; row++) {
      const direction = row % 2 === 0 ? -1 : 1;
      const speed = CONFIG.LOG_SPEEDS[row - 1] * direction;
      const type = row % 2 === 0 ? 'log' : 'turtle';
      const spacing = 250;

      for (let i = 0; i < 3; i++) {
        this.createLog(i * spacing, row, speed, type);
      }
    }
  }

  createCar(x: number, row: number, speed: number): void {
    const car = this.add.graphics();
    const width = 60;
    const height = 30;

    car.fillStyle(speed > 0 ? 0xff0040 : 0x00f5ff);
    car.fillRect(-width / 2, -height / 2, width, height);
    car.fillStyle(0x333333);
    car.fillRect(-width / 2 + 10, -height / 2 + 5, 15, height - 10);
    car.fillRect(width / 2 - 25, -height / 2 + 5, 15, height - 10);

    this.obstacles.push({
      graphics: car,
      x,
      y: row * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      width,
      speed,
      type: 'car',
    });
  }

  createLog(x: number, row: number, speed: number, type: ObstacleType): void {
    const log = this.add.graphics();
    const width = type === 'log' ? 120 : 80;
    const height = 30;

    if (type === 'log') {
      log.fillStyle(0x8B4513);
      log.fillRoundedRect(-width / 2, -height / 2, width, height, 5);
      log.fillStyle(0x654321);
      for (let i = 0; i < 3; i++) {
        log.fillCircle(-width / 2 + 20 + i * 40, 0, 12);
      }
    } else {
      // Turtle
      log.fillStyle(0x228B22);
      for (let i = 0; i < 3; i++) {
        log.fillEllipse(-width / 2 + 20 + i * 25, 0, 20, 25);
      }
    }

    this.obstacles.push({
      graphics: log,
      x,
      y: row * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      width,
      speed,
      type,
    });
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    const dt = delta / 1000;

    // Update timer
    this.timeRemaining -= delta;
    this.timeText.setText(`TIME: ${Math.ceil(this.timeRemaining / 1000)}`);

    if (this.timeRemaining <= 0) {
      this.loseLife();
      return;
    }

    // Handle movement
    if (this.canMove) {
      const dir = this.getDirection();
      let moved = false;

      if (dir.up && this.playerRow > 0) {
        this.playerRow--;
        moved = true;
        if (this.playerRow < this.highestRow) {
          this.highestRow = this.playerRow;
          this.score += CONFIG.POINTS_PER_FORWARD;
          this.onScoreUpdate(this.score);
        }
      } else if (dir.down && this.playerRow < 11) {
        this.playerRow++;
        moved = true;
      } else if (dir.left && this.playerCol > 0) {
        this.playerCol--;
        moved = true;
      } else if (dir.right && this.playerCol < 19) {
        this.playerCol++;
        moved = true;
      }

      if (moved) {
        this.updatePlayerPosition();
        this.canMove = false;
        this.time.delayedCall(100, () => {
          this.canMove = true;
        });
      }
    }

    // Update obstacles
    for (const obstacle of this.obstacles) {
      obstacle.x += obstacle.speed * dt;

      // Wrap around
      if (obstacle.speed > 0 && obstacle.x > this.scale.width + 100) {
        obstacle.x = -100;
      } else if (obstacle.speed < 0 && obstacle.x < -100) {
        obstacle.x = this.scale.width + 100;
      }

      obstacle.graphics.setPosition(obstacle.x, obstacle.y);
    }

    // Check collisions/riding
    this.checkCollisions();

    // Check goal
    if (this.playerRow === 0) {
      this.checkGoal();
    }
  }

  checkCollisions(): void {
    const playerX = this.playerCol * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
    const playerY = this.playerRow * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;

    // Check if on road
    if (this.playerRow >= 6 && this.playerRow <= 10) {
      for (const obstacle of this.obstacles) {
        if (obstacle.type === 'car' && Math.abs(obstacle.y - playerY) < CONFIG.GRID_SIZE / 2) {
          if (Math.abs(obstacle.x - playerX) < obstacle.width / 2 + CONFIG.PLAYER_SIZE / 2) {
            this.loseLife();
            return;
          }
        }
      }
    }

    // Check if on water
    if (this.playerRow >= 1 && this.playerRow <= 4) {
      let onLog = false;
      for (const obstacle of this.obstacles) {
        if ((obstacle.type === 'log' || obstacle.type === 'turtle') &&
            Math.abs(obstacle.y - playerY) < CONFIG.GRID_SIZE / 2) {
          if (Math.abs(obstacle.x - playerX) < obstacle.width / 2 + CONFIG.PLAYER_SIZE / 2) {
            onLog = true;
            // Move with log
            this.player.x += obstacle.speed * (1 / 60);
            this.playerCol = Math.round((this.player.x - CONFIG.GRID_SIZE / 2) / CONFIG.GRID_SIZE);
            break;
          }
        }
      }

      if (!onLog) {
        this.loseLife();
        return;
      }

      // Check if pushed off screen
      if (playerX < 0 || playerX > this.scale.width) {
        this.loseLife();
        return;
      }
    }
  }

  checkGoal(): void {
    const playerX = this.player.x;

    for (const zone of this.goalZones) {
      if (zone.getData('filled')) continue;

      const zoneX = zone.getData('x');
      if (Math.abs(playerX - zoneX) < 30) {
        // Made it to goal!
        zone.setData('filled', true);
        zone.fillStyle(0x00ff41);
        zone.fillCircle(zoneX, CONFIG.GRID_SIZE / 2, 15);

        this.score += CONFIG.POINTS_PER_GOAL;
        this.onScoreUpdate(this.score);

        this.resetPlayer();

        // Check if all goals filled
        if (this.goalZones.every(z => z.getData('filled'))) {
          this.levelComplete();
        }

        return;
      }
    }

    // Hit goal area but missed the spot
    this.loseLife();
  }

  resetPlayer(): void {
    this.playerRow = 11;
    this.playerCol = 7;
    this.updatePlayerPosition();
    this.highestRow = 11;
    this.timeRemaining = CONFIG.TIME_LIMIT;
  }

  loseLife(): void {
    this.lives--;
    this.livesText.setText(`LIVES: ${this.lives}`);

    if (this.lives <= 0) {
      this.endGame();
    } else {
      this.resetPlayer();
    }
  }

  levelComplete(): void {
    this.score += 1000; // Bonus for completing level
    this.onScoreUpdate(this.score);

    // Reset for next level (could increase difficulty here)
    this.goalZones.forEach(zone => zone.setData('filled', false));
    this.resetPlayer();
  }

  endGame(): void {
    this.gameOver = true;
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#ff0040',
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.onGameOver(this.score);
    });
  }
}
