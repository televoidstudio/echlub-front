import { ValueObject } from './ValueObject';

/**
 * Interface for unique identifier properties
 * Provides rich semantic definition
 */
export interface UniqueIdProps<T = string> {
  value: T;
}

/**
 * Unique identifier value object
 * Used for unique identification in domain models
 * Supports generic types, with string as default
 */
export class UniqueId<T = string> extends ValueObject<UniqueIdProps<T>> {
  /**
   * UUID format regular expression
   */
  protected static readonly UUID_REGEX = 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  /**
   * UUID generator
   * Using protected so subclasses can access it
   */
  protected static generator: (() => string) | null = null;

  /**
   * Set UUID generator
   */
  public static setGenerator(generator: () => string): void {
    this.generator = generator;
  }

  /**
   * Initialize and automatically set generator
   */
  public static initialize(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        this.setGenerator(() => crypto.randomUUID());
      }
    } else {
      // Node.js environment
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { randomUUID } = require('crypto');
        this.setGenerator(randomUUID);
      } catch (e) {
        console.warn('Failed to import Node.js crypto module, UUID generation functionality unavailable');
      }
    }
  }

  /**
   * Create unique identifier
   */
  // Implementation details placed in both instance methods and static methods
  // TypeScript has limited support for generics in static methods
  public static create(_args?: any[]): any {
    if (!this.generator && this === UniqueId) {
      // Try using built-in method
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return new UniqueId(crypto.randomUUID());
      }
      throw new Error('No UUID generator available, please call UniqueId.initialize() or UniqueId.setGenerator() first');
    }
    
    if (this === UniqueId) {
      return new UniqueId(this.generator!());
    }
    
    // Subclasses should override this method
    throw new Error('Subclasses must implement their own create method');
  }

  /**
   * Create unique identifier from string
   * @param id identifier value
   */
  constructor(id: T) {
    super({ value: id });
  }

  /**
   * Validate properties
   * Default implementation suitable for string type, subclasses can override to support other types
   */
  protected validateProps(props: UniqueIdProps<T>): UniqueIdProps<T> {
    if (props.value === null || props.value === undefined) {
      throw new Error('ID cannot be null or undefined');
    }
    
    // Additional validation for string type
    if (typeof props.value === 'string' && (props.value as string).trim() === '') {
      throw new Error('String ID cannot be empty');
    }
    
    return props;
  }

  /**
   * Check if it's a valid unique identifier
   * Subclasses can override this method to provide specific type validation
   */
  public static isValid(id: unknown): boolean {
    if (typeof id === 'string') {
      return id !== null && id !== undefined && id.trim() !== '';
    }
    return id !== null && id !== undefined;
  }

  /**
   * Check if it's a valid UUID format
   */
  public static isValidUUID(id: string): boolean {
    return this.isValid(id) && this.UUID_REGEX.test(id);
  }

  /**
   * Get unique identifier value
   */
  get value(): T {
    return this.props.value;
  }

  /**
   * Implement equality comparison logic
   */
  protected equalsCore(other: UniqueId<T>): boolean {
    return this.compareValues(this.props.value, other.props.value);
  }
  
  /**
   * Compare if two values are equal
   * Support comparison logic for different types
   */
  private compareValues(a: T, b: T): boolean {
    // Basic data types
    if (typeof a === 'string' && typeof b === 'string') {
      return a === b;
    }
    
    if (typeof a === 'number' && typeof b === 'number') {
      return a === b;
    }
    
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return a === b;
    }
    
    // Handle object types
    if (a === null || b === null) {
      return a === b;
    }
    
    // If object has its own equals method
    if (typeof a === 'object' && a !== null && 'equals' in a && typeof (a as any).equals === 'function') {
      return (a as any).equals(b);
    }
    
    // Finally perform strict equality
    return a === b;
  }

  /**
   * Convert to string
   */
  toString(): string {
    if (typeof this.props.value === 'object' && this.props.value !== null && 'toString' in this.props.value) {
      return (this.props.value as any).toString();
    }
    return String(this.props.value);
  }
  
  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return this.props.value;
  }
} 
