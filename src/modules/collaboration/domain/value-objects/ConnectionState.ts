/**
 * Enum representing connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',  // Disconnected
  CONNECTING = 'connecting',      // Connecting
  CONNECTED = 'connected',        // Connected
  RELAYING = 'relaying',          // Relaying mode
  FALLBACK = 'fallback',          // Fallback mode (WebRTC failed, using WebSocket)
  ERROR = 'error'                 // Error state
} 