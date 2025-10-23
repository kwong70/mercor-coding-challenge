/**
 * In-memory implementation of IReferralStorage
 * 
 * This is a simple, fast implementation for development and testing.
 * In production, you would replace this with a database-backed implementation.
 */

import { 
  IReferralStorage
} from './interfaces.js';
import { 
  UserId, 
  UserNode, 
  ReferralRelationship, 
  NetworkStats
} from '../types/index.js';

export class InMemoryStorage implements IReferralStorage {
  private users: Map<UserId, UserNode> = new Map();
  private referrals: Map<string, ReferralRelationship> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    this.users.clear();
    this.referrals.clear();
    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    this.users.clear();
    this.referrals.clear();
    this.isInitialized = false;
  }

  async addUser(userId: UserId, createdAt: Date = new Date()): Promise<void> {
    if (this.users.has(userId)) {
      return; // User already exists, no-op
    }

    this.users.set(userId, {
      userId,
      directReferrals: [],
      createdAt
    });
  }

  async getUser(userId: UserId): Promise<UserNode | null> {
    return this.users.get(userId) || null;
  }

  async userExists(userId: UserId): Promise<boolean> {
    return this.users.has(userId);
  }

  async addReferral(referrer: UserId, candidate: UserId, createdAt: Date = new Date()): Promise<void> {
    const referralKey = `${referrer}:${candidate}`;
    
    // Add the referral relationship
    this.referrals.set(referralKey, {
      referrer,
      candidate,
      createdAt
    });

    // Update user nodes
    await this.addUser(referrer, createdAt);
    await this.addUser(candidate, createdAt);

    const referrerNode = this.users.get(referrer)!;
    const candidateNode = this.users.get(candidate)!;

    // Add to referrer's direct referrals
    if (!referrerNode.directReferrals.includes(candidate)) {
      referrerNode.directReferrals.push(candidate);
    }

    // Set candidate's parent
    candidateNode.parent = referrer;
  }

  async getAllUsers(): Promise<UserNode[]> {
    return Array.from(this.users.values());
  }

  async getDirectReferrals(userId: UserId): Promise<UserId[]> {
    const user = this.users.get(userId);
    return user ? [...user.directReferrals] : [];
  }

  async getAllReferrals(userId: UserId): Promise<UserId[]> {
    const visited = new Set<UserId>();
    const result: UserId[] = [];

    const dfs = (currentUserId: UserId): void => {
      if (visited.has(currentUserId)) {
        return;
      }
      visited.add(currentUserId);

      const user = this.users.get(currentUserId);
      if (!user) {
        return;
      }

      for (const childId of user.directReferrals) {
        result.push(childId);
        dfs(childId);
      }
    };

    dfs(userId);
    return result;
  }

  async getParent(userId: UserId): Promise<UserId | null> {
    const user = this.users.get(userId);
    return user?.parent || null;
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const users = Array.from(this.users.values());
    const totalUsers = users.length;
    const totalReferrals = this.referrals.size;
    
    let maxDepth = 0;
    let totalReferralsPerUser = 0;

    for (const user of users) {
      const depth = this.calculateDepth(user.userId);
      maxDepth = Math.max(maxDepth, depth);
      totalReferralsPerUser += user.directReferrals.length;
    }

    const averageReferralsPerUser = totalUsers > 0 ? totalReferralsPerUser / totalUsers : 0;

    return {
      totalUsers,
      totalReferrals,
      maxDepth,
      averageReferralsPerUser
    };
  }

  async wouldCreateCycle(referrer: UserId, candidate: UserId): Promise<boolean> {
    return this.canReach(candidate, referrer);
  }

  async getAllReferralRelationships(): Promise<ReferralRelationship[]> {
    return Array.from(this.referrals.values());
  }

  async removeUser(userId: UserId): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      return;
    }

    // Remove all referrals where this user is the referrer
    for (const childId of user.directReferrals) {
      const referralKey = `${userId}:${childId}`;
      this.referrals.delete(referralKey);
      
      // Remove parent relationship from child
      const child = this.users.get(childId);
      if (child) {
        delete child.parent;
      }
    }

    // Remove referrals where this user is the candidate
    for (const [key, referral] of this.referrals.entries()) {
      if (referral.candidate === userId) {
        this.referrals.delete(key);
        
        // Remove from referrer's direct referrals
        const referrer = this.users.get(referral.referrer);
        if (referrer) {
          referrer.directReferrals = referrer.directReferrals.filter(id => id !== userId);
        }
      }
    }

    // Remove the user
    this.users.delete(userId);
  }

  async removeReferral(referrer: UserId, candidate: UserId): Promise<void> {
    const referralKey = `${referrer}:${candidate}`;
    this.referrals.delete(referralKey);

    // Update user nodes
    const referrerNode = this.users.get(referrer);
    if (referrerNode) {
      referrerNode.directReferrals = referrerNode.directReferrals.filter(id => id !== candidate);
    }

    const candidateNode = this.users.get(candidate);
    if (candidateNode) {
      delete candidateNode.parent;
    }
  }

  async clear(): Promise<void> {
    this.users.clear();
    this.referrals.clear();
  }

  private canReach(start: UserId, target: UserId): boolean {
    if (start === target) {
      return true;
    }

    const visited = new Set<UserId>();
    const queue: UserId[] = [start];
    visited.add(start);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const user = this.users.get(current);
      
      if (!user) {
        continue;
      }

      for (const childId of user.directReferrals) {
        if (childId === target) {
          return true;
        }

        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push(childId);
        }
      }
    }

    return false;
  }

  private calculateDepth(userId: UserId): number {
    const visited = new Set<UserId>();
    
    const dfs = (currentUserId: UserId): number => {
      if (visited.has(currentUserId)) {
        return 0;
      }
      visited.add(currentUserId);

      const user = this.users.get(currentUserId);
      if (!user || user.directReferrals.length === 0) {
        return 0;
      }

      let maxChildDepth = 0;
      for (const childId of user.directReferrals) {
        maxChildDepth = Math.max(maxChildDepth, dfs(childId));
      }

      return 1 + maxChildDepth;
    };

    return dfs(userId);
  }
}
