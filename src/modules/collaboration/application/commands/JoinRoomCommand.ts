import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';

/**
 * 加入房間命令
 */
export class JoinRoomCommand {
  constructor(
    public readonly roomId: RoomId,
    public readonly peerId: PeerId,
    public readonly username: string
  ) {}
} 