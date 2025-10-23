/**
 * Influence analysis functions for the Referral Network
 * 
 * These functions analyze user influence within the network using various metrics
 * without mutating the network state.
 */

import { ReferralNetwork } from './ReferralNetwork.js';
import { UserId } from './types/index.js';

/**
 * Calculate the reach (number of distinct descendants) for a user
 * 
 * @param network - The referral network to analyze
 * @param user - The user to calculate reach for
 * @returns Promise resolving to the number of distinct descendants
 */
async function calculateReach(network: ReferralNetwork, user: UserId): Promise<number> {
  const result = await network.allReferrals(user);
  if (!result.success) {
    throw result.error;
  }
  return result.data.length;
}

/**
 * Get the top k users ranked by reach (number of distinct descendants)
 * 
 * Reach(u) is defined as the number of distinct descendants of user u.
 * This function returns users sorted by their reach in descending order.
 * 
 * @param network - The referral network to analyze
 * @param k - The number of top users to return
 * @returns Promise resolving to array of user IDs sorted by reach (descending)
 */
export async function topKByReach(network: ReferralNetwork, k: number): Promise<UserId[]> {
  if (k < 0) {
    throw new Error('k must be non-negative');
  }

  // Get all users in the network
  const allUsersResult = await network.getAllUsers();
  if (!allUsersResult.success) {
    throw allUsersResult.error;
  }

  const allUsers = allUsersResult.data;
  
  // If k is 0 or there are no users, return empty array
  if (k === 0 || allUsers.length === 0) {
    return [];
  }

  // Calculate reach for each user
  const userReachPairs: Array<{ userId: UserId; reach: number }> = [];
  
  for (const user of allUsers) {
    try {
      const reach = await calculateReach(network, user.userId);
      userReachPairs.push({ userId: user.userId, reach });
    } catch (error) {
      // Skip users that cause errors (e.g., if they don't exist)
      console.warn(`Failed to calculate reach for user ${user.userId}:`, error);
    }
  }

  // Sort by reach in descending order, then by userId for stable sorting
  userReachPairs.sort((a, b) => {
    if (a.reach !== b.reach) {
      return b.reach - a.reach; // Descending by reach
    }
    return a.userId.localeCompare(b.userId); // Ascending by userId for tie-breaking
  });

  // Return top k users
  return userReachPairs.slice(0, k).map(pair => pair.userId);
}
