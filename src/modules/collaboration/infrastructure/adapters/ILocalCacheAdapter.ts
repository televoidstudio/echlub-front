/**
 * 本地緩存適配器接口
 * 用於緩存房間和連接狀態信息
 */
export interface ILocalCacheAdapter {
  /**
   * 存儲數據
   * @param key 緩存鍵
   * @param data 要緩存的數據
   */
  set<T>(key: string, data: T): Promise<void>;
  
  /**
   * 獲取數據
   * @param key 緩存鍵
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * 刪除數據
   * @param key 緩存鍵
   */
  remove(key: string): Promise<void>;
  
  /**
   * 清除所有緩存
   */
  clear(): Promise<void>;
  
  /**
   * 檢查鍵是否存在
   * @param key 緩存鍵
   */
  has(key: string): Promise<boolean>;
} 