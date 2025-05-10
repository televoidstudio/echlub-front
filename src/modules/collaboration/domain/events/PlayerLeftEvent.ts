import { DomainEvent } from '../../../../shared/domain';
import { RoomId } from '../value-objects/RoomId';
import { PeerId } from '../value-objects/PeerId';

/**
 * Event representing a player leaving a room
 */
export class PlayerLeftEvent extends DomainEvent {
  public get eventType(): string {
    return 'collab.player-left';
  }
  
  public readonly payload: {
    roomId: string;
    peerId: string;
    leftAt: string;
  };

  constructor(
    public readonly roomId: RoomId,
    public readonly peerId: PeerId,
    public readonly leftAt: Date = new Date()
  ) {
    super('collab.player-left', roomId.toString());
    this.payload = {
      roomId: roomId.toString(),
      peerId: peerId.toString(),
      leftAt: leftAt.toISOString()
    };
  }
} 