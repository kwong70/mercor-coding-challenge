/**
 * Main entry point for the Referral Network library
 */

// Core classes
export { ReferralNetwork } from './ReferralNetwork.js';

// Types and interfaces
export * from './types/index.js';

// Storage interfaces and implementations
export * from './storage/interfaces.js';
export { InMemoryStorage } from './storage/InMemoryStorage.js';
export { StorageFactory } from './storage/StorageFactory.js';

// Influence analysis functions
export { topKByReach } from './influence.js';

// Re-export commonly used types for convenience
export type {
  UserId,
  ReferralNetworkConfig,
  NetworkStats,
  ReferralError,
  Result,
  UserNode,
  ReferralRelationship
} from './types/index.js';

// Export enum as value (not type)
export { ReferralErrorType } from './types/index.js';
