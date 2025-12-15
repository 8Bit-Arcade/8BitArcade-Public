import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { collections } from '../config/firebase';

/**
 * Flag types for suspicious activity
 */
export type FlagType =
  | 'score_mismatch'
  | 'impossible_score'
  | 'inhuman_reaction'
  | 'bot_frequency'
  | 'perfect_play'
  | 'abnormal_velocity'
  | 'multiple_violations';

/**
 * Severity levels for flags
 */
export type FlagSeverity = 'low' | 'medium' | 'high';

/**
 * Flag reason details
 */
export interface FlagReason {
  type: FlagType;
  severity: FlagSeverity;
  gameId: string;
  sessionId: string;
  claimedScore: number;
  calculatedScore?: number;
  details: Record<string, any>;
  timestamp: Timestamp;
}

/**
 * Threshold for auto-banning
 * Relaxed thresholds to reduce false positives
 */
const AUTO_BAN_THRESHOLDS = {
  highSeverity: 5, // 5 high severity flags = auto-ban (was 2)
  mediumSeverity: 10, // 10 medium severity flags = auto-ban (was 5)
  totalFlags: 20, // 20 flags total = auto-ban (was 10)
};

/**
 * Flag an account for suspicious activity
 */
export async function flagAccount(
  playerId: string,
  reason: Omit<FlagReason, 'timestamp'>
): Promise<void> {
  const userRef = collections.users.doc(playerId);

  try {
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Cannot flag non-existent user: ${playerId}`);
      return;
    }

    const flagData: FlagReason = {
      ...reason,
      timestamp: Timestamp.now(),
    };

    // Add flag to user's flags array
    await userRef.update({
      'flags.count': FieldValue.increment(1),
      'flags.reasons': FieldValue.arrayUnion(flagData),
      'flags.lastFlagged': Timestamp.now(),
    });

    // Check if should auto-ban
    const userData = userDoc.data();
    if (userData) {
      const flagCount = (userData.flags?.count || 0) + 1;
      const highSeverityCount =
        (userData.flags?.reasons || []).filter((f: FlagReason) => f.severity === 'high').length +
        (reason.severity === 'high' ? 1 : 0);
      const mediumSeverityCount =
        (userData.flags?.reasons || []).filter((f: FlagReason) => f.severity === 'medium').length +
        (reason.severity === 'medium' ? 1 : 0);

      const shouldBan =
        highSeverityCount >= AUTO_BAN_THRESHOLDS.highSeverity ||
        mediumSeverityCount >= AUTO_BAN_THRESHOLDS.mediumSeverity ||
        flagCount >= AUTO_BAN_THRESHOLDS.totalFlags;

      if (shouldBan && !userData.isBanned) {
        await banAccount(playerId, 'Automatic ban due to multiple violations');
      }
    }

    console.log(` Flagged account ${playerId}: ${reason.type} (${reason.severity})`);
  } catch (error) {
    console.error(`Failed to flag account ${playerId}:`, error);
    throw error;
  }
}

/**
 * Ban an account
 */
export async function banAccount(playerId: string, reason: string): Promise<void> {
  const userRef = collections.users.doc(playerId);

  await userRef.update({
    isBanned: true,
    banReason: reason,
    bannedAt: Timestamp.now(),
  });

  console.log(`=� Banned account ${playerId}: ${reason}`);
}

/**
 * Unban an account (admin only)
 */
export async function unbanAccount(playerId: string): Promise<void> {
  const userRef = collections.users.doc(playerId);

  await userRef.update({
    isBanned: false,
    banReason: null,
    bannedAt: null,
  });

  console.log(` Unbanned account ${playerId}`);
}

/**
 * Check if an account is banned
 */
export async function isAccountBanned(playerId: string): Promise<boolean> {
  const userRef = collections.users.doc(playerId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return false;
  }

  return userDoc.data()?.isBanned === true;
}

/**
 * Get all flagged accounts for review
 */
export async function getFlaggedAccounts(limit: number = 50): Promise<any[]> {
  const snapshot = await collections.users
    .where('flags.count', '>', 0)
    .orderBy('flags.count', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Clear flags from an account (admin only)
 */
export async function clearFlags(playerId: string): Promise<void> {
  const userRef = collections.users.doc(playerId);

  await userRef.update({
    'flags.count': 0,
    'flags.reasons': [],
    'flags.lastFlagged': null,
  });

  console.log(` Cleared flags for account ${playerId}`);
}
