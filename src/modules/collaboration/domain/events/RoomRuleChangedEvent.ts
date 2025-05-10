import { DomainEvent } from '../../../../shared/domain';
import { RoomId } from '../value-objects/RoomId';
import { RoomRuleVO } from '../value-objects/RoomRuleVO';

/**
 * Event representing room rules being changed
 */
export class RoomRuleChangedEvent extends DomainEvent {
  public get eventType(): string {
    return 'collab.room-rule-changed';
  }
  
  public readonly payload: {
    roomId: string;
    rules: {
      maxPlayers: number;
      allowRelay: boolean;
      latencyTargetMs: number;
      opusBitrate: number;
    };
  };

  constructor(
    public readonly roomId: RoomId,
    public readonly rules: RoomRuleVO
  ) {
    super('collab.room-rule-changed', roomId.toString());
    this.payload = {
      roomId: roomId.toString(),
      rules: {
        maxPlayers: rules.maxPlayers,
        allowRelay: rules.allowRelay,
        latencyTargetMs: rules.latencyTargetMs,
        opusBitrate: rules.opusBitrate
      }
    };
  }
} 