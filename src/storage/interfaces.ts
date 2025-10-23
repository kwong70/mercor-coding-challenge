/**
 * Storage abstraction interfaces for the Referral Network
 * 
 * This allows easy swapping between different storage backends
 * (in-memory, Redis, PostgreSQL, MongoDB, etc.)
 */

import { 
  UserId, 
  UserNode, 
  ReferralRelationship, 
  NetworkStats
} from '../types/index.js';

/**
 * Interface for storing and retrieving referral network data
 */
export interface IReferralStorage {
  /**
   * Initialize the storage backend
   */
  initialize(): Promise<void>;

  /**
   * Clean up resources
   */
  destroy(): Promise<void>;

  /**
   * Add a user to the network
   */
  addUser(userId: UserId, createdAt?: Date): Promise<void>;

  /**
   * Get a user node by ID
   */
  getUser(userId: UserId): Promise<UserNode | null>;

  /**
   * Check if a user exists in the network
   */
  userExists(userId: UserId): Promise<boolean>;

  /**
   * Add a referral relationship
   */
  addReferral(referrer: UserId, candidate: UserId, createdAt?: Date): Promise<void>;

  /**
   * Get all users in the network
   */
  getAllUsers(): Promise<UserNode[]>;

  /**
   * Get direct referrals for a user
   */
  getDirectReferrals(userId: UserId): Promise<UserId[]>;

  /**
   * Get all referrals (direct and indirect) for a user
   */
  getAllReferrals(userId: UserId): Promise<UserId[]>;

  /**
   * Get the parent (referrer) of a user
   */
  getParent(userId: UserId): Promise<UserId | null>;

  /**
   * Get network statistics
   */
  getNetworkStats(): Promise<NetworkStats>;

  /**
   * Check if adding a referral would create a cycle
   */
  wouldCreateCycle(referrer: UserId, candidate: UserId): Promise<boolean>;

  /**
   * Get all referral relationships
   */
  getAllReferralRelationships(): Promise<ReferralRelationship[]>;

  /**
   * Remove a user and all their relationships
   */
  removeUser(userId: UserId): Promise<void>;

  /**
   * Remove a specific referral relationship
   */
  removeReferral(referrer: UserId, candidate: UserId): Promise<void>;

  /**
   * Clear all data (useful for testing)
   */
  clear(): Promise<void>;
}

/**
 * Configuration for storage backends
 */
export interface StorageConfig {
  connectionString?: string;
  database?: string;
  tableName?: string;
  collectionName?: string;
  maxConnections?: number;
  timeout?: number;
  retryAttempts?: number;
  [key: string]: unknown;
}

/**
 * Factory interface for creating storage instances
 */
export interface IStorageFactory {
  createStorage(config: StorageConfig): IReferralStorage;
}
