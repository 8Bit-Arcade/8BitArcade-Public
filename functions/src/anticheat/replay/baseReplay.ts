import { GameInput } from '../../types';

/**
 * Seeded Random Number Generator
 * Must be deterministic - same seed always produces same sequence
 */
export class SeededRandom {
  private state: number;
  public readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Mulberry32 algorithm - fast and deterministic
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  nextBool(): boolean {
    return this.next() < 0.5;
  }
}

/**
 * Result from replaying a game
 */
export interface ReplayResult {
  valid: boolean;
  score: number;
  duration: number;
  events: GameEvent[];
  errorMessage?: string;
}

/**
 * Significant events that occurred during replay
 */
export interface GameEvent {
  time: number;
  type: string;
  data: any;
}

/**
 * Base class for headless game replay engines
 * All games must extend this to enable server-side validation
 */
export abstract class BaseGameReplay {
  protected rng: SeededRandom;
  protected score: number = 0;
  protected gameOver: boolean = false;
  protected currentTime: number = 0;
  protected events: GameEvent[] = [];
  protected inputs: GameInput[] = [];
  protected nextInputIndex: number = 0;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Initialize the game state
   */
  protected abstract init(): void;

  /**
   * Process a single input
   */
  protected abstract processInput(input: GameInput): void;

  /**
   * Update game state (called every frame)
   * @param deltaMs - Milliseconds since last update
   */
  protected abstract update(deltaMs: number): void;

  /**
   * Check if game is over
   */
  protected abstract checkGameOver(): boolean;

  /**
   * Replay the game with given inputs
   */
  async replay(inputs: GameInput[]): Promise<ReplayResult> {
    this.inputs = inputs.sort((a, b) => a.t - b.t); // Ensure chronological order
    this.nextInputIndex = 0;
    this.currentTime = 0;
    this.score = 0;
    this.gameOver = false;
    this.events = [];

    try {
      this.init();

      // Determine game duration
      const endTime = inputs.length > 0 ? inputs[inputs.length - 1].t + 1000 : 10000;

      // Run game loop
      const deltaMs = 16.67; // ~60 FPS
      while (this.currentTime < endTime && !this.gameOver) {
        // Process any inputs that should happen at this time
        while (
          this.nextInputIndex < this.inputs.length &&
          this.inputs[this.nextInputIndex].t <= this.currentTime
        ) {
          this.processInput(this.inputs[this.nextInputIndex]);
          this.nextInputIndex++;
        }

        // Update game state
        this.update(deltaMs);

        // Check if game is over
        if (this.checkGameOver()) {
          this.gameOver = true;
          this.logEvent('game_over', { score: this.score });
        }

        this.currentTime += deltaMs;
      }

      return {
        valid: true,
        score: this.score,
        duration: this.currentTime,
        events: this.events,
      };
    } catch (error: any) {
      return {
        valid: false,
        score: 0,
        duration: this.currentTime,
        events: this.events,
        errorMessage: error.message || 'Unknown error during replay',
      };
    }
  }

  /**
   * Log a significant event
   */
  protected logEvent(type: string, data: any): void {
    this.events.push({
      time: this.currentTime,
      type,
      data,
    });
  }

  /**
   * Get final score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Add to score
   */
  protected addScore(points: number): void {
    this.score += points;
    if (points > 0) {
      this.logEvent('score_increase', { points, totalScore: this.score });
    }
  }
}
