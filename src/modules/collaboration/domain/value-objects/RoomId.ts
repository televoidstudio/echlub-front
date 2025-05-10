import { UniqueId } from '../../../../shared/domain/value-objects/UniqueId';

/**
 * Represents a unique room identifier
 */
export class RoomId extends UniqueId<string> {
  /**
   * Create a new RoomId
   */
  public static create(): RoomId {
    if (!RoomId.generator) {
      // Try using built-in method
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return new RoomId(crypto.randomUUID());
      }
      throw new Error('No UUID generator available, please call UniqueId.initialize() or UniqueId.setGenerator() first');
    }
    
    return new RoomId(RoomId.generator());
  }

  /**
   * Create RoomId from an existing string
   */
  public static fromString(id: string): RoomId {
    if (!UniqueId.isValidUUID(id)) {
      throw new Error('Invalid room ID format');
    }
    return new RoomId(id);
  }

  /**
   * Check if string is a valid RoomId format
   */
  public static isValid(id: string): boolean {
    return UniqueId.isValidUUID(id);
  }
} 