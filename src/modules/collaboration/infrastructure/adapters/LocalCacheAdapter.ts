import { injectable } from 'inversify';
import { ILocalCacheAdapter } from './ILocalCacheAdapter';

/**
 * 基於 IndexedDB 的本地緩存適配器
 */
@injectable()
export class LocalCacheAdapter implements ILocalCacheAdapter {
  private readonly DB_NAME = 'echlub_collaboration_cache';
  private readonly STORE_NAME = 'cache_store';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;
  
  constructor() {
    this.initDatabase().catch(error => {
      console.error('Failed to initialize IndexedDB:', error);
    });
  }
  
  /**
   * 初始化 IndexedDB 數據庫
   */
  private async initDatabase(): Promise<void> {
    if (this.db) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // 如果存儲對象不存在，創建一個新的
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }
  
  /**
   * 獲取數據庫事務
   * @param mode 事務模式
   */
  private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBTransaction> {
    if (!this.db) {
      await this.initDatabase();
    }
    
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    
    return this.db.transaction(this.STORE_NAME, mode);
  }
  
  /**
   * 獲取對象存儲
   * @param mode 事務模式
   */
  private async getObjectStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(mode);
    return transaction.objectStore(this.STORE_NAME);
  }
  
  /**
   * 存儲數據
   */
  async set<T>(key: string, data: T): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put({
        key,
        value: data,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * 獲取數據
   */
  async get<T>(key: string): Promise<T | null> {
    const store = await this.getObjectStore();
    
    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? data.value : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * 刪除數據
   */
  async remove(key: string): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * 清除所有緩存
   */
  async clear(): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * 檢查鍵是否存在
   */
  async has(key: string): Promise<boolean> {
    const store = await this.getObjectStore();
    
    return new Promise<boolean>((resolve, reject) => {
      const request = store.count(key);
      
      request.onsuccess = () => {
        resolve(request.result > 0);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
} 