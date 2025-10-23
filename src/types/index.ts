/**
 * Core types and interfaces for the Referral Network system
 */

/**
 * Represents a user in the referral network
 */
export type UserId = string;

/**
 * Represents a referral relationship between two users
 */
export interface ReferralRelationship {
  referrer: UserId;
  candidate: UserId;
  createdAt: Date;
}

/**
 * Represents a user node in the network with their relationships
 */
export interface UserNode {
  userId: UserId;
  directReferrals: UserId[];
  parent?: UserId;
  createdAt: Date;
}

/**
 * Configuration options for the ReferralNetwork
 */
export interface ReferralNetworkConfig {
  allowSelfReferrals: boolean;
  allowMultipleReferrers: boolean;
  allowCycles: boolean;
  maxNetworkSize?: number;
  maxReferralsPerUser?: number;
}

/**
 * Statistics about the network
 */
export interface NetworkStats {
  totalUsers: number;
  totalReferrals: number;
  maxDepth: number;
  averageReferralsPerUser: number;
}

/**
 * Error types for the referral network
 */
export enum ReferralErrorType {
  SELF_REFERRAL = 'SELF_REFERRAL',
  MULTIPLE_REFERRERS = 'MULTIPLE_REFERRERS',
  CYCLE_DETECTED = 'CYCLE_DETECTED',
  NETWORK_SIZE_LIMIT = 'NETWORK_SIZE_LIMIT',
  REFERRAL_LIMIT = 'REFERRAL_LIMIT',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

/**
 * Custom error class for referral network operations
 */
export class ReferralError extends Error {
  public readonly type: ReferralErrorType;
  public readonly details?: Record<string, unknown> | undefined;

  constructor(
    type: ReferralErrorType,
    message: string,
    details?: Record<string, unknown> | undefined
  ) {
    super(message);
    this.name = 'ReferralError';
    this.type = type;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, ReferralError);
    }
  }
}

/**
 * Result type for operations that might fail
 */
export type Result<T, E = ReferralError> = 
  | { success: true; data: T }
  | { success: false; error: E };

