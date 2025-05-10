import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { CreateRoomCommand } from '../commands/CreateRoomCommand';
import type { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { Room } from '../../domain/aggregates/Room';
import { RoomId } from '../../domain/value-objects/RoomId';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * 處理創建房間命令
 */
@injectable()
export class CreateRoomCommandHandler {
  constructor(
    @inject(CollaborationTypes.RoomRepository)
    private readonly roomRepository: IRoomRepository,
    
    @inject(CollaborationTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  /**
   * 處理創建房間命令，創建並保存新房間
   */
  async handle(command: CreateRoomCommand): Promise<RoomId> {
    // 創建房間ID
    const roomId = RoomId.create();
    
    // 從命令獲取房間規則
    const rules = command.getRules();
    
    // 創建房間聚合
    const room = Room.create(
      roomId,
      command.ownerId,
      command.ownerUsername,
      command.name,
      rules
    );
    
    // 保存房間
    await this.roomRepository.save(room);
    
    // 發佈領域事件
    const domainEvents = room.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    
    // 清除已發佈的事件
    room.clearDomainEvents();
    
    return roomId;
  }
} 