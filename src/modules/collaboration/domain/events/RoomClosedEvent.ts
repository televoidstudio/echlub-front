import { DomainEvent } from '../../../../shared/domain';
import { RoomId } from '../value-objects/RoomId';

/**
 * Event representing a room being closed
 */
export class RoomClosedEvent extends DomainEvent {
  public get eventType(): string {
    return 'collab.room-closed';
  }
  
  public readonly payload: {
    roomId: string;
    closedAt: string;
  };

  constructor(
    public readonly roomId: RoomId,
    public readonly closedAt: Date = new Date()
  ) {
    super('collab.room-closed', roomId.toString());
    this.payload = {
      roomId: roomId.toString(),
      closedAt: closedAt.toISOString()
    };
  }
} 