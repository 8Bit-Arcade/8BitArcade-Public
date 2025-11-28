import * as Phaser from 'phaser';
import { SeededRNG } from '../engine/SeededRNG';

const CONFIG = {
  CELL_SIZE: 20,
  PLAYER_SPEED: 100,
  GHOST_SPEED: 80,
  PELLET_POINTS: 10,
  POWER_PELLET_POINTS: 50,
  GHOST_POINTS: 200,
  POWER_DURATION: 8000,
  LIVES: 3,
};

// Simple maze layout (1=wall, 0=path, 2=pellet, 3=power pellet)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,0,0,1,1,0,1,1,0,0,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,0,0,1,1,1,1,1,0,0,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

type Direction = { x: number; y: number };

export class ChomperScene extends Phaser.Scene {
  private onScoreUpdate: (score: number) => void;
  private onGameOver: (finalScore: number) => void;
  private getDirection: () => { up: boolean; down: boolean; left: boolean; right: boolean };
  private getAction: () => boolean;

  private rng: SeededRNG;
  private score: number = 0;
  private lives: number = CONFIG.LIVES;
  private gameOver: boolean = false;

  private maze: number[][] = [];
  private pellets: Phaser.GameObjects.Graphics[] = [];
  private player!: Phaser.GameObjects.Graphics;
  private playerPos: { x: number; y: number } = { x: 9, y: 15 };
  private playerDir: Direction = { x: 0, y: 0 };
  private nextDir: Direction = { x: 0, y: 0 };

  private ghosts: Array<{
    graphics: Phaser.GameObjects.Graphics;
    pos: { x: number; y: number };
    dir: Direction;
    color: number;
    frightened: boolean;
  }> = [];

  private powered: boolean = false;
  private powerTimer: number = 0;
  private moveTimer: number = 0;
  private pelletsRemaining: number = 0;

  private livesText!: Phaser.GameObjects.Text;
  private graphics!: Phaser.GameObjects.Graphics;

  constructor(
    onScoreUpdate: (score: number) => void,
    onGameOver: (finalScore: number) => void,
    getDirection: () => { up: boolean; down: boolean; left: boolean; right: boolean },
    getAction: () => boolean,
    seed: number
  ) {
    super({ key: 'ChomperScene' });
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.getDirection = getDirection;
    this.getAction = getAction;
    this.rng = new SeededRNG(seed);
  }

  create(): void {
    // Copy maze
    this.maze = MAZE.map(row => [...row]);

    // Count pellets
    this.pelletsRemaining = this.maze.flat().filter(cell => cell === 2 || cell === 3).length;

    // Graphics
    this.graphics = this.add.graphics();
    this.drawMaze();

    // Create player
    this.player = this.add.graphics();
    this.drawPlayer();

    // Create ghosts
    const ghostColors = [0xff0000, 0xff69b4, 0x00ffff, 0xffa500];
    const ghostStarts = [
      { x: 8, y: 9 },
      { x: 9, y: 9 },
      { x: 10, y: 9 },
      { x: 9, y: 10 },
    ];

    for (let i = 0; i < 4; i++) {
      const ghost = this.add.graphics();
      this.ghosts.push({
        graphics: ghost,
        pos: { ...ghostStarts[i] },
        dir: { x: 0, y: -1 },
        color: ghostColors[i],
        frightened: false,
      });
      this.drawGhost(this.ghosts[i]);
    }

    // UI
    this.livesText = this.add.text(16, this.scale.height - 30, `LIVES: ${this.lives}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#00ff41',
    });
  }

  drawMaze(): void {
    this.graphics.clear();

    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[y].length; x++) {
        const cell = this.maze[y][x];
        const px = x * CONFIG.CELL_SIZE;
        const py = y * CONFIG.CELL_SIZE;

        if (cell === 1) {
          // Wall
          this.graphics.fillStyle(0x0000ff);
          this.graphics.fillRect(px, py, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        } else if (cell === 2) {
          // Pellet
          this.graphics.fillStyle(0xffff00);
          this.graphics.fillCircle(
            px + CONFIG.CELL_SIZE / 2,
            py + CONFIG.CELL_SIZE / 2,
            2
          );
        } else if (cell === 3) {
          // Power pellet
          this.graphics.fillStyle(0xffff00);
          this.graphics.fillCircle(
            px + CONFIG.CELL_SIZE / 2,
            py + CONFIG.CELL_SIZE / 2,
            5
          );
        }
      }
    }
  }

  drawPlayer(): void {
    this.player.clear();
    this.player.fillStyle(this.powered ? 0xffff00 : 0xffff00);

    // Pac-Man shape
    const angle = Math.PI / 6; // Mouth angle
    this.player.slice(
      0,
      0,
      CONFIG.CELL_SIZE / 2 - 2,
      Phaser.Math.DegToRad(angle),
      Phaser.Math.DegToRad(360 - angle),
      false
    );
    this.player.fillPath();

    this.player.setPosition(
      this.playerPos.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
      this.playerPos.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
    );
  }

  drawGhost(ghost: { graphics: Phaser.GameObjects.Graphics; pos: { x: number; y: number }; color: number; frightened: boolean }): void {
    ghost.graphics.clear();
    ghost.graphics.fillStyle(ghost.frightened ? 0x0000ff : ghost.color);

    // Ghost body
    const size = CONFIG.CELL_SIZE / 2 - 2;
    ghost.graphics.fillCircle(0, -size / 2, size);
    ghost.graphics.fillRect(-size, -size / 2, size * 2, size);

    // Eyes (if not frightened)
    if (!ghost.frightened) {
      ghost.graphics.fillStyle(0xffffff);
      ghost.graphics.fillCircle(-size / 3, -size / 2, size / 4);
      ghost.graphics.fillCircle(size / 3, -size / 2, size / 4);
    }

    ghost.graphics.setPosition(
      ghost.pos.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
      ghost.pos.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
    );
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    // Handle input
    const dir = this.getDirection();
    if (dir.up) this.nextDir = { x: 0, y: -1 };
    else if (dir.down) this.nextDir = { x: 0, y: 1 };
    else if (dir.left) this.nextDir = { x: -1, y: 0 };
    else if (dir.right) this.nextDir = { x: 1, y: 0 };

    // Move player and ghosts
    this.moveTimer += delta;
    if (this.moveTimer >= 100) {
      this.moveTimer = 0;
      this.movePlayer();
      this.moveGhosts();
      this.checkCollisions();
    }

    // Power mode timer
    if (this.powered) {
      this.powerTimer -= delta;
      if (this.powerTimer <= 0) {
        this.powered = false;
        this.ghosts.forEach(g => {
          g.frightened = false;
          this.drawGhost(g);
        });
      }
    }

    // Check win
    if (this.pelletsRemaining === 0) {
      this.levelComplete();
    }
  }

  movePlayer(): void {
    // Try to turn
    const newPos = {
      x: this.playerPos.x + this.nextDir.x,
      y: this.playerPos.y + this.nextDir.y,
    };

    if (this.isWalkable(newPos.x, newPos.y)) {
      this.playerDir = { ...this.nextDir };
    }

    // Move in current direction
    const movePos = {
      x: this.playerPos.x + this.playerDir.x,
      y: this.playerPos.y + this.playerDir.y,
    };

    if (this.isWalkable(movePos.x, movePos.y)) {
      this.playerPos = movePos;

      // Collect pellet
      const cell = this.maze[this.playerPos.y][this.playerPos.x];
      if (cell === 2) {
        this.score += CONFIG.PELLET_POINTS;
        this.onScoreUpdate(this.score);
        this.maze[this.playerPos.y][this.playerPos.x] = 0;
        this.pelletsRemaining--;
        this.drawMaze();
      } else if (cell === 3) {
        this.score += CONFIG.POWER_PELLET_POINTS;
        this.onScoreUpdate(this.score);
        this.maze[this.playerPos.y][this.playerPos.x] = 0;
        this.pelletsRemaining--;
        this.powered = true;
        this.powerTimer = CONFIG.POWER_DURATION;
        this.ghosts.forEach(g => {
          g.frightened = true;
          g.dir = { x: -g.dir.x, y: -g.dir.y }; // Reverse direction
          this.drawGhost(g);
        });
        this.drawMaze();
      }

      this.drawPlayer();
    }
  }

  moveGhosts(): void {
    for (const ghost of this.ghosts) {
      // Simple AI: random movement with slight bias toward player
      const possibleDirs: Direction[] = [];

      for (const dir of [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ]) {
        const newPos = {
          x: ghost.pos.x + dir.x,
          y: ghost.pos.y + dir.y,
        };

        if (this.isWalkable(newPos.x, newPos.y) &&
            !(dir.x === -ghost.dir.x && dir.y === -ghost.dir.y)) {
          possibleDirs.push(dir);
        }
      }

      if (possibleDirs.length > 0) {
        // Choose direction (random or toward player)
        if (ghost.frightened || this.rng.next() < 0.3) {
          ghost.dir = possibleDirs[Math.floor(this.rng.next() * possibleDirs.length)];
        } else {
          // Move toward player
          const distances = possibleDirs.map(dir => {
            const newPos = { x: ghost.pos.x + dir.x, y: ghost.pos.y + dir.y };
            return Math.abs(newPos.x - this.playerPos.x) + Math.abs(newPos.y - this.playerPos.y);
          });
          const minDist = Math.min(...distances);
          ghost.dir = possibleDirs[distances.indexOf(minDist)];
        }
      }

      ghost.pos.x += ghost.dir.x;
      ghost.pos.y += ghost.dir.y;
      this.drawGhost(ghost);
    }
  }

  checkCollisions(): void {
    for (const ghost of this.ghosts) {
      if (ghost.pos.x === this.playerPos.x && ghost.pos.y === this.playerPos.y) {
        if (ghost.frightened) {
          // Eat ghost
          this.score += CONFIG.GHOST_POINTS;
          this.onScoreUpdate(this.score);
          ghost.pos = { x: 9, y: 9 }; // Return to home
          ghost.frightened = false;
          this.drawGhost(ghost);
        } else {
          // Player dies
          this.loseLife();
          return;
        }
      }
    }
  }

  isWalkable(x: number, y: number): boolean {
    if (y < 0 || y >= MAZE.length || x < 0 || x >= MAZE[0].length) {
      return false;
    }
    return MAZE[y][x] !== 1;
  }

  loseLife(): void {
    this.lives--;
    this.livesText.setText(`LIVES: ${this.lives}`);

    if (this.lives <= 0) {
      this.endGame();
    } else {
      // Reset positions
      this.playerPos = { x: 9, y: 15 };
      this.playerDir = { x: 0, y: 0 };
      this.drawPlayer();

      this.ghosts[0].pos = { x: 8, y: 9 };
      this.ghosts[1].pos = { x: 9, y: 9 };
      this.ghosts[2].pos = { x: 10, y: 9 };
      this.ghosts[3].pos = { x: 9, y: 10 };
      this.ghosts.forEach(g => this.drawGhost(g));

      this.powered = false;
      this.powerTimer = 0;
    }
  }

  levelComplete(): void {
    this.score += 1000;
    this.onScoreUpdate(this.score);

    // Could increase difficulty here
    this.maze = MAZE.map(row => [...row]);
    this.pelletsRemaining = this.maze.flat().filter(cell => cell === 2 || cell === 3).length;
    this.drawMaze();

    this.playerPos = { x: 9, y: 15 };
    this.playerDir = { x: 0, y: 0 };
    this.drawPlayer();
  }

  endGame(): void {
    this.gameOver = true;
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#ff0040',
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.onGameOver(this.score);
    });
  }
}
