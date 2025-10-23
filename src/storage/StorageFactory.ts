/**
 * Factory for creating storage instances
 * 
 * This allows easy swapping between different storage backends
 */

import { IReferralStorage, IStorageFactory, StorageConfig } from './interfaces.js';
import { InMemoryStorage } from './InMemoryStorage.js';

export type StorageType = 'in-memory' | 'postgresql' | 'mongodb' | 'redis';

export class StorageFactory implements IStorageFactory {
  /**
   * Create a storage instance based on the configuration
   */
  createStorage(config: StorageConfig & { type: StorageType }): IReferralStorage {
    switch (config.type) {
      case 'in-memory':
        return new InMemoryStorage();
      
      case 'postgresql':
        // In a real implementation, you would return a PostgreSQL-backed storage
        throw new Error('PostgreSQL storage not implemented yet');
      
      case 'mongodb':
        // In a real implementation, you would return a MongoDB-backed storage
        throw new Error('MongoDB storage not implemented yet');
      
      case 'redis':
        // In a real implementation, you would return a Redis-backed storage
        throw new Error('Redis storage not implemented yet');
      
      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }
  }

  /**
   * Create an in-memory storage instance (convenience method)
   */
  static createInMemoryStorage(): IReferralStorage {
    return new InMemoryStorage();
  }

  /**
   * Create a storage instance with default configuration
   */
  static createDefaultStorage(): IReferralStorage {
    return new InMemoryStorage();
  }
}
