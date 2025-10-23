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
 * @param k - The number of top users to return (default: 5, undefined: all users)
 * @returns Promise resolving to array of user IDs sorted by reach (descending)
 */
export async function topKByReach(network: ReferralNetwork, k: number = 5): Promise<UserId[]> {
  if (k !== undefined && k < 0) {
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

  // If k is undefined, return all users
  if (k === undefined) {
    k = allUsers.length;
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

/**
 * Find the shortest path between two users in the referral network
 * 
 * @param network - The referral network to analyze
 * @param source - The source user
 * @param target - The target user
 * @returns Promise resolving to the shortest path as an array of user IDs, or null if no path exists
 */
async function findShortestPath(network: ReferralNetwork, source: UserId, target: UserId): Promise<UserId[] | null> {
  if (source === target) {
    return [source];
  }

  // Use BFS to find shortest path
  const queue: Array<{ userId: UserId; path: UserId[] }> = [{ userId: source, path: [source] }];
  const visited = new Set<UserId>();
  visited.add(source);

  while (queue.length > 0) {
    const { userId, path } = queue.shift()!;

    // Get direct referrals (children) of current user
    const directReferralsResult = await network.directReferrals(userId);
    if (!directReferralsResult.success) {
      continue;
    }

    for (const child of directReferralsResult.data) {
      if (child === target) {
        return [...path, child];
      }

      if (!visited.has(child)) {
        visited.add(child);
        queue.push({ userId: child, path: [...path, child] });
      }
    }
  }

  return null; // No path found
}

/**
 * Calculate flow centrality for a user
 * 
 * Flow centrality(u) is defined as: for ordered pairs (s, t) of distinct users 
 * with s ≠ u ≠ t, count how often u lies on a shortest directed path from s to t.
 * Endpoints do not count as on the path.
 * 
 * @param network - The referral network to analyze
 * @param user - The user to calculate flow centrality for
 * @returns Promise resolving to the flow centrality score
 */
async function calculateFlowCentrality(network: ReferralNetwork, user: UserId): Promise<number> {
  // Get all users in the network
  const allUsersResult = await network.getAllUsers();
  if (!allUsersResult.success) {
    throw allUsersResult.error;
  }

  const allUsers = allUsersResult.data.map(u => u.userId);
  
  let flowCentrality = 0;

  // For each pair (s, t) where s ≠ user ≠ t
  for (const s of allUsers) {
    if (s === user) continue;
    
    for (const t of allUsers) {
      if (t === user || t === s) continue;
      
      // Find shortest path from s to t
      const path = await findShortestPath(network, s, t);
      
      if (path && path.length > 2) { // Path must have at least 3 nodes (s, user, t)
        // Check if user is on the path (excluding endpoints)
        const middleNodes = path.slice(1, -1);
        if (middleNodes.includes(user)) {
          flowCentrality++;
        }
      }
    }
  }

  return flowCentrality;
}

/**
 * Get the top k users ranked by flow centrality
 * 
 * Flow centrality(u) is defined as: for ordered pairs (s, t) of distinct users 
 * with s ≠ u ≠ t, count how often u lies on a shortest directed path from s to t.
 * Endpoints do not count as on the path.
 * 
 * @param network - The referral network to analyze
 * @param k - The number of top users to return (default: 5, undefined: all users)
 * @returns Promise resolving to array of user IDs sorted by flow centrality (descending)
 */
export async function topKByFlowCentrality(network: ReferralNetwork, k: number = 5): Promise<UserId[]> {
  if (k !== undefined && k < 0) {
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

  // If k is undefined, return all users
  if (k === undefined) {
    k = allUsers.length;
  }

  // Calculate flow centrality for each user
  const userFlowCentralityPairs: Array<{ userId: UserId; flowCentrality: number }> = [];
  
  for (const user of allUsers) {
    try {
      const flowCentrality = await calculateFlowCentrality(network, user.userId);
      userFlowCentralityPairs.push({ userId: user.userId, flowCentrality });
    } catch (error) {
      // Skip users that cause errors (e.g., if they don't exist)
      console.warn(`Failed to calculate flow centrality for user ${user.userId}:`, error);
    }
  }

  // Sort by flow centrality in descending order, then by userId for stable sorting
  userFlowCentralityPairs.sort((a, b) => {
    if (a.flowCentrality !== b.flowCentrality) {
      return b.flowCentrality - a.flowCentrality; // Descending by flow centrality
    }
    return a.userId.localeCompare(b.userId); // Ascending by userId for tie-breaking
  });

  // Return top k users
  return userFlowCentralityPairs.slice(0, k).map(pair => pair.userId);
}
