// 服务器API配置
const API_SERVER = 'http://8.155.16.247:3000';

// API端点
const API_ENDPOINTS = {
  // 委托相关
  GET_COMMISSIONS: `${API_SERVER}/api/commissions`,
  CREATE_COMMISSION: `${API_SERVER}/api/commissions`,
  GET_COMMISSION: (id) => `${API_SERVER}/api/commissions/${id}`,
  
  // 消息相关
  GET_MESSAGES: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/messages`,
  ADD_MESSAGE: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/messages`,
  
  // 评分相关
  GET_RATINGS: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/ratings`,
  RATE_COMMISSION: (commissionId) => `${API_SERVER}/api/commissions/${commissionId}/rate`,
  
  // 健康检查
  HEALTH: `${API_SERVER}/health`
};

module.exports = {
  API_SERVER,
  API_ENDPOINTS
}; 