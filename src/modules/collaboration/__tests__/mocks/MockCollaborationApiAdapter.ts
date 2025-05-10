import { ICollaborationApiAdapter, ApiResponse, RoomResponse, CreateRoomRequest, UpdateRoomRulesRequest, CloseRoomRequest } from "../../infrastructure/adapters/ICollaborationApiAdapter";
import { RoomId } from "../../domain/value-objects/RoomId";
import { injectable } from "inversify";
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock implementation of Collaboration API Adapter for testing
 */
@injectable()
export class MockCollaborationApiAdapter implements ICollaborationApiAdapter {
  private roomStore: Map<string, { ownerId: string }> = new Map();
  
  /**
   * Create a new room
   */
  async createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>> {
    const roomId = uuidv4();
    this.roomStore.set(roomId, { ownerId: request.ownerId });
    return { 
      data: { 
        roomId
      },
      message: 'Room created successfully'
    };
  }
  
  /**
   * Get room status
   */
  async getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>> {
    const room = this.roomStore.get(roomId.toString());
    const ownerId = room ? room.ownerId : uuidv4();
    return { 
      data: {
        id: roomId.toString(),
        ownerId,
        active: true,
        maxPlayers: 4,
        currentPlayers: [ownerId],
        rules: {
          maxPlayers: 4,
          allowRelay: true,
          latencyTargetMs: 100,
          opusBitrate: 32000
        }
      }
    };
  }
  
  /**
   * Update room rules
   */
  async updateRoomRules(_roomId: RoomId, _request: UpdateRoomRulesRequest): Promise<ApiResponse<void>> {
    return {
      message: 'Room rules updated successfully'
    };
  }
  
  /**
   * Close room
   */
  async closeRoom(_roomId: RoomId, _request: CloseRoomRequest): Promise<ApiResponse<void>> {
    return {
      message: 'Room closed successfully'
    };
  }
} 