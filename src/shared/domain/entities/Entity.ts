/**
 * 實體基類
 * 所有領域實體都應繼承此類
 */
export abstract class Entity {
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(createdAt: Date, updatedAt: Date) {
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  public equals(other: Entity): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._createdAt.getTime() === other._createdAt.getTime();
  }
} 