import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';

/**
 * Update room rules command
 * Used when the room owner wants to change room settings
 */
export class UpdateRoomRulesCommand {
  constructor(
    public readonly roomId: RoomId,
    public readonly ownerId: PeerId,
    public readonly maxPlayers?: number,
    public readonly allowRelay?: boolean,
    public readonly latencyTargetMs?: number,
    public readonly opusBitrate?: number
  ) {}

  /**
   * Get room rules from command parameters
   * If a parameter is not provided, it will be loaded from the existing rules
   */
  public getRules(currentRules: RoomRuleVO): RoomRuleVO {
    return RoomRuleVO.create(
      this.maxPlayers ?? currentRules.maxPlayers,
      this.allowRelay ?? currentRules.allowRelay,
      this.latencyTargetMs ?? currentRules.latencyTargetMs,
      this.opusBitrate ?? currentRules.opusBitrate
    );
  }
} 