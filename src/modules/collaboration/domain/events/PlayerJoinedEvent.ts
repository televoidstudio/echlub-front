import { DomainEvent } from '../../../../shared/domain';
import { RoomId } from '../value-objects/RoomId';
import { PeerId } from '../value-objects/PeerId';

/**
 * Event representing a player joining a room
 */
export class PlayerJoinedEvent extends DomainEvent {
  public get eventType(): string {
    return 'collab.player-joined';
  }
  
  public readonly payload: {
    roomId: string;
    peerId: string;
    username: string;
    joinedAt: string;
  };

  constructor(
    public readonly roomId: RoomId,
    public readonly peerId: PeerId,
    public readonly username: string,
    public readonly joinedAt: Date = new Date()
  ) {
    super('collab.player-joined', roomId.toString());
    this.payload = {
      roomId: roomId.toString(),
      peerId: peerId.toString(),
      username,
      joinedAt: joinedAt.toISOString()
    };
  }
} 