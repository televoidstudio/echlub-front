import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';

/**
 * WebRTC 信令類型
 */
export enum SignalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice-candidate'
}

/**
 * 信令數據接口
 */
export interface SignalData {
  type: SignalType;
  sender: string;
  recipient: string;
  payload: any;
}

/**
 * WebRTC 適配器接口
 * 負責處理 P2P 連接和信令交換
 */
export interface IWebRTCAdapter {
  /**
   * 初始化 WebRTC 適配器
   * @param localPeerId 本地對等方 ID
   */
  initialize(localPeerId: PeerId): Promise<void>;
  
  /**
   * 創建新的 P2P 連接
   * @param remotePeerId 遠程對等方 ID
   * @param initiator 本地是否為發起方
   */
  createConnection(remotePeerId: PeerId, initiator: boolean): Promise<void>;
  
  /**
   * 關閉與特定對等方的連接
   * @param remotePeerId 遠程對等方 ID
   */
  closeConnection(remotePeerId: PeerId): Promise<void>;
  
  /**
   * 關閉所有連接
   */
  closeAllConnections(): Promise<void>;
  
  /**
   * 處理接收到的信令數據
   * @param signal 信令數據
   */
  processSignal(signal: SignalData): Promise<void>;
  
  /**
   * 發送信令數據
   * @param recipientId 接收方 ID
   * @param signalType 信令類型
   * @param payload 信令數據內容
   */
  sendSignal(recipientId: PeerId, signalType: SignalType, payload: any): Promise<void>;
  
  /**
   * 獲取與對等方的連接狀態
   * @param peerId 對等方 ID
   */
  getConnectionState(peerId: PeerId): ConnectionState;
  
  /**
   * 發送數據至特定對等方
   * @param peerId 對等方 ID
   * @param channel 數據通道名稱
   * @param data 要發送的數據
   */
  sendData(peerId: PeerId, channel: string, data: any): Promise<void>;
  
  /**
   * 廣播數據至所有已連接的對等方
   * @param channel 數據通道名稱
   * @param data 要廣播的數據
   */
  broadcastData(channel: string, data: any): Promise<void>;
  
  /**
   * 訂閱特定通道的數據
   * @param channel 數據通道名稱
   * @param callback 接收數據的回調函數
   */
  subscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void;
  
  /**
   * 取消訂閱特定通道
   * @param channel 數據通道名稱
   * @param callback 要取消的回調函數
   */
  unsubscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void;
  
  /**
   * 監聽連接狀態變化
   * @param listener 狀態變化監聽器
   */
  onConnectionStateChange(listener: (peerId: PeerId, state: ConnectionState) => void): void;
  
  /**
   * 獲取所有已連接的對等方
   */
  getConnectedPeers(): PeerId[];
} 