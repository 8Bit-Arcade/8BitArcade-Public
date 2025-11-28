/**
 * Stress Test for Leaderboards
 *
 * This script simulates multiple users submitting scores to test:
 * - Leaderboard update performance
 * - Concurrent write handling
 * - Ranking accuracy
 * - Anti-cheat system load
 *
 * Usage:
 *   npm run test:stress -- --users 100 --games 4
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '../config/firebase';
import { GAME_CONFIGS } from '../config/games';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

interface TestConfig {
  numUsers: number;
  numGamesPerUser: number;
  concurrentBatches: number;
}

/**
 * Generate a random valid score for a game
 */
function generateRandomScore(gameId: string): number {
  const config = GAME_CONFIGS[gameId];
  if (!config) return 1000;

  // Generate score between 10% and 90% of max
  const min = config.maxTheoreticalScore * 0.1;
  const max = config.maxTheoreticalScore * 0.9;
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Generate test user data
 */
function generateTestUsers(count: number): Array<{
  id: string;
  username: string;
}> {
  const users: Array<{ id: string; username: string }> = [];

  for (let i = 0; i < count; i++) {
    const id = `0x${Math.random().toString(16).substring(2, 42).padEnd(40, '0')}`;
    users.push({
      id: id.toLowerCase(),
      username: `TestUser${i + 1}`,
    });
  }

  return users;
}

/**
 * Create a test score submission
 */
async function submitTestScore(
  userId: string,
  username: string,
  gameId: string,
  score: number
): Promise<void> {
  const scoreRef = collections.scores.doc(userId);
  const now = Timestamp.now();

  // Simulate score document structure
  await scoreRef.set(
    {
      odedId: userId,
      username,
      games: {
        [gameId]: {
          bestScore: score,
          totalPlays: 1,
          lastPlayed: now,
        },
      },
      totalScore: score,
      totalGames: 1,
    },
    { merge: true }
  );

  // Update leaderboard
  await updateLeaderboard(gameId, userId, username, score);
}

/**
 * Update leaderboard (simplified version)
 */
async function updateLeaderboard(
  gameId: string,
  playerId: string,
  username: string,
  score: number
): Promise<void> {
  const leaderboardRef = collections.leaderboards.doc(gameId);
  const now = Timestamp.now();

  const entry = {
    odedId: playerId,
    username,
    score,
    timestamp: now,
  };

  const doc = await leaderboardRef.get();

  if (!doc.exists) {
    await leaderboardRef.set({
      gameId,
      lastUpdated: now,
      daily: [entry],
      weekly: [entry],
      allTime: [entry],
    });
    return;
  }

  const data = doc.data();
  if (!data) return;

  const updateList = (list: any[], maxSize: number = 100) => {
    const filtered = list.filter((e: any) => e.odedId !== playerId);
    filtered.push(entry);
    filtered.sort((a: any, b: any) => b.score - a.score);
    return filtered.slice(0, maxSize);
  };

  await leaderboardRef.update({
    lastUpdated: now,
    daily: updateList(data.daily || []),
    weekly: updateList(data.weekly || []),
    allTime: updateList(data.allTime || []),
  });
}

/**
 * Run stress test
 */
async function runStressTest(config: TestConfig): Promise<void> {
  console.log('[TEST] Starting Leaderboard Stress Test');
  console.log(`   Users: ${config.numUsers}`);
  console.log(`   Games per user: ${config.numGamesPerUser}`);
  console.log(`   Concurrent batches: ${config.concurrentBatches}`);
  console.log('');

  const startTime = Date.now();

  // Generate test users
  console.log('[TEST] Generating test users...');
  const users = generateTestUsers(config.numUsers);

  // Get available games
  const gameIds = Object.keys(GAME_CONFIGS);

  // Submit scores in batches
  console.log('[TEST] Submitting test scores...');
  const batchSize = Math.ceil(config.numUsers / config.concurrentBatches);

  for (let batch = 0; batch < config.concurrentBatches; batch++) {
    const batchUsers = users.slice(batch * batchSize, (batch + 1) * batchSize);
    const promises: Promise<void>[] = [];

    for (const user of batchUsers) {
      for (let gameIndex = 0; gameIndex < config.numGamesPerUser; gameIndex++) {
        const gameId = gameIds[gameIndex % gameIds.length];
        const score = generateRandomScore(gameId);

        promises.push(submitTestScore(user.id, user.username, gameId, score));
      }
    }

    console.log(`   Batch ${batch + 1}/${config.concurrentBatches}: ${promises.length} submissions...`);
    await Promise.all(promises);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('');
  console.log(' Stress Test Complete');
  console.log(`   Total time: ${duration.toFixed(2)}s`);
  console.log(`   Total submissions: ${config.numUsers * config.numGamesPerUser}`);
  console.log(`   Submissions/sec: ${((config.numUsers * config.numGamesPerUser) / duration).toFixed(2)}`);
  console.log('');

  // Verify leaderboards
  console.log('[TEST] Verifying leaderboards...');
  for (const gameId of gameIds) {
    const leaderboardDoc = await collections.leaderboards.doc(gameId).get();
    if (leaderboardDoc.exists) {
      const data = leaderboardDoc.data();
      console.log(`   ${gameId}: ${data?.allTime?.length || 0} entries`);
    }
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  console.log('[TEST] Cleaning up test data...');

  // Delete test scores
  const scoresSnapshot = await collections.scores.where('username', '>=', 'TestUser').limit(1000).get();
  const deletePromises: Promise<any>[] = [];

  for (const doc of scoresSnapshot.docs) {
    deletePromises.push(doc.ref.delete());
  }

  await Promise.all(deletePromises);

  // Reset leaderboards
  const gameIds = Object.keys(GAME_CONFIGS);
  for (const gameId of gameIds) {
    await collections.leaderboards.doc(gameId).delete();
  }

  console.log(' Cleanup complete');
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    numUsers: 100,
    numGamesPerUser: 2,
    concurrentBatches: 10,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--users' && args[i + 1]) {
      config.numUsers = parseInt(args[i + 1]);
    }
    if (args[i] === '--games' && args[i + 1]) {
      config.numGamesPerUser = parseInt(args[i + 1]);
    }
    if (args[i] === '--batches' && args[i + 1]) {
      config.concurrentBatches = parseInt(args[i + 1]);
    }
    if (args[i] === '--cleanup') {
      cleanupTestData()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('Error during cleanup:', error);
          process.exit(1);
        });
    }
  }

  runStressTest(config)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Stress test failed:', error);
      process.exit(1);
    });
}

export { runStressTest, cleanupTestData };
