import { Room } from '../aggregates/Room';
import { RoomId } from '../value-objects/RoomId';
import { PeerId } from '../value-objects/PeerId';

/**
 * 房間倉儲介面
 */
export interface IRoomRepository {
  /**
   * 保存房間
   */
  save(room: Room): Promise<void>;
  
  /**
   * 根據ID查找房間
   */
  findById(id: RoomId): Promise<Room | null>;
  
  /**
   * 查找用戶參與的所有房間
   */
  findByParticipant(peerId: PeerId): Promise<Room[]>;
  
  /**
   * 查找所有活躍房間
   */
  findActiveRooms(): Promise<Room[]>;
  
  /**
   * 根據搜尋條件查找房間
   */
  search(query: string, limit?: number): Promise<Room[]>;
  
  /**
   * 刪除房間
   */
  delete(id: RoomId): Promise<void>;
} 