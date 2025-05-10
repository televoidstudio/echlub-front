// Mock import.meta.env for Vite
global.import = {};
global.import.meta = { env: {} };
global.import.meta.env = {
  VITE_API_URL: 'https://test-api.echlub.com',
  MODE: 'test',
  DEV: true,
  PROD: false
};

// 在測試環境中模擬 ESBuild 添加的代碼覆蓋工具函數
// 這些函數在測試錯誤消息中出現
global.oo_oo = function() {
  return Array.prototype.slice.call(arguments);
};

global.oo_tx = function() {
  return Array.prototype.slice.call(arguments);
}; 