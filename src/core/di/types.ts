export const TYPES = {
  // 倉儲
  TrackRepository: Symbol.for('TrackRepository'),
  ClipRepository: Symbol.for('ClipRepository'),
  PluginRepository: Symbol.for('PluginRepository'),

  // 服務
  TrackService: Symbol.for('TrackService'),
  ClipService: Symbol.for('ClipService'),
  PluginService: Symbol.for('PluginService'),
  TrackStateService: Symbol.for('TrackStateService'),

  // 核心服務
  EventBus: Symbol.for('EventBus'),
  StateManager: Symbol.for('StateManager'),
  Logger: Symbol.for('Logger'),
  EventMonitor: Symbol.for('EventMonitor'),
  DAWManager: Symbol.for('DAWManager'),

  // 客戶端
  WebSocketClient: Symbol.for('WebSocketClient'),
  WebRTCClient: Symbol.for('WebRTCClient'),

  // General
  ENV_CONFIG: Symbol.for('ENV_CONFIG') // Environment configuration for adapters and services
} as const; 