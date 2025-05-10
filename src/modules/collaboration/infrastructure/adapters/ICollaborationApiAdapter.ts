import { RoomId } from '../../domain/value-objects/RoomId';

/**
 * Room information response interface
 */
export interface RoomResponse {
  id: string;
  ownerId: string;
  active: boolean;
  maxPlayers: number;
  currentPlayers: string[];
  rules: {
    maxPlayers: number;
    allowRelay: boolean;
    latencyTargetMs: number;
    opusBitrate: number;
  };
}

/**
 * Create room request
 */
export interface CreateRoomRequest {
  ownerId: string;
  maxPlayers: number;
  allowRelay: boolean;
  latencyTargetMs: number;
  opusBitrate: number;
}

/**
 * Update room rules request
 */
export interface UpdateRoomRulesRequest {
  ownerId: string;
  maxPlayers: number;
  allowRelay: boolean;
  latencyTargetMs: number;
  opusBitrate: number;
}

/**
 * Close room request
 */
export interface CloseRoomRequest {
  ownerId: string;
}

/**
 * API response result
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Collaboration API Adapter Interface
 * Used for communication with the backend collaboration API
 */
export interface ICollaborationApiAdapter {
  /**
   * Create a new room
   * @param request Create room request
   */
  createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>>;
  
  /**
   * Get room status
   * @param roomId Room ID
   */
  getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>>;
  
  /**
   * Update room rules
   * @param roomId Room ID
   * @param request Update rules request
   */
  updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<void>>;
  
  /**
   * Close room
   * @param roomId Room ID
   * @param request Close room request
   */
  closeRoom(roomId: RoomId, request: CloseRoomRequest): Promise<ApiResponse<void>>;
} 