import { DomainEvent } from '../../../../shared/domain';
import { RoomId } from '../value-objects/RoomId';
import { PeerId } from '../value-objects/PeerId';
import { RoomRuleVO } from '../value-objects/RoomRuleVO';

/**
 * Event representing a new room being created
 */
export class RoomCreatedEvent extends DomainEvent {
  public get eventType(): string {
    return 'collab.room-created';
  }
  
  public readonly payload: {
    roomId: string;
    ownerId: string;
    name: string;
    rules: {
      maxPlayers: number;
      allowRelay: boolean;
      latencyTargetMs: number;
      opusBitrate: number;
    };
    createdAt: string;
  };

  constructor(
    public readonly roomId: RoomId,
    public readonly ownerId: PeerId,
    public readonly name: string,
    public readonly rules: RoomRuleVO,
    public readonly createdAt: Date = new Date()
  ) {
    super('collab.room-created', roomId.toString());
    this.payload = {
      roomId: roomId.toString(),
      ownerId: ownerId.toString(),
      name,
      rules: {
        maxPlayers: rules.maxPlayers,
        allowRelay: rules.allowRelay,
        latencyTargetMs: rules.latencyTargetMs,
        opusBitrate: rules.opusBitrate
      },
      createdAt: createdAt.toISOString()
    };
  }
} 