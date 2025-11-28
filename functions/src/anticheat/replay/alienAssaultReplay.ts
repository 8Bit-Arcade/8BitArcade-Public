import { GameInput } from '../../types';
import { BaseGameReplay, ReplayResult } from './baseReplay';

/**
 * Simplified Alien Assault headless replay
 * This validates that the claimed score is achievable with the given inputs
 */
export class AlienAssaultReplay extends BaseGameReplay {
  private playerX: number = 400; // Center of 800px width
  private aliens: Array<{ x: number; y: number; alive: boolean }> = [];
  private bullets: Array<{ x: number; y: number; active: boolean }> = [];
  private wave: number = 1;
  private kills: number = 0;

  protected init(): void {
    this.spawnWave();
    this.logEvent('game_start', { wave: this.wave });
  }

  protected processInput(input: GameInput): void {
    switch (input.type) {
      case 'direction':
        if (input.data) {
          // Move player
          if (input.data.left) {
            this.playerX = Math.max(0, this.playerX - 10);
          } else if (input.data.right) {
            this.playerX = Math.min(800, this.playerX + 10);
          }
        }
        break;

      case 'action':
        // Create bullet (shoot)
        if (input.data?.action) {
          this.bullets.push({ x: this.playerX, y: 550, active: true });
        }
        break;
    }
  }

  protected update(deltaMs: number): void {
    // Update bullets
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      bullet.y -= 5; // Move up

      // Check collision with aliens
      for (const alien of this.aliens) {
        if (!alien.alive) continue;

        const dx = bullet.x - alien.x;
        const dy = bullet.y - alien.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
          // Hit!
          alien.alive = false;
          bullet.active = false;
          this.kills++;

          // Score based on wave (higher waves = more points)
          const points = 10 * this.wave;
          this.addScore(points);
          this.logEvent('alien_killed', { wave: this.wave, points });
          break;
        }
      }

      // Remove off-screen bullets
      if (bullet.y < 0) {
        bullet.active = false;
      }
    }

    // Move aliens (simple)
    for (const alien of this.aliens) {
      if (!alien.alive) continue;
      alien.y += 0.5; // Slow descent
    }

    // Check if wave is complete
    const aliveAliens = this.aliens.filter((a) => a.alive).length;
    if (aliveAliens === 0) {
      this.wave++;
      if (this.wave <= 10) {
        // Max 10 waves for now
        this.spawnWave();
        this.logEvent('wave_complete', { wave: this.wave });
      }
    }

    // Check if any alien reached bottom (game over)
    for (const alien of this.aliens) {
      if (alien.alive && alien.y > 580) {
        this.gameOver = true;
        this.logEvent('alien_reached_bottom', {});
      }
    }
  }

  protected checkGameOver(): boolean {
    return this.gameOver || this.wave > 10;
  }

  private spawnWave(): void {
    this.aliens = [];
    const aliensPerRow = 5 + this.wave; // More aliens in later waves
    const rows = 3;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < aliensPerRow; col++) {
        this.aliens.push({
          x: 100 + col * 60,
          y: 50 + row * 40,
          alive: true,
        });
      }
    }
  }
}

/**
 * Replay an Alien Assault game and return the result
 */
export async function replayAlienAssault(
  seed: number,
  inputs: GameInput[]
): Promise<ReplayResult> {
  const replay = new AlienAssaultReplay(seed);
  return await replay.replay(inputs);
}
