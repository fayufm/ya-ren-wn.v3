// 服务器API配置
(function() {
  // 检查全局变量是否已经存在
  if (typeof window !== 'undefined' && window.API_ENDPOINTS) {
    return; // 如果已存在API_ENDPOINTS，直接返回，避免重复声明
  }
  
  const API_SERVER = window.location.origin || 'http://8.155.16.247:3000';

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
    ADMIN_DASHBOARD: `${API_SERVER}/api/admin/dashboard`,
    ADMIN_COMMISSIONS: `${API_SERVER}/api/admin/commissions`,
    ADMIN_MESSAGES: `${API_SERVER}/api/admin/messages`,
    ADMIN_GET_MESSAGES: `${API_SERVER}/api/admin/messages`,
    DELETE_COMMISSION: (id) => `${API_SERVER}/api/admin/commissions/${id}`,
    DELETE_MESSAGE: (commissionId, messageId) => `${API_SERVER}/api/admin/commissions/${commissionId}/messages/${messageId}`,
    DELETE_COMMISSION_FILE: (commissionId, fileIndex) => `${API_SERVER}/api/admin/commissions/${commissionId}/files/${fileIndex}`,
    UPDATE_RATINGS: (commissionId) => `${API_SERVER}/api/admin/commissions/${commissionId}/ratings`,
    ADMIN_SETTINGS: `${API_SERVER}/api/admin/settings`,
    ADMIN_CHANGE_PASSWORD: `${API_SERVER}/api/admin/change-password`,
    ADMIN_VERIFY: `${API_SERVER}/api/admin/verify`
  };

  // 将API_ENDPOINTS暴露到全局作用域
  if (typeof window !== 'undefined') {
    window.API_ENDPOINTS = API_ENDPOINTS;
  }
})(); 