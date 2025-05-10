import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { UpdateRoomRulesCommand } from '../commands/UpdateRoomRulesCommand';
import type { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * Handler for update room rules command
 * Updates the configuration settings for a room
 */
@injectable()
export class UpdateRoomRulesCommandHandler {
  constructor(
    @inject(CollaborationTypes.RoomRepository)
    private readonly roomRepository: IRoomRepository,
    
    @inject(CollaborationTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Handle the update room rules command
   * Changes room settings if valid
   */
  async handle(command: UpdateRoomRulesCommand): Promise<void> {
    // Find room
    const room = await this.roomRepository.findById(command.roomId);
    
    if (!room) {
      throw new Error(`Room not found: ${command.roomId.toString()}`);
    }
    
    // Verify caller is the room owner
    if (!room.ownerId.equals(command.ownerId)) {
      throw new Error('Only the room owner can update room rules');
    }
    
    // Get new rules based on current rules and command parameters
    const newRules = command.getRules(room.rules);
    
    // Update room rules
    room.updateRules(newRules);
    
    // Save updated room
    await this.roomRepository.save(room);
    
    // Publish domain events
    const domainEvents = room.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    
    // Clear published events
    room.clearDomainEvents();
  }
} 