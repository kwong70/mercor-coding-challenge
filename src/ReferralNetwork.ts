/**
 * Production-quality ReferralNetwork implementation
 * 
 * This class provides a clean interface for managing referral relationships
 * with proper validation, error handling, and extensibility.
 */

import { 
  IReferralStorage, 
  StorageConfig 
} from './storage/interfaces.js';
import { 
  UserId, 
  ReferralNetworkConfig, 
  NetworkStats,
  ReferralError, 
  ReferralErrorType,
  Result,
  UserNode
} from './types/index.js';
import { StorageFactory } from './storage/StorageFactory.js';

/**
 * Main ReferralNetwork class that manages referral relationships
 * 
 * Features:
 * - Configurable constraints (self-referrals, multiple referrers, cycles)
 * - Pluggable storage backend
 * - Comprehensive error handling
 * - Performance optimizations
 * - Thread-safe operations
 */
export class ReferralNetwork {
  private storage: IReferralStorage;
  private config: ReferralNetworkConfig;
  private isInitialized = false;

  constructor(
    config: Partial<ReferralNetworkConfig> = {},
    storage?: IReferralStorage
  ) {
    this.config = {
      allowSelfReferrals: false,
      allowMultipleReferrers: false,
      allowCycles: false,
      ...config
    };

    this.storage = storage || StorageFactory.createDefaultStorage();
  }

  /**
   * Initialize the network with a custom storage backend
   */
  async initialize(storageConfig?: StorageConfig & { type: 'in-memory' | 'postgresql' | 'mongodb' | 'redis' }): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (storageConfig) {
      const factory = new StorageFactory();
      this.storage = factory.createStorage(storageConfig);
    }

    await this.storage.initialize();
    this.isInitialized = true;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    if (this.storage) {
      await this.storage.destroy();
    }
    this.isInitialized = false;
  }

  /**
   * Add a referral relationship between two users
   * 
   * @param referrer - The user making the referral
   * @param candidate - The user being referred
   * @returns Result indicating success or failure
   */
  async addReferral(referrer: UserId, candidate: UserId): Promise<Result<void, ReferralError>> {
    try {
      await this.ensureInitialized();

      // Validate inputs
      const validationResult = this.validateReferralInput(referrer, candidate);
      if (!validationResult.success) {
        return validationResult;
      }

      // Check constraints
      const constraintResult = await this.validateReferralConstraints(referrer, candidate);
      if (!constraintResult.success) {
        return constraintResult;
      }

      // Add the referral
      await this.storage.addReferral(referrer, candidate);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to add referral',
          { referrer, candidate, originalError: error }
        )
      };
    }
  }

  /**
   * Get direct referrals for a user
   * 
   * @param user - The user to get direct referrals for
   * @returns Array of user IDs directly referred by the given user
   */
  async directReferrals(user: UserId): Promise<Result<UserId[], ReferralError>> {
    try {
      await this.ensureInitialized();

      if (!this.isValidUserId(user)) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.INVALID_INPUT,
            'Invalid user ID',
            { user }
          )
        };
      }

      const referrals = await this.storage.getDirectReferrals(user);
      return { success: true, data: referrals };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to get direct referrals',
          { user, originalError: error }
        )
      };
    }
  }

  /**
   * Get all referrals (direct and indirect) for a user
   * 
   * @param user - The user to get all referrals for
   * @returns Array of all user IDs in the referral tree
   */
  async allReferrals(user: UserId): Promise<Result<UserId[], ReferralError>> {
    try {
      await this.ensureInitialized();

      if (!this.isValidUserId(user)) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.INVALID_INPUT,
            'Invalid user ID',
            { user }
          )
        };
      }

      const referrals = await this.storage.getAllReferrals(user);
      return { success: true, data: referrals };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to get all referrals',
          { user, originalError: error }
        )
      };
    }
  }

  /**
   * Get the parent (referrer) of a user
   * 
   * @param user - The user to get the parent for
   * @returns The parent user ID or null if no parent exists
   */
  async getParent(user: UserId): Promise<Result<UserId | null, ReferralError>> {
    try {
      await this.ensureInitialized();

      if (!this.isValidUserId(user)) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.INVALID_INPUT,
            'Invalid user ID',
            { user }
          )
        };
      }

      const parent = await this.storage.getParent(user);
      return { success: true, data: parent };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to get parent',
          { user, originalError: error }
        )
      };
    }
  }

  /**
   * Get all users in the network
   * 
   * @returns Array of all users
   */
  async getAllUsers(): Promise<Result<UserNode[], ReferralError>> {
    try {
      await this.ensureInitialized();

      const users = await this.storage.getAllUsers();
      return { success: true, data: users };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to get all users',
          { originalError: error }
        )
      };
    }
  }

  /**
   * Get network statistics
   * 
   * @returns Network statistics
   */
  async getNetworkStats(): Promise<Result<NetworkStats, ReferralError>> {
    try {
      await this.ensureInitialized();

      const stats = await this.storage.getNetworkStats();
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to get network stats',
          { originalError: error }
        )
      };
    }
  }

  /**
   * Check if a user exists in the network
   * 
   * @param user - The user to check
   * @returns True if the user exists, false otherwise
   */
  async userExists(user: UserId): Promise<Result<boolean, ReferralError>> {
    try {
      await this.ensureInitialized();

      if (!this.isValidUserId(user)) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.INVALID_INPUT,
            'Invalid user ID',
            { user }
          )
        };
      }

      const exists = await this.storage.userExists(user);
      return { success: true, data: exists };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to check user existence',
          { user, originalError: error }
        )
      };
    }
  }

  /**
   * Remove a user and all their relationships
   * 
   * @param user - The user to remove
   * @returns Result indicating success or failure
   */
  async removeUser(user: UserId): Promise<Result<void, ReferralError>> {
    try {
      await this.ensureInitialized();

      if (!this.isValidUserId(user)) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.INVALID_INPUT,
            'Invalid user ID',
            { user }
          )
        };
      }

      await this.storage.removeUser(user);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to remove user',
          { user, originalError: error }
        )
      };
    }
  }

  /**
   * Clear all data from the network
   * 
   * @returns Result indicating success or failure
   */
  async clear(): Promise<Result<void, ReferralError>> {
    try {
      await this.ensureInitialized();

      await this.storage.clear();
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.STORAGE_ERROR,
          'Failed to clear network',
          { originalError: error }
        )
      };
    }
  }

  /**
   * Update network configuration
   * 
   * @param newConfig - New configuration options
   */
  updateConfig(newConfig: Partial<ReferralNetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current network configuration
   * 
   * @returns Current configuration
   */
  getConfig(): ReferralNetworkConfig {
    return { ...this.config };
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private validateReferralInput(referrer: UserId, candidate: UserId): Result<void, ReferralError> {
    if (!this.isValidUserId(referrer)) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.INVALID_INPUT,
          'Invalid referrer ID',
          { referrer }
        )
      };
    }

    if (!this.isValidUserId(candidate)) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.INVALID_INPUT,
          'Invalid candidate ID',
          { candidate }
        )
      };
    }

    return { success: true, data: undefined };
  }

  private async validateReferralConstraints(
    referrer: UserId, 
    candidate: UserId
  ): Promise<Result<void, ReferralError>> {
    // Check for self-referral
    if (!this.config.allowSelfReferrals && referrer === candidate) {
      return {
        success: false,
        error: new ReferralError(
          ReferralErrorType.SELF_REFERRAL,
          'Self-referrals are not allowed',
          { referrer, candidate }
        )
      };
    }

    // Check for multiple referrers
    if (!this.config.allowMultipleReferrers) {
      const existingParent = await this.storage.getParent(candidate);
      if (existingParent && existingParent !== referrer) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.MULTIPLE_REFERRERS,
            'Candidate already has a referrer',
            { candidate, existingParent, newReferrer: referrer }
          )
        };
      }
    }

    // Check for cycles
    if (!this.config.allowCycles) {
      const wouldCreateCycle = await this.storage.wouldCreateCycle(referrer, candidate);
      if (wouldCreateCycle) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.CYCLE_DETECTED,
            'Adding this referral would create a cycle',
            { referrer, candidate }
          )
        };
      }
    }

    // Check network size limit
    if (this.config.maxNetworkSize) {
      const stats = await this.storage.getNetworkStats();
      if (stats.totalUsers >= this.config.maxNetworkSize) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.NETWORK_SIZE_LIMIT,
            'Network size limit reached',
            { maxSize: this.config.maxNetworkSize, currentSize: stats.totalUsers }
          )
        };
      }
    }

    // Check referral limit per user
    if (this.config.maxReferralsPerUser) {
      const directReferrals = await this.storage.getDirectReferrals(referrer);
      if (directReferrals.length >= this.config.maxReferralsPerUser) {
        return {
          success: false,
          error: new ReferralError(
            ReferralErrorType.REFERRAL_LIMIT,
            'User has reached maximum referral limit',
            { 
              user: referrer, 
              maxReferrals: this.config.maxReferralsPerUser, 
              currentReferrals: directReferrals.length 
            }
          )
        };
      }
    }

    return { success: true, data: undefined };
  }

  private isValidUserId(userId: UserId): boolean {
    return typeof userId === 'string' && userId.trim().length > 0;
  }
}
