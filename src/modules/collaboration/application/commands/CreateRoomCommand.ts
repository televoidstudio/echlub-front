import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';
import { PeerId } from '../../domain/value-objects/PeerId';

/**
 * 創建房間命令
 */
export class CreateRoomCommand {
  constructor(
    public readonly ownerId: PeerId,
    public readonly ownerUsername: string,
    public readonly name: string,
    public readonly maxPlayers: number = 4,
    public readonly allowRelay: boolean = true,
    public readonly latencyTargetMs: number = 100,
    public readonly opusBitrate: number = 32000
  ) {}

  /**
   * 獲取從命令參數生成的房間規則
   */
  public getRules(): RoomRuleVO {
    return RoomRuleVO.create(
      this.maxPlayers,
      this.allowRelay,
      this.latencyTargetMs,
      this.opusBitrate
    );
  }
} 