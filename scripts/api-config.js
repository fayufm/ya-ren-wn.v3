// 服务器API配置
(function() {
  // 检查全局变量是否已经存在
  if (typeof window !== 'undefined' && window.API_ENDPOINTS) {
    return; // 如果已存在API_ENDPOINTS，直接返回，避免重复声明
  }
  
  const API_SERVER = 'http://8.155.16.247:3000';

  // API端点
  const API_ENDPOINTS = {
    // 委托相关
    GET_COMMISSIONS: `${API_SERVER}/api/commissions`,
    CREATE_COMMISSION: `${API_SERVER}/api/commissions`,
    GET_COMMISSION: (id) => `${API_SERVER}/api/commissions/${id}`,
    GET_MY_COMMISSIONS: (deviceId) => `${API_SERVER}/api/commissions?deviceId=${deviceId}`,
    
    // 消息相关
    GET_MESSAGES: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/messages`,
    ADD_MESSAGE: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/messages`,
    
    // 评分相关
    GET_RATINGS: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/ratings`,
    RATE_COMMISSION: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/rate`,
    
    // 健康检查
    HEALTH: `${API_SERVER}/health`,
    
    // 管理API
    ADMIN_DASHBOARD: `${API_SERVER}/admin/dashboard`,
    ADMIN_COMMISSIONS: `${API_SERVER}/admin/commissions`,
    ADMIN_MESSAGES: `${API_SERVER}/admin/messages`,
    ADMIN_GET_MESSAGES: `${API_SERVER}/admin/messages`,
    DELETE_COMMISSION: (id) => `${API_SERVER}/admin/commissions/${id}`,
    DELETE_MESSAGE: (commissionId, messageId) => `${API_SERVER}/admin/commissions/${commissionId}/messages/${messageId}`,
    DELETE_COMMISSION_FILE: (commissionId, fileIndex) => `${API_SERVER}/admin/commissions/${commissionId}/files/${fileIndex}`,
    UPDATE_RATINGS: (commissionId) => `${API_SERVER}/admin/commissions/${commissionId}/ratings`,
    ADMIN_SETTINGS: `${API_SERVER}/admin/settings`,
    ADMIN_CHANGE_PASSWORD: `${API_SERVER}/admin/change-password`
  };

  // 导出API配置
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      API_SERVER,
      API_ENDPOINTS
    };
  } else if (typeof window !== 'undefined') {
    // 在浏览器环境中，将API配置添加到全局window对象
    window.API_SERVER = API_SERVER;
    window.API_ENDPOINTS = API_ENDPOINTS;
  }
})(); 