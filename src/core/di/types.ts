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
  Logger: Symbol.for('Logger')
} as const; 