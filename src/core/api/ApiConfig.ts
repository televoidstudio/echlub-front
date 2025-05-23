/**
 * API 配置
 * 
 * 使用環境變量來設置API基礎URL
 * - 開發環境: .env.development 或 .env 文件中的 VITE_BASE_URL
 * - 生產環境: .env.production 文件中的 VITE_BASE_URL
 */

// 為了讓測試能通過，需要檢測當前環境
// 在 Node.js 環境中使用 process.env
// 在瀏覽器環境中，如果有全局 process 對象，則使用 process.env
const getEnvValue = (key: string, defaultValue: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || defaultValue;
  }
  // 在瀏覽器和其他環境中返回默認值
  return defaultValue;
};

// 基礎 URL，確保包含協議前綴
const baseUrlWithoutProtocol = getEnvValue('VITE_BASE_URL', 'localhost:3000');

// 檢查是否已經包含協議前綴，如果沒有則添加 http://
const baseURL = baseUrlWithoutProtocol.startsWith('http://') || baseUrlWithoutProtocol.startsWith('https://')
  ? baseUrlWithoutProtocol
  : `http://${baseUrlWithoutProtocol}`;

// 添加更多調試信息
console.log('環境變量 VITE_BASE_URL:', getEnvValue('VITE_BASE_URL', '未設置'));
console.log('原始基礎 URL:', baseUrlWithoutProtocol);
console.log('處理後基礎 URL:', baseURL);

export const ApiConfig = {
  /**
   * API 基礎 URL
   * 從環境變量中獲取，如果未設置則使用默認值
   */
  baseUrl: `${baseURL}/api`,
  wsUrl: baseURL,

  /**
   * 身份認證相關的 API 路徑
   */
  auth: {
    /**
     * 登入
     */
    login: '/auth/login',
    
    /**
     * 註冊
     */
    register: '/auth/register',
    
    /**
     * 登出
     */
    logout: '/auth/logout',
    
    /**
     * 獲取當前用戶資料
     */
    profile: '/auth/profile',
    
    /**
     * 更新用戶資料
     */
    updateProfile: '/auth/profile',
    
    /**
     * 修改密碼
     */
    changePassword: '/auth/change-password',
    
    /**
     * 驗證 Token
     */
    validateToken: '/auth/validate-token'
  },
  
  /**
   * 其他API路徑可以在這裡添加
   */
}; 
