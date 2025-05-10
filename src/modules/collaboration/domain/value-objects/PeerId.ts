import { UniqueId } from '../../../../shared/domain/value-objects/UniqueId';

/**
 * Represents a unique participant identifier in a room
 */
export class PeerId extends UniqueId<string> {
  /**
   * Create a new PeerId
   */
  public static create(): PeerId {
    if (!PeerId.generator) {
      // Try using built-in method
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return new PeerId(crypto.randomUUID());
      }
      throw new Error('No UUID generator available, please call UniqueId.initialize() or UniqueId.setGenerator() first');
    }
    
    return new PeerId(PeerId.generator());
  }

  /**
   * Create PeerId from an existing string
   */
  public static fromString(id: string): PeerId {
    if (!UniqueId.isValidUUID(id)) {
      throw new Error('Invalid participant ID format');
    }
    return new PeerId(id);
  }

  /**
   * Check if string is a valid PeerId format
   */
  public static isValid(id: string): boolean {
    return UniqueId.isValidUUID(id);
  }
} 