import { ILocalCacheAdapter } from "../../infrastructure/adapters/ILocalCacheAdapter";
import { injectable } from "inversify";

/**
 * 用於測試的本地緩存適配器模擬實現
 */
@injectable()
export class MockLocalCacheAdapter implements ILocalCacheAdapter {
  private storage: Map<string, any> = new Map();
  
  /**
   * 存儲數據
   */
  async set<T>(key: string, data: T): Promise<void> {
    this.storage.set(key, data);
  }
  
  /**
   * 獲取數據
   */
  async get<T>(key: string): Promise<T | null> {
    return this.storage.get(key) || null;
  }
  
  /**
   * 刪除數據
   */
  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  /**
   * 清除所有緩存
   */
  async clear(): Promise<void> {
    this.storage.clear();
  }
  
  /**
   * 檢查鍵是否存在
   */
  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }
  
  /**
   * 設置有過期時間的值
   */
  async setValueWithExpiry<T>(key: string, value: T, expirySeconds: number): Promise<void> {
    const item = {
      value,
      expiry: Date.now() + (expirySeconds * 1000)
    };
    this.storage.set(key, item);
  }
  
  /**
   * 獲取可能已過期的值
   */
  async getValueWithExpiry<T>(key: string): Promise<T | null> {
    const item = this.storage.get(key);
    
    if (!item) {
      return null;
    }
    
    // 檢查是否過期
    if (item.expiry && item.expiry < Date.now()) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }
} 